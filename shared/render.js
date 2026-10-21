// ============================================================
// shared/render.js — 通用课程渲染器
// 把每章的 content 渲染成「目录 + 讲解/代码/演示三 tab + 小结 + 自测」页面
// 特性：双语切换、滚动目录高亮、学习进度、课程仪表板、代码复制、演示挂载
// ============================================================

import { celebrate } from "./confetti.js";
/* COURSE / courseDone 由 shared/course.js 以经典脚本形式挂在 window 上，
   经典脚本先于延迟执行的 module 运行，因此这里可以安全读取 */
const COURSE = window.COURSE;

const LANG_KEY = "wbl-locale";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 双语内联：返回两个 <span data-lang> 片段，由 CSS 控制显隐
function bi(zh, en) {
  return `<span data-lang="zh-CN">${zh}</span><span data-lang="en-US">${en ?? zh}</span>`;
}

// 单语言文本（用于属性等不能放 span 的场景）
function T(zh, en) {
  return currentLang() === "en-US" ? (en ?? zh) : zh;
}

function currentLang() {
  return (localStorage.getItem(LANG_KEY) || "zh-CN") === "en-US" ? "en-US" : "zh-CN";
}

// ---- 极简 JS 语法高亮 ----
function highlightCode(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  const KWS = new Set(["const", "let", "var", "function", "return", "new", "await",
    "typeof", "instanceof", "if", "else", "for", "while", "class", "extends", "import", "export", "default", "this"]);
  while (i < n) {
    const ch = src[i];
    if (ch === "/" && src[i + 1] === "/") {
      let j = i + 2;
      while (j < n && src[j] !== "\n") j++;
      out += `<span class="cmt">${esc(src.slice(i, j))}</span>`;
      i = j;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const q = ch;
      let j = i + 1;
      while (j < n) {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === q) { j++; break; }
        j++;
      }
      out += `<span class="str">${esc(src.slice(i, j))}</span>`;
      i = j;
    } else if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9._]/.test(src[j])) j++;
      out += `<span class="num">${src.slice(i, j)}</span>`;
      i = j;
    } else if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let k = j;
      while (k < n && src[k] === " ") k++;
      const isFn = k < n && src[k] === "(";
      const cls = KWS.has(word) ? "kw" : isFn ? "fn" : "";
      out += cls ? `<span class="${cls}">${word}</span>` : esc(word);
      i = j;
    } else {
      out += esc(ch);
      i++;
    }
  }
  return out;
}

// ---- 各类内容块的渲染 ----
function renderExplainBlocks(blocks) {
  if (!blocks) return "";
  return blocks.map((b) => {
    if (b.h) return `<h3>${bi(b.h.zh, b.h.en)}</h3>`;
    if (b.p) return `<p data-lang="zh-CN">${b.p.zh}</p><p data-lang="en-US">${b.p.en ?? b.p.zh}</p>`;
    if (b.note) return `<p class="note" data-lang="zh-CN">${b.note.zh}</p><p class="note" data-lang="en-US">${b.note.en ?? b.note.zh}</p>`;
    if (b.ul) return renderList(b.ul, "ul");
    if (b.ol) return renderList(b.ol, "ol");
    if (b.table) return renderTable(b.table);
    if (b.img) return `<p><img src="${b.img.src}" alt="${esc(b.img.alt || "")}" loading="lazy"></p>`;
    if (b.figure) {
      const cap = b.figure.caption
        ? `<figcaption data-lang="zh-CN">${b.figure.caption.zh}</figcaption><figcaption data-lang="en-US">${b.figure.caption.en ?? b.figure.caption.zh}</figcaption>`
        : "";
      return `<figure class="theory-figure"><img src="${b.figure.src}" alt="${esc(b.figure.alt || "")}" loading="lazy">${cap}</figure>`;
    }
    // 讲解中内联的代码片段（无标题，直接渲染成代码块）
    if (b.code) {
      const code = b.code.code.replace(/^\s*\n/, "").replace(/\s+$/, "");
      let star = "";
      let src = code;
      if (src.startsWith("⭐")) { star = '<span class="star">⭐</span> '; src = src.slice(1).replace(/^\s/, ""); }
      return `<div class="code-block"><pre><code>${star}${highlightCode(src)}</code></pre></div>`;
    }
    if (b.demo) return `<div class="demo-mount" data-demo="${b.demo.id}" data-inline="1"></div>`;
    return "";
  }).join("");
}

function renderList(item, tag) {
  const zh = item.zh.map((x) => `<li>${x}</li>`).join("");
  const en = item.en.map((x) => `<li>${x}</li>`).join("");
  return `<${tag} data-lang="zh-CN">${zh}</${tag}><${tag} data-lang="en-US">${en}</${tag}>`;
}

function renderTable(t) {
  const make = (head, rows) => {
    const th = head.map((c) => `<th>${c}</th>`).join("");
    const trs = rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("");
    return `<table class="table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
  };
  const zh = make(t.head.zh, t.rows.map((r) => r.zh));
  const en = make(t.head.en, t.rows.map((r) => r.en ?? r.zh));
  return `<div data-lang="zh-CN">${zh}</div><div data-lang="en-US">${en}</div>`;
}

function renderCodeBlocks(codeBlocks) {
  if (!codeBlocks) return "";
  return codeBlocks.map((c) => {
    let code = c.code.replace(/^\s*\n/, "").replace(/\s+$/, "");
    let star = "";
    if (code.startsWith("⭐")) { star = '<span class="star">⭐</span> '; code = code.slice(1).replace(/^\s/, ""); }
    return `
      <h3>${bi(c.title.zh, c.title.en)}</h3>
      ${c.purpose ? `<p class="code-purpose" data-lang="zh-CN">${c.purpose.zh}</p><p class="code-purpose" data-lang="en-US">${c.purpose.en ?? c.purpose.zh}</p>` : ""}
      <div class="code-block">
        <div class="code-head"><span class="lang">JavaScript</span><button class="copy-btn" type="button">${bi("复制", "Copy")}</button></div>
        <pre><code>${star}${highlightCode(code)}</code></pre>
      </div>
      ${c.points ? `<p class="key-point" data-lang="zh-CN">${c.points.zh}</p><p class="key-point" data-lang="en-US">${c.points.en ?? c.points.zh}</p>` : ""}`;
  }).join("");
}

function renderQuiz(quiz) {
  if (!quiz || !quiz.length) return "";
  const items = quiz.map((q, qi) => {
    const zhOpts = q.options.zh || q.options.en;
    const opts = zhOpts.map((o, oi) => {
      const en = (q.options.en && q.options.en[oi]) || o;
      return `<button class="opt" data-q="${qi}" data-o="${oi}" type="button">${bi(o, en)}<span class="mark"></span></button>`;
    }).join("");
    return `<div class="q" data-answer="${q.answer}"><p class="q-text">${bi(q.q.zh, q.q.en)}</p><div class="opts">${opts}</div></div>`;
  }).join("");
  return `<div class="quiz"><div class="quiz-title">${bi("🧪 自测题", "🧪 Self-Check")}</div>${items}</div>`;
}

// ============================================================
// 课程仪表板：五等分圆环，一章一段，学完一章点亮一段
// ============================================================
const CHAPTER_COLORS = ["#E4572E", "#C9852B", "#2E6B4F", "#3D5A80", "#7B4B6B"];
const CELEBRATED_KEY = "wbl-course-celebrated";

/** 当前页属于哪一章：由小节 id 前缀推出（ch-3-1 → ch-3） */
function currentChapterKey(sections) {
  const first = sections[0] && sections[0].id;
  return first ? String(first).replace(/-\d+$/, "") : "";
}

/** 从全局进度里数出某章已完成的小节数 */
function chapterDone(done, key) {
  let n = 0;
  done.forEach((id) => { if (String(id).startsWith(key + "-")) n++; });
  return n;
}

function courseDash(sections) {
  const chapters = COURSE.chapters;
  const current = currentChapterKey(sections);
  const R = 38;
  const C = 2 * Math.PI * R;
  const gap = C * 0.018;          /* 段与段之间留一点缝 */
  const seg = (C - gap * chapters.length) / chapters.length;
  const step = C / chapters.length;

  const arcs = chapters.map((ch, i) => {
    const offset = -(i * step);
    const label = `${T(ch.title.zh, ch.title.en)}（${ch.total} 节）`;
    return `<circle class="dash-seg" data-ch="${ch.key}"${ch.key === current ? ' data-current="1"' : ""} cx="54" cy="54" r="${R}" fill="none" stroke-width="13" stroke-linecap="round" stroke-dasharray="${seg.toFixed(2)} ${(C + seg).toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 54 54)"><title>${label}</title></circle>`;
  }).join("");

  const dots = chapters.map((ch, i) =>
    `<span class="dash-dot" data-ch="${ch.key}" style="--c:${CHAPTER_COLORS[i % CHAPTER_COLORS.length]}" title="${T(ch.title.zh, ch.title.en)}"></span>`
  ).join("");

  /* 底圈：让未点亮时圆环的形状依然可辨（段本身仍是白的） */
  const track = `<circle class="dash-track" cx="54" cy="54" r="${R}" fill="none" stroke-width="13"></circle>`;

  return `
    <div class="course-dash" data-course-dash>
      <p class="dash-caption">${bi("课程仪表板", "Course dashboard")}</p>
      <div class="dash-ring">
        <svg viewBox="0 0 108 108" width="108" height="108" role="img" aria-label="${T("五章学习进度环", "Five-chapter progress ring")}">${track}${arcs}</svg>
        <div class="dash-center">
          <strong data-dash-pct>0%</strong>
          <span>${bi("已学完", "chapters")}</span>
        </div>
      </div>
      <p class="dash-dots">${dots}</p>
      <p class="dash-congrats" data-dash-congrats hidden>🎉 ${bi("恭喜学完本课程", "Congratulations — course complete!")}</p>
      <button class="dash-reset" type="button" data-dash-reset>${bi("重置进度", "Reset progress")}</button>
    </div>`;
}

/** 按已完成的小节 id 集合刷新仪表板；全部学完时撒一次彩带 */
function wireDash(root, sections, done) {
  const dash = root.querySelector("[data-course-dash]");
  if (!dash) return;
  const chapters = COURSE.chapters;
  const segs = [...dash.querySelectorAll(".dash-seg")];
  const pctEl = dash.querySelector("[data-dash-pct]");
  const congrats = dash.querySelector("[data-dash-congrats]");

  const refresh = () => {
    const lit = chapters.map((ch, i) => {
      const complete = chapterDone(done, ch.key) >= ch.total;
      if (segs[i]) segs[i].style.stroke = complete ? CHAPTER_COLORS[i % CHAPTER_COLORS.length] : "";
      return complete;
    });
    const finished = lit.filter(Boolean).length;
    const allDone = lit.every(Boolean);

    dash.querySelectorAll(".dash-dot").forEach((dot, i) => dot.classList.toggle("lit", lit[i]));
    if (pctEl) pctEl.textContent = Math.round((finished / chapters.length) * 100) + "%";
    if (congrats) congrats.hidden = !allDone;

    if (allDone && localStorage.getItem(CELEBRATED_KEY) !== "1") {
      localStorage.setItem(CELEBRATED_KEY, "1");
      celebrate(6000);
    }
  };

  dash.querySelector("[data-dash-reset]").addEventListener("click", () => {
    done.clear();
    localStorage.setItem("wbl-lesson-progress", "[]");
    localStorage.removeItem(CELEBRATED_KEY);
    root.querySelectorAll(".toc-link").forEach((a) => a.classList.remove("done"));
    const fill = root.querySelector(".progress-fill");
    const label = root.querySelector("[data-progress]");
    if (fill) fill.style.width = "0%";
    if (label) label.textContent = `0 / ${sections.length}`;
    refresh();
  });

  return refresh;
}

// ---- 主渲染 ----
export function renderLesson(data, opts = {}) {
  const demos = opts.demos || {};
  const root = opts.root || document.getElementById("app");
  document.documentElement.lang = currentLang();

  const sections = data.sections || [];
  const tocItems = sections.map((s, i) => `
    <li><a href="#${s.id}" class="toc-link ${i === 0 ? "active" : ""}" data-sec="${s.id}">
      <span class="check" title="${esc(T("标记完成", "Mark done"))}">✓</span>
      <span>${bi(s.title.zh, s.title.en)}</span>
    </a></li>`).join("");

  const secsHtml = sections.map((s) => `
    <section class="sec" id="${s.id}">
      <div class="sec-head">
        <h2>${bi(s.title.zh, s.title.en)}</h2>
        <p class="sec-subtitle">${bi(s.subtitle ? s.subtitle.zh : "", s.subtitle ? s.subtitle.en : "")}</p>
        ${s.objectives ? `<div class="objectives"><strong>${bi("🎯 学习目标", "🎯 Objectives")}</strong><ol>${s.objectives.zh.map((o, i) => `<li>${bi(o, (s.objectives.en && s.objectives.en[i]) || o)}</li>`).join("")}</ol></div>` : ""}
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="explain" type="button">${bi("📖 讲解", "📖 Explain")}</button>
        <button class="tab-btn" data-tab="code" type="button">${bi("⌨️ 关键代码", "⌨️ Code")}</button>
        ${s.demo ? `<button class="tab-btn" data-tab="demo" type="button">${bi("▶️ 演示", "▶️ Demo")}</button>` : ""}
      </div>
      <div class="panel explain active">${renderExplainBlocks(s.explain)}</div>
      ${s.code ? `<div class="panel code">${renderCodeBlocks(s.code)}</div>` : ""}
      ${s.demo ? `<div class="panel demo">${s.demo.hint ? `<p class="demo-hint" data-lang="zh-CN">${s.demo.hint.zh}</p><p class="demo-hint" data-lang="en-US">${s.demo.hint.en ?? s.demo.hint.zh}</p>` : ""}<div class="demo-mount" data-demo="${s.demo.id}"></div></div>` : ""}
      ${s.summary ? `<div class="summary"><strong>${bi("📌 小结", "📌 Summary")}</strong> ${bi(s.summary.zh, s.summary.en)}</div>` : ""}
      ${renderQuiz(s.quiz)}
    </section>`).join("");

  const meta = data.meta || {};
  const prevBtn = meta.prev
    ? `<a class="pager-btn" href="${meta.prev.href}">← <span>${bi(meta.prev.label.zh, meta.prev.label.en)}</span></a>`
    : `<span class="pager-btn disabled">← <span>${bi("已是第一章", "First chapter")}</span></span>`;
  const nextBtn = meta.next
    ? `<a class="pager-btn" href="${meta.next.href}"><span>${bi(meta.next.label.zh, meta.next.label.en)}</span> →</a>`
    : `<span class="pager-btn disabled"><span>${bi("已是最后一章", "Last chapter")}</span> →</span>`;

  root.innerHTML = `
    <nav class="course-topbar">
      <a class="brand" href="../"><span class="back">←</span><span>${bi("课程门户", "Course Portal")}</span></a>
      <div class="breadcrumb"><strong>${bi(meta.navLabel.zh, meta.navLabel.en)}</strong></div>
      <div class="topbar-actions">${prevBtn}<button class="lang-toggle" type="button">${bi("EN", "中文")}</button>${nextBtn}</div>
    </nav>
    <div class="lesson-layout">
      <aside class="toc">
        <h3>${bi("章节目录", "Contents")}</h3>
        <div class="progress-track"><div class="progress-fill"></div></div>
        <p class="progress-label" data-progress>0 / ${sections.length}</p>
        <ul>${tocItems}</ul>
        <div class="toc-foot">
          <a href="./lecture.md" target="_blank">${bi("↗ 完整讲义 markdown", "↗ Full lecture markdown")}</a>
          <a href="../supplementary/#第-1-章-数据" target="_blank">${bi("↗ 补充 demo 集合", "↗ Supplementary demos")}</a>
        </div>
        ${courseDash(sections)}
      </aside>
      <main class="content">
        <header class="lesson-header">
          <h1>${bi(meta.title.zh, meta.title.en)}</h1>
          <p class="lesson-subtitle">${bi(meta.subtitle ? meta.subtitle.zh : "", meta.subtitle ? meta.subtitle.en : "")}</p>
        </header>
        ${secsHtml}
        <nav class="lesson-pager" aria-label="章节翻页">
          ${meta.prev ? `<a class="pager-prev" href="${meta.prev.href}"><span class="pager-dir">${bi("← 上一章", "← Previous")}</span><span class="pager-title">${bi(meta.prev.label.zh, meta.prev.label.en)}</span></a>` : `<span class="pager-prev empty"></span>`}
          <a class="pager-portal" href="../">${bi("课程门户", "Course Portal")}</a>
          ${meta.next ? `<a class="pager-next" href="${meta.next.href}"><span class="pager-dir">${bi("下一章 →", "Next →")}</span><span class="pager-title">${bi(meta.next.label.zh, meta.next.label.en)}</span></a>` : `<span class="pager-next empty"></span>`}
        </nav>
        <footer class="lesson-footer">${bi("零依赖 · D3.js v7（本地）· 原生 JS · 可独立运行", "Zero dependencies · D3.js v7 (local) · Vanilla JS · Standalone")}</footer>
      </main>
    </div>`;

  wireEvents(root, demos, sections.length, sections);

  // 右侧全局课堂笔记（可附图片），五章共用同一份数据
  import("./notes.js");
}

function wireEvents(root, demos, total, sections) {
  // 1) Tab 切换 + 演示懒挂载
  root.querySelectorAll(".sec").forEach((sec) => {
    sec.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        sec.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b === btn));
        const tab = btn.dataset.tab;
        sec.querySelectorAll(".panel").forEach((p) => p.classList.toggle("active", p.classList.contains(tab)));
        if (tab === "demo") {
          const mount = sec.querySelector(".demo-mount");
          if (mount) mountDemo(mount, demos);
        }
      });
    });
  });

  // 1.5) 挂载所有演示（讲解 tab 内联概念图 + 演示 tab 交互 demo）
  root.querySelectorAll(".demo-mount").forEach((mount) => mountDemo(mount, demos));

  // 2) 语言切换
  const langBtn = root.querySelector(".lang-toggle");
  if (langBtn) langBtn.addEventListener("click", () => {
    const next = currentLang() === "zh-CN" ? "en-US" : "zh-CN";
    localStorage.setItem(LANG_KEY, next);
    document.documentElement.lang = next;
    langBtn.textContent = next === "zh-CN" ? "EN" : "中文";
  });

  // 3) 代码复制
  root.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.closest(".code-block").querySelector("code").textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.classList.add("copied");
        btn.textContent = currentLang() === "zh-CN" ? "已复制 ✓" : "Copied ✓";
        setTimeout(() => { btn.classList.remove("copied"); btn.textContent = currentLang() === "zh-CN" ? "复制" : "Copy"; }, 1500);
      }).catch(() => {});
    });
  });

  // 4) 目录完成勾选 + 进度
  const done = new Set(JSON.parse(localStorage.getItem("wbl-lesson-progress") || "[]"));
  /* done 里存着全部五章的小节 id，而进度条只描述本章，
     所以分母和分子都必须限定在「本章小节」内，否则会出现 27 / 5 这种越界数字 */
  const sectionIds = new Set(sections.map((s) => s.id));
  const doneHere = () => [...done].filter((id) => sectionIds.has(id)).length;

  const refreshDash = wireDash(root, sections, done);
  const updateProgress = () => {
    const n = doneHere();
    const pct = total ? Math.round((n / total) * 100) : 0;
    root.querySelector(".progress-fill").style.width = pct + "%";
    const label = root.querySelector("[data-progress]");
    if (label) label.textContent = `${n} / ${total}`;
    root.querySelectorAll(".toc-link").forEach((a) => a.classList.toggle("done", done.has(a.dataset.sec)));
    if (refreshDash) refreshDash();
  };
  root.querySelectorAll(".toc-link").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.closest(".check")) {
        const id = a.dataset.sec;
        if (done.has(id)) done.delete(id); else done.add(id);
        localStorage.setItem("wbl-lesson-progress", JSON.stringify([...done]));
        updateProgress();
        return;
      }
      const target = document.getElementById(a.dataset.sec);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#" + a.dataset.sec);
    });
  });
  updateProgress();

  // 5) 滚动高亮（scrollspy）
  const links = [...root.querySelectorAll(".toc-link")];
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.dataset.sec === en.target.id));
    });
  }, { rootMargin: "-15% 0px -70% 0px" });
  root.querySelectorAll(".sec").forEach((s) => obs.observe(s));

  // 6) 自测题
  root.querySelectorAll(".quiz .opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.closest(".q");
      const answer = +q.dataset.answer;
      const chosen = +btn.dataset.o;
      q.querySelectorAll(".opt").forEach((o, oi) => {
        o.disabled = true;
        if (oi === answer) { o.classList.add("correct"); o.querySelector(".mark").textContent = "✓"; }
        else if (oi === chosen) { o.classList.add("wrong"); o.querySelector(".mark").textContent = "✗"; }
      });
    });
  });

  // 7) URL hash 定位
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    const t = root.querySelector("#" + CSS.escape(id));
    if (t) setTimeout(() => t.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
}

function mountDemo(mount, demos) {
  if (!mount || mount.dataset.rendered) return;
  const name = mount.dataset.demo;
  const fn = demos[name];
  if (fn) { fn(mount); mount.dataset.rendered = "1"; }
}
