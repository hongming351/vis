/* ============================================================
 * lesson.js — 课程页运行时
 * ------------------------------------------------------------
 * 依赖：courses.js（window.COURSES）
 * 能力：
 *   - 代码逐步执行：new Function + with(Proxy) 捕获作用域
 *   - 行级高亮 + 悬停行号显示该行在做什么
 *   - 变量面板实时更新，数组方块可视化，变化时卡片闪动
 *   - 控制台输出逐条出现
 *   - 键盘 ← → 步进，遵循 prefers-reduced-motion
 *   - 可编辑练习区 + 自动检查
 *   - 小测验即时反馈 + 解析
 *   - localStorage 学习进度
 * ============================================================ */

(function () {
  "use strict";

  const COURSES = window.COURSES || [];
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const STORE_KEY = "warm-progress-v1";

  /* ---------- URL 参数 ---------- */
  const params = new URLSearchParams(location.search);
  const courseId = params.get("c") || (COURSES[0] && COURSES[0].id);
  const lessonId = params.get("l");

  const course = COURSES.find((c) => c.id === courseId) || COURSES[0];
  const flat = [];
  COURSES.forEach((c) => c.lessons.forEach((l) => flat.push({ c: c, l: l })));
  let idx = flat.findIndex((x) => x.l.id === lessonId && x.c.id === course.id);
  if (idx < 0) idx = flat.findIndex((x) => x.c.id === course.id);
  if (idx < 0) idx = 0;
  const current = flat[idx];
  const lesson = current.l;
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;

  /* ---------- 进度 ---------- */
  const progress = loadProgress();
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(progress)); }
    catch (e) { /* 隐私模式下忽略 */ }
  }
  progress[lesson.id] = progress[lesson.id] || { visited: true, exercise: false, quiz: 0, quizTotal: lesson.quiz.length, done: false };
  progress[lesson.id].visited = true;
  saveProgress();

  /* ---------- DOM 工具 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  /* ---------- 语法高亮 ---------- */
  const TOKEN = /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*')|("(?:[^"\\]|\\.)*")|(\b\d+(?:\.\d+)?\b)|\b(const|let|var|function|return|if|else|for|while|do|new|typeof|instanceof|null|true|false|undefined|in|of|this|break|continue)\b/g;
  function highlight(src) {
    let out = "", last = 0, m;
    TOKEN.lastIndex = 0;
    while ((m = TOKEN.exec(src))) {
      out += esc(src.slice(last, m.index));
      const cls = m[1] ? "cmt" : m[2] || m[3] ? "str" : m[4] ? "num" : "kw";
      out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
      last = m.index + m[0].length;
    }
    return out + esc(src.slice(last));
  }

  /* ---------- 渲染：页头 ---------- */
  document.title = lesson.title + " · " + course.title + " · 温暖编辑式学习空间";
  $("#crumb-course").textContent = course.chapter + " " + course.title;
  $("#crumb-course").setAttribute("href", "index.html#" + course.id);
  $("#crumb-lesson").textContent = "第 " + lesson.index + " 节 / 共 " + course.lessons.length + " 节";
  $("#lesson-index").textContent = String(lesson.index).padStart(2, "0");
  $("#lesson-title").textContent = lesson.title;
  $("#lesson-en").textContent = lesson.titleEn;
  $("#lesson-intro").textContent = lesson.intro;
  $("#exercise-prompt").textContent = lesson.exercise.prompt;
  const pointsEl = $("#lesson-points");
  lesson.points.forEach((p) => pointsEl.appendChild(el("li", null, esc(p))));

  /* ---------- 渲染：代码块 ---------- */
  const codeLines = $("#code-lines");
  const lineNodes = [];
  lesson.code.forEach((raw, i) => {
    const n = i + 1;
    const note = lesson.annotations[i];
    const row = el("div", "code-line");
    row.dataset.n = n;
    const ln = el("button", "ln", n);
    ln.type = "button";
    ln.setAttribute("aria-label", "第 " + n + " 行" + (note ? "：" + note : ""));
    if (note) {
      ln.dataset.note = note;
      ln.classList.add("has-note");
      ln.addEventListener("mouseenter", () => showTip(ln, note));
      ln.addEventListener("focus", () => showTip(ln, note));
      ln.addEventListener("mouseleave", hideTip);
      ln.addEventListener("blur", hideTip);
    }
    const code = el("code", "cl", highlight(raw));
    row.appendChild(ln);
    row.appendChild(code);
    codeLines.appendChild(row);
    lineNodes.push(row);
  });

  /* 行号悬停提示 */
  const tip = $("#line-tip");
  function showTip(anchor, text) {
    tip.textContent = text;
    tip.hidden = false;
    const r = anchor.getBoundingClientRect();
    tip.style.top = (window.scrollY + r.top - tip.offsetHeight - 8) + "px";
    tip.style.left = Math.min(window.scrollX + r.left, window.innerWidth - tip.offsetWidth - 12) + "px";
  }
  function hideTip() { tip.hidden = true; }

  /* ---------- 变量面板 ---------- */
  const varList = $("#var-list");
  const varEmpty = $("#var-empty");
  let lastSnapshot = {};

  function typeOf(v) {
    if (v === null) return "null";
    if (Array.isArray(v)) return "array";
    if (v instanceof Date) return "date";
    return typeof v;
  }
  function preview(v) {
    const t = typeOf(v);
    if (t === "string") return '"' + (v.length > 28 ? v.slice(0, 28) + "…" : v) + '"';
    if (t === "number") return Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/0+$/, "");
    if (t === "boolean") return String(v);
    if (t === "null" || t === "undefined") return String(v);
    if (t === "function") return "ƒ " + (v.name || "anonymous") + "()";
    if (t === "date") return v.toISOString().slice(0, 10);
    if (t === "array") return "[" + v.length + " 项]";
    if (t === "object") {
      const keys = Object.keys(v);
      return "{" + keys.slice(0, 3).join(", ") + (keys.length > 3 ? ", …" : "") + "}";
    }
    return String(v);
  }
  function fullPreview(v) {
    try {
      const j = JSON.stringify(v);
      return j && j.length > 90 ? j.slice(0, 90) + "…" : j;
    } catch (e) { return preview(v); }
  }

  /* 数组方块可视化 */
  function arrayBlocks(arr) {
    const box = el("div", "blocks");
    const limit = 18;
    const nums = arr.every((x) => typeof x === "number");
    let lo = Infinity, hi = -Infinity;
    if (nums) arr.forEach((x) => { if (x < lo) lo = x; if (x > hi) hi = x; });
    arr.slice(0, limit).forEach((v, i) => {
      const b = el("span", "block", String(v).length > 4 ? "…" : String(v));
      b.title = "[" + i + "] = " + fullPreview(v);
      if (nums && hi > lo) {
        const t = (v - lo) / (hi - lo);
        b.style.background = "hsl(" + Math.round(18 + t * 26) + " " + Math.round(58 + t * 32) + "% " + Math.round(74 - t * 34) + "%)";
      } else {
        b.style.background = "hsl(" + Math.round(28 + (i / Math.max(1, arr.length - 1)) * 200) + " 44% 82%)";
      }
      box.appendChild(b);
    });
    if (arr.length > limit) box.appendChild(el("span", "more", "+" + (arr.length - limit)));
    return box;
  }

  function renderVars(scope, changedKeys) {
    varList.innerHTML = "";
    const keys = Object.keys(scope).filter((k) => !k.startsWith("__"));
    if (!keys.length) { varEmpty.hidden = false; return; }
    varEmpty.hidden = true;
    keys.forEach((k) => {
      const v = scope[k];
      const card = el("div", "var-card" + (changedKeys && changedKeys.has(k) ? " flash" : ""));
      card.appendChild(el("span", "var-name", esc(k)));
      card.appendChild(el("span", "var-type", esc(typeOf(v))));
      card.appendChild(el("span", "var-value", esc(preview(v))));
      if (Array.isArray(v) && v.length) card.appendChild(arrayBlocks(v));
      card.title = k + " = " + fullPreview(v);
      varList.appendChild(card);
    });
  }

  /* ---------- 控制台 ---------- */
  const consoleOut = $("#console-out");
  const consoleEmpty = $("#console-empty");
  let logCount = 0;
  function fakeConsole() {
    const api = {
      log: (...a) => pushLog(a.join(" ")),
      info: (...a) => pushLog(a.join(" ")),
      warn: (...a) => pushLog("⚠ " + a.join(" ")),
      error: (...a) => pushLog("✖ " + a.join(" ")),
      table: (...a) => pushLog("[table] " + a.map(fmt).join(" | ")),
    };
    return api;
  }
  function fmt(v) {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function pushLog(text) {
    consoleEmpty.hidden = true;
    const line = el("div", "log-line", esc(text));
    consoleOut.appendChild(line);
    if (!REDUCED) {
      line.style.animation = "logIn .3s cubic-bezier(.2,.8,.2,1) both";
    }
    logCount++;
    consoleOut.scrollTop = consoleOut.scrollHeight;
  }

  /* ---------- 逐步执行引擎 ---------- */
  let activeLine = 0;
  let resolver = null;
  let autoTimer = null;
  let finished = false;

  function setActive(n) {
    activeLine = n;
    lineNodes.forEach((row) => row.classList.toggle("active", Number(row.dataset.n) === n));
    const row = lineNodes[n - 1];
    if (row) row.scrollIntoView({ block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
    const note = lesson.annotations[n - 1];
    $("#step-note").textContent = note || "（这一行没有额外说明）";
    $("#step-counter").textContent = "行 " + Math.min(n, lesson.code.length) + " / " + lesson.code.length;
  }

  function diffScope(scope) {
    const changed = new Set();
    Object.keys(scope).forEach((k) => {
      if (k.startsWith("__")) return;
      const a = lastSnapshot[k], b = scope[k];
      if (a !== b && JSON.stringify(a) !== JSON.stringify(b)) changed.add(k);
    });
    lastSnapshot = {};
    Object.keys(scope).forEach((k) => { if (!k.startsWith("__")) lastSnapshot[k] = scope[k]; });
    return changed;
  }

  function instrument(lines) {
    let out = "";
    lines.forEach((raw, i) => {
      out += "await __mark(" + (i + 1) + ");\n" + raw + "\n";
    });
    out += "await __mark(" + (lines.length + 1) + ");\n";
    return out;
  }

  const TOTAL = lesson.code.length;
  const markCounts = {};

  async function mark(n) {
    /* 结束哨兵：渲染最终状态 */
    if (n > TOTAL) {
      const changed = diffScope(sandboxScope);
      renderVars(sandboxScope, changed);
      finish();
      return;
    }
    /* 循环体每一轮都会重新触发 mark。若每轮都暂停，
       一个 371 次的日历循环要点击上百次。这里只在前两轮暂停，
       足够看清变量怎么变，又不会把人困在循环里。 */
    markCounts[n] = (markCounts[n] || 0) + 1;
    if (markCounts[n] > 2) return;

    const changed = n > 1 ? diffScope(sandboxScope) : new Set();
    renderVars(sandboxScope, changed);
    setActive(n);
    await new Promise((res) => { resolver = res; });
  }

  let sandboxScope = null;

  function buildRunner() {
    const scope = {};
    sandboxScope = scope;
    const proxy = new Proxy(scope, {
      set(t, k, v) { t[k] = v; return true; },
      get(t, k) {
        if (k in t) return t[k];
        if (k === "console") return fakeConsole();
        return globalThis[k];
      },
      has() { return true; },
    });
    /* with(__scope__) 会让 __scope__ / __mark 也走进 Proxy，
       因此必须预先播种，否则取到 undefined */
    scope.__scope__ = proxy;
    scope.__mark = mark;
    const body = instrument(lesson.code);
    /* eslint-disable no-new-func */
    const fn = new Function("__scope", "__mark",
      "return (async function(){ with(__scope){ " + body + " } })();");
    return () => fn(proxy, mark);
  }

  const btnPlay = $("#btn-play");
  const btnAuto = $("#btn-auto");
  const btnReset = $("#btn-reset");

  function updateButtons() {
    btnPlay.disabled = finished || !resolver;
    btnPlay.textContent = finished ? "已执行完毕 ✓" : "下一步 →";
    btnAuto.textContent = autoTimer ? "暂停自动" : "自动播放";
    btnAuto.disabled = finished;
  }

  function stepForward() {
    if (!resolver || finished) return;
    const r = resolver;
    resolver = null;
    r();
    updateButtons();
  }

  btnPlay.addEventListener("click", stepForward);
  btnReset.addEventListener("click", () => resetRunner());
  btnAuto.addEventListener("click", () => toggleAuto());

  function toggleAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
      updateButtons();
      return;
    }
    if (finished) resetRunner();
    autoTimer = setInterval(() => {
      if (!resolver) { clearInterval(autoTimer); autoTimer = null; updateButtons(); return; }
      stepForward();
    }, REDUCED ? 250 : 900);
    updateButtons();
  }

  function resetRunner() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    resolver = null;
    finished = false;
    consoleOut.innerHTML = "";
    consoleEmpty.hidden = false;
    logCount = 0;
    lastSnapshot = {};
    varList.innerHTML = "";
    varEmpty.hidden = false;
    lineNodes.forEach((r) => r.classList.remove("active", "error"));
    const run = buildRunner();
    setActive(0);
    $("#step-note").textContent = "点击「下一步」开始逐行执行";
    updateButtons();
    run().catch((err) => onError(err));
  }

  function finish() {
    if (finished) return;
    finished = true;
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    const changed = diffScope(sandboxScope || {});
    renderVars(sandboxScope || {}, changed);
    $("#step-note").textContent = "全部 " + TOTAL + " 行执行完毕。";
    updateButtons();
  }

  function onError(err) {
    if (finished) return;
    finished = true;
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    const n = activeLine || 1;
    const row = lineNodes[n - 1];
    if (row) row.classList.add("error");
    pushLog("运行错误（第 " + n + " 行）：" + err.message);
    $("#step-note").textContent = "第 " + n + " 行出错：" + err.message;
    updateButtons();
  }

  /* 键盘步进：→ 下一步，空格 播放/暂停 */
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement) return;
    if (e.key === "ArrowRight") { e.preventDefault(); stepForward(); }
    else if (e.key === " ") { e.preventDefault(); toggleAuto(); }
  });

  updateButtons();
  setActive(0);
  const firstRun = buildRunner();
  firstRun().catch((err) => onError(err));

  /* ---------- 练习区 ---------- */
  const exArea = $("#exercise-code");
  exArea.value = lesson.exercise.starter.join("\n");
  const exResult = $("#exercise-result");
  const exChecks = $("#exercise-checks");

  $("#btn-run-ex").addEventListener("click", runExercise);
  $("#btn-reset-ex").addEventListener("click", () => { exArea.value = lesson.exercise.starter.join("\n"); exResult.hidden = true; });

  function runExercise() {
    exResult.hidden = false;
    exResult.className = "ex-result";
    exChecks.innerHTML = "";
    let scope;
    const logs = [];
    const proxy = new Proxy((scope = {}), {
      set(t, k, v) { t[k] = v; return true; },
      get(t, k) {
        if (k in t) return t[k];
        if (k === "console") return { log: (...a) => logs.push(a.join(" ")), table: () => {}, warn: (...a) => logs.push(a.join(" ")), error: (...a) => logs.push(a.join(" ")) };
        return globalThis[k];
      },
      has() { return true; },
    });
    try {
      new Function("__scope", "with(__scope){ " + exArea.value + "\n }")(proxy);
    } catch (err) {
      exResult.classList.add("fail");
      exResult.textContent = "代码运行出错：" + err.message;
      return;
    }
    let pass = 0;
    lesson.exercise.checks.forEach((ck) => {
      let v, ok = false;
      try { v = new Function("__scope", "with(__scope){ return (" + ck.expr + "); }")(proxy); ok = JSON.stringify(v) === JSON.stringify(ck.expect); }
      catch (e) { ok = false; }
      if (ok) pass++;
      const row = el("div", "check-row " + (ok ? "ok" : "bad"));
      row.appendChild(el("span", "mark", ok ? "✓" : "✗"));
      row.appendChild(el("span", "label", esc(ck.label)));
      if (!ok) {
        row.appendChild(el("span", "hint", "期望 " + esc(ck.expect) + "，得到 " + esc(fmt(v))));
        if (ck.note) row.appendChild(el("span", "note", esc(ck.note)));
      }
      exChecks.appendChild(row);
    });
    const allOk = pass === lesson.exercise.checks.length;
    exResult.classList.add(allOk ? "pass" : "fail");
    exResult.textContent = allOk
      ? "全部通过（" + pass + "/" + lesson.exercise.checks.length + "）——可以进入下一节了。"
      : "通过 " + pass + "/" + lesson.exercise.checks.length + "，还有检查项没过。";
    progress[lesson.id].exercise = allOk;
    saveProgress();
    refreshDone();
  }

  /* ---------- 测验 ---------- */
  const quizBox = $("#quiz");
  lesson.quiz.forEach((q, qi) => {
    const card = el("div", "quiz-card");
    card.appendChild(el("p", "quiz-q", esc(q.q)));
    const opts = el("div", "opts");
    const state = { answered: false };
    q.options.forEach((opt, oi) => {
      const b = el("button", "opt", esc(opt));
      b.type = "button";
      b.addEventListener("click", () => {
        if (state.answered) return;
        state.answered = true;
        const correct = oi === q.answer;
        b.classList.add(correct ? "correct" : "wrong");
        opts.querySelectorAll(".opt").forEach((x, xi) => {
          x.disabled = true;
          if (xi === q.answer) x.classList.add("correct");
        });
        const ex = el("p", "quiz-explain", esc(q.explain));
        card.appendChild(ex);
        if (correct) {
          progress[lesson.id].quiz = (progress[lesson.id].quiz || 0) + 1;
          saveProgress();
          refreshDone();
        }
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    quizBox.appendChild(card);
  });

  function refreshDone() {
    const p = progress[lesson.id];
    p.quizTotal = lesson.quiz.length;
    const done = p.exercise && p.quiz >= p.quizTotal;
    p.done = done;
    saveProgress();
    const badge = $("#done-badge");
    badge.textContent = done ? "✓ 本节课已完成" : "完成练习并答对全部小测验即可标记完成";
    badge.className = "done-badge " + (done ? "done" : "");
    /* 顶部小进度环：练习 1/2 + 测验 1/2 */
    const steps = (p.exercise ? 1 : 0) + (p.quiz >= p.quizTotal && p.quizTotal ? 1 : 0);
    const R = 23, C = 2 * Math.PI * R;
    const bar = $("#lesson-ring-bar");
    if (bar) bar.setAttribute("stroke-dashoffset", (C * (1 - steps / 2)).toFixed(1));
    if (window.__updateRing) window.__updateRing();
  }

  /* ---------- 上一节 / 下一节 ---------- */
  const pager = $("#pager");
  if (prev) {
    const a = el("a", "pager-link prev", '<span class="dir">← 上一节</span><span class="t">' + esc(prev.l.title) + "</span>");
    a.href = "lesson.html?c=" + prev.c.id + "&l=" + prev.l.id;
    pager.appendChild(a);
  } else {
    pager.appendChild(el("a", "pager-link prev disabled", '<span class="dir">← 上一节</span><span class="t">已经是第一节</span>'));
  }
  if (next) {
    const a = el("a", "pager-link next", '<span class="dir">下一节 →</span><span class="t">' + esc(next.l.title) + "</span>");
    a.href = "lesson.html?c=" + next.c.id + "&l=" + next.l.id;
    pager.appendChild(a);
  } else {
    pager.appendChild(el("a", "pager-link next disabled", '<span class="dir">下一节 →</span><span class="t">已经是最后一节</span>'));
  }

  refreshDone();
})();
