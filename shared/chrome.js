/* ============================================================
 * shared/chrome.js — 新版页面共享的「外观行为」
 * ------------------------------------------------------------
 * 自定义光标 + 滚动显现。首页（index.html）与课程页（lesson.html）共用。
 * 必须在这两个页面的 home.js / lesson.js 之前引入。
 *
 * 为什么单独拆一个文件：
 *   早先这两段逻辑只写在 home.js 里，导致 lesson.html 的 .reveal
 *   区块永远停在 opacity:0（整页空白），首页动态插入的课程卡片
 *   也同样漏观察。收敛到一处，两个页面都不会再漏。
 * ============================================================ */

(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 自定义光标：圆环 + 圆点，difference 混合 ---------- */
  function initCursor() {
    var ring = document.getElementById("cursor-ring");
    var dot = document.getElementById("cursor-dot");
    if (!ring || !dot) return;
    if (REDUCED || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      ring.style.display = "none";
      dot.style.display = "none";
      return;
    }
    var rx = 0, ry = 0, tx = 0, ty = 0;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
    });
    (function loop() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      var hot = t && t.closest ? t.closest("a, button, .path-node, input, textarea, .course-card, .card-legacy") : null;
      document.body.classList.toggle("cursor-hot", !!hot);
    });
  }

  /* ---------- 滚动显现 ---------- */
  var io = null;
  if (!REDUCED && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  }

  /**
   * 观察 root 内尚未显现的 .reveal 元素。
   * 动态插入的内容（如首页课程卡片）必须在插入后调用一次。
   */
  function observeReveal(root) {
    var els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!els.length) return;
    if (!io) {
      els.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    els.forEach(function (n, i) {
      if (!n.style.getPropertyValue("--d")) {
        n.style.setProperty("--d", (i % 6) * 70 + "ms");
      }
      io.observe(n);
    });
  }

  window.__chrome = { initCursor: initCursor, observeReveal: observeReveal };

  initCursor();
  observeReveal(document);
})();
