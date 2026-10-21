/* ============================================================
 * home.js — 首页交互
 * 自定义光标 / 滚动显现 / 进度环 / 学习路径节点 / 报名表单
 * ============================================================ */

(function () {
  "use strict";

  const COURSES = window.COURSES || [];
  const COURSE = window.COURSE || { chapters: [] };
  /* 进度数据源与章节页（shared/render.js）保持一致：
     勾选小节写的是 wbl-lesson-progress，首页必须读同一个 key，
     否则两边各记各的，首页永远显示 0% */
  const PROGRESS_KEY = "wbl-lesson-progress";

  const $ = (s, r) => (r || document).querySelector(s);
  const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

  /* ---------- 进度 ---------- */
  function loadProgress() {
    try {
      const v = JSON.parse(localStorage.getItem(PROGRESS_KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  const progress = loadProgress();

  /** 某章学完的小节数 / 该章小节总数 */
  function chapterStat(index) {
    const ch = COURSE.chapters[index];
    if (!ch) return { done: 0, total: 0 };
    let done = 0;
    progress.forEach((id) => { if (String(id).indexOf(ch.key + "-") === 0) done++; });
    return { done: done, total: ch.total };
  }
  /** 某章完成百分比（章节页勾选的小节，与课程页仪表板同源） */
  function coursePct(index) {
    const st = chapterStat(index);
    if (!st.total) return 0;
    return Math.round((st.done / st.total) * 100);
  }

  /* ---------- 自定义光标与滚动显现由 shared/chrome.js 提供 ---------- */
  const observeReveal = window.__chrome ? window.__chrome.observeReveal : function () {};

  /* ---------- 课程卡片（12 列错位网格） ---------- */
  const grid = $("#course-grid");
  COURSES.forEach((c, ci) => {
    const first = c.lessons[0];
    const card = el("a", "course-card reveal");
    card.id = c.id;
    card.href = "lesson.html?c=" + c.id + "&l=" + first.id;
    card.style.setProperty("--d", (ci % 3) * 90 + "ms");

    const pct = coursePct(ci);
    const st = chapterStat(ci);
    const R = 23, C = 2 * Math.PI * R;

    const cover = el("div", "course-cover");
    const inner = el("div", "cover-inner");
    inner.appendChild(el("span", "cover-ch", c.chapter));
    inner.appendChild(el("span", "cover-title", c.title));
    inner.appendChild(el("span", "cover-en", c.titleEn));
    const hover = el("div", "cover-hover");
    hover.appendChild(el("span", "name", c.title));
    const meta = el("span", "meta");
    meta.appendChild(el("span", null, c.hours));
    meta.appendChild(el("span", null, c.level));
    hover.appendChild(meta);
    cover.appendChild(inner);
    cover.appendChild(hover);

    /* 旧版讲解页入口：放在封面右上角，避免与卡片页脚重叠 */
    const legacy = el("span", "card-legacy", "旧版讲解页 ↗");
    legacy.setAttribute("role", "link");
    legacy.setAttribute("tabindex", "0");
    const goLegacy = (e) => { e.preventDefault(); e.stopPropagation(); location.href = c.legacy; };
    legacy.addEventListener("click", goLegacy);
    legacy.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") goLegacy(e); });
    cover.appendChild(legacy);

    const body = el("div", "course-body");
    body.appendChild(el("p", "course-desc", c.desc));
    const tags = el("ul", "tag-row");
    c.tags.forEach((t) => tags.appendChild(el("li", null, t)));
    body.appendChild(tags);

    const foot = el("div", "course-foot");
    const diff = el("span", "diff", '<span aria-hidden="true">难度</span>');
    for (let i = 0; i < 3; i++) diff.appendChild(el("span", "diff-bar" + (i < c.difficulty ? " on" : "")));
    diff.appendChild(el("span", "diff-label", "已学 " + st.done + "/" + st.total));
    foot.appendChild(diff);

    const ringWrap = el("span", "ring");
    ringWrap.innerHTML =
      '<svg width="54" height="54" viewBox="0 0 54 54">' +
      '<circle class="track" cx="27" cy="27" r="23" fill="none" stroke-width="5"></circle>' +
      '<circle class="bar" cx="27" cy="27" r="23" fill="none" stroke-width="5" ' +
      'stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"></circle>' +
      "</svg>" +
      '<span class="pct">' + pct + "%</span>";
    foot.appendChild(ringWrap);

    const go = el("span", "course-foot-go");
    go.innerHTML = '<span class="go">进入课程 <span aria-hidden="true">→</span></span>';
    foot.appendChild(go);

    card.appendChild(cover);
    card.appendChild(body);
    card.appendChild(foot);

    grid.appendChild(card);
  });

  /* 卡片是动态插入的，必须在插入后再观察一次，否则会停在 opacity:0 */
  observeReveal(grid);

  /* ---------- 学习路径节点 ---------- */
  const track = $("#path-track");
  const detail = $("#path-detail");
  const detailInner = $("#path-detail-inner");
  let openNode = null;

  COURSES.forEach((c, i) => {
    const b = el("button", "path-node" + (chapterStat(i).done === chapterStat(i).total && chapterStat(i).total ? " done" : ""));
    b.type = "button";
    b.setAttribute("aria-expanded", "false");
    b.innerHTML =
      '<span class="knob"></span>' +
      '<span class="idx">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<span class="zh">' + c.title + "</span>" +
      '<span class="en">' + c.titleEn + "</span>";
    b.addEventListener("click", () => {
      const same = openNode === b;
      document.querySelectorAll(".path-node").forEach((n) => n.setAttribute("aria-expanded", "false"));
      if (same) { openNode = null; detail.classList.remove("open"); return; }
      openNode = b;
      b.setAttribute("aria-expanded", "true");
      detailInner.innerHTML =
        "<div><h3>" + c.chapter + " · " + c.title + "</h3><p>" + c.desc + "</p>" +
        '<p style="margin-top:14px"><a class="link" href="lesson.html?c=' + c.id + "&l=" + c.lessons[0].id + '">进入这一章 →</a> ' +
        '<a class="link" href="' + c.legacy + '">旧版讲解页 ↗</a></p></div>' +
        "<ul class=\"path-detail-list\">" +
        c.lessons.map((l) => "<li>" + l.index + ". " + l.title + " — " + l.titleEn + "</li>").join("") +
        "</ul>";
      detail.classList.add("open");
    });
    track.appendChild(b);
  });

  /* ---------- 报名表单 ---------- */
  const form = $("#signup-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = $("#form-ok");
      ok.classList.add("show");
      form.querySelector("button[type=submit]").textContent = "已提交 ✓";
    });
  }

  /* 供 lesson 页刷新进度环 */
  window.__updateRing = function () {
    document.querySelectorAll(".course-card").forEach((card) => {
      const i = COURSES.findIndex((x) => x.id === card.id);
      if (i < 0) return;
      const pct = coursePct(i);
      const bar = card.querySelector(".ring .bar");
      const pctEl = card.querySelector(".ring .pct");
      const label = card.querySelector(".diff-label");
      if (bar) bar.setAttribute("stroke-dashoffset", (2 * Math.PI * 23 * (1 - pct / 100)).toFixed(1));
      if (pctEl) pctEl.textContent = pct + "%";
      if (label) {
        const st = chapterStat(i);
        label.textContent = "已学 " + st.done + "/" + st.total;
      }
    });
    document.querySelectorAll(".path-node").forEach((n, i) => {
      const st = chapterStat(i);
      n.classList.toggle("done", st.total > 0 && st.done === st.total);
    });
  };
})();
