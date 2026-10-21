/* ============================================================
 * shared/course.js — 全课程章节清单（跨页共享的单一来源）
 * ------------------------------------------------------------
 * 以经典脚本形式加载（挂在 window.COURSE 上），首页 home.js 与
 * 课程页 render.js 都从这里取同一份数据，避免两处各写一份。
 *
 * 为什么需要它：学习进度存在 localStorage 里是全局的；
 * 但任何一章的页面只知道本章的小节。首页卡片与章节页的五等分圆环
 * 都要判断「哪一章学完了」，就必须知道全部五章的小节总数。
 *
 * ⚠️ total 与各章 content.js 的 sections.length 一致；
 * 增删小节时两处都要改。
 * ============================================================ */

window.COURSE = {
  progressKey: "wbl-lesson-progress",
  chapters: [
    { key: "ch-1", href: "lesson-01/", total: 5, title: { zh: "数据", en: "Data" } },
    { key: "ch-2", href: "lesson-02/", total: 4, title: { zh: "可视化流程", en: "Workflow" } },
    { key: "ch-3", href: "lesson-03/", total: 8, title: { zh: "色彩", en: "Color" } },
    { key: "ch-4", href: "lesson-04/", total: 5, title: { zh: "低维数据", en: "Low-Dim" } },
    { key: "ch-5", href: "lesson-05/", total: 5, title: { zh: "时序数据", en: "Time Series" } },
  ],
};

/** 某章已完成的小节数（依据全局进度数组按 id 前缀统计） */
window.courseDone = function (key, doneArray) {
  let n = 0;
  doneArray.forEach((id) => { if (String(id).indexOf(key + "-") === 0) n++; });
  return n;
};
