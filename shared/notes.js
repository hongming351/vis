/* ============================================================
 * shared/notes.js — 全局课堂笔记（可附图片）
 * ------------------------------------------------------------
 * · 五章共用同一份笔记：文字存 localStorage，图片存 IndexedDB
 *   （图片体积大，放 localStorage 会很快撑爆 5MB 配额）
 * · 右侧停靠，展开/收起由边缘按钮控制，收起状态持久化
 * · 上传前用 canvas 压缩，避免一张截图就吃掉几百 KB
 * · 遵循 prefers-reduced-motion
 * ============================================================ */

(function () {
  "use strict";

  if (window.__notesReady) return;
  window.__notesReady = true;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TEXT_KEY = "warm-notes-v1";
  const OPEN_KEY = "warm-notes-open";
  const DB_NAME = "warm-notes";
  const STORE = "images";

  /* ---------------- IndexedDB（存图片 Blob） ---------------- */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      const t = d.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    }));
  }
  const imgPut = (id, blob) => tx("readwrite", (s) => s.put(blob, id));
  const imgDel = (id) => tx("readwrite", (s) => s.delete(id));
  const imgAll = () => tx("readonly", (s) => s.getAll());
  const imgKeys = () => tx("readonly", (s) => s.getAllKeys());

  /* ---------------- 文字笔记 ---------------- */
  function loadText() {
    try { return localStorage.getItem(TEXT_KEY) || ""; }
    catch (e) { return ""; }
  }
  let saveTimer = null;
  function saveText(v) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(TEXT_KEY, v); }
      catch (e) { status("保存失败：浏览器存储空间不足"); }
    }, 400);
  }

  /* ---------------- 图片压缩 ---------------- */
  const MAX_W = 1400;
  async function compress(file) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_W / bmp.width);
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close && bmp.close();
    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.72));
    return { blob: blob || file, w: w, h: h };
  }

  /* ---------------- 面板骨架 ---------------- */
  const layout = document.querySelector(".lesson-layout");
  if (!layout) return;

  const panel = document.createElement("aside");
  panel.className = "notes-panel";
  panel.id = "notes-panel";
  panel.setAttribute("aria-label", "课堂笔记");
  panel.innerHTML =
    '<header class="notes-head">' +
      '<div class="notes-title"><span class="notes-dot"></span><h2>课堂笔记</h2></div>' +
      '<button class="notes-collapse" type="button" title="收起笔记" aria-label="收起笔记">' +
        '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M15 4v16"/></svg>' +
      "</button>" +
    "</header>" +
    '<div class="notes-body">' +
      '<textarea class="notes-text" placeholder="看到这里想到什么，先记下来…" spellcheck="false"></textarea>' +
      '<p class="notes-status" role="status"></p>' +
      '<div class="notes-gallery" hidden></div>' +
      '<p class="notes-hint">笔记在五章之间共用，保存在本机浏览器，不会上传。<br>截图后直接 <kbd>Ctrl</kbd>+<kbd>V</kbd> 即可贴进来。</p>' +
    "</div>" +
    '<footer class="notes-foot">' +
      '<label class="notes-add">' +
        '<input type="file" accept="image/*" multiple hidden>' +
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
        "<span>附图片</span>" +
      "</label>" +
      '<span class="notes-count"></span>' +
    "</footer>";
  layout.appendChild(panel);

  /* 边缘把手：展开 / 收起 */
  const toggle = document.createElement("button");
  toggle.className = "notes-toggle";
  toggle.type = "button";
  toggle.title = "展开课堂笔记";
  toggle.setAttribute("aria-label", "展开课堂笔记");
  toggle.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>' +
    '<span>笔记</span>';
  document.body.appendChild(toggle);

  /* 大图预览 */
  const lightbox = document.createElement("div");
  lightbox.className = "notes-lightbox";
  lightbox.hidden = true;
  lightbox.innerHTML = '<button class="notes-lightbox-close" type="button" aria-label="关闭">×</button><img alt="笔记图片预览">';
  document.body.appendChild(lightbox);
  const lbImg = lightbox.querySelector("img");
  let lbUrl = null;

  /* ---------------- 元素引用 ---------------- */
  const ta = panel.querySelector(".notes-text");
  const statusEl = panel.querySelector(".notes-status");
  const gallery = panel.querySelector(".notes-gallery");
  const countEl = panel.querySelector(".notes-count");
  const fileInput = panel.querySelector('input[type="file"]');

  let statusTimer = null;
  function status(msg) {
    statusEl.textContent = msg || "";
    clearTimeout(statusTimer);
    if (msg) statusTimer = setTimeout(() => { statusEl.textContent = ""; }, 3200);
  }

  /* ---------------- 展开 / 收起 ---------------- */
  function setOpen(open, remember) {
    document.body.classList.toggle("notes-open", open);
    toggle.setAttribute("aria-label", open ? "收起课堂笔记" : "展开课堂笔记");
    toggle.title = open ? "收起课堂笔记" : "展开课堂笔记";
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    if (remember) { try { localStorage.setItem(OPEN_KEY, open ? "1" : "0"); } catch (e) { /* ignore */ } }
  }
  toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("notes-open"), true));
  panel.querySelector(".notes-collapse").addEventListener("click", () => setOpen(false, true));

  /* ---------------- 文字 ---------------- */
  ta.value = loadText();
  ta.addEventListener("input", () => saveText(ta.value));

  /* ---------------- 图片 ---------------- */
  const urls = new Map();   /* id → objectURL */

  function revokeAll() {
    urls.forEach((u) => URL.revokeObjectURL(u));
    urls.clear();
  }

  async function renderGallery() {
    let keys = [];
    try { keys = await imgKeys(); }
    catch (e) { status("图片存储不可用"); return; }

    revokeAll();
    gallery.innerHTML = "";
    if (!keys.length) { gallery.hidden = true; countEl.textContent = ""; return; }
    gallery.hidden = false;

    for (const id of keys) {
      const blob = await tx("readonly", (s) => s.get(id));
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      urls.set(id, url);

      const fig = document.createElement("figure");
      fig.className = "notes-thumb";
      fig.innerHTML =
        '<img loading="lazy" alt="笔记图片">' +
        '<button class="notes-del" type="button" title="删除这张图片" aria-label="删除图片">×</button>';
      fig.querySelector("img").src = url;
      fig.addEventListener("click", (e) => {
        if (e.target.closest(".notes-del")) return;
        openLightbox(url);
      });
      fig.querySelector(".notes-del").addEventListener("click", async (e) => {
        e.stopPropagation();
        await imgDel(id);
        renderGallery();
      });
      gallery.appendChild(fig);
    }
    countEl.textContent = keys.length + " 张图片";
  }

  /* ---------------- 添加图片（文件选择与粘贴共用） ---------------- */
  async function addFiles(files) {
    const imgs = files.filter((f) => /^image\//.test(f.type));
    if (!imgs.length) return 0;
    status("正在处理 " + imgs.length + " 张…");
    let ok = 0;
    for (const f of imgs) {
      try {
        const { blob } = await compress(f);
        await imgPut(Date.now() + "-" + Math.random().toString(36).slice(2, 8), blob);
        ok++;
      } catch (e) {
        status("有一张图片处理失败");
      }
    }
    await renderGallery();
    status(ok ? "已添加 " + ok + " 张图片" : "图片处理失败");
    return ok;
  }

  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = "";
    if (!files.length) return;
    await addFiles(files);
  });

  /* ---------------- Ctrl+V 粘贴截图 ---------------- */
  document.addEventListener("paste", async (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && /^image\//.test(it.type)) {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    /* 剪贴板里没有图片时不拦截，保留文字粘贴的默认行为 */
    if (!files.length) return;
    e.preventDefault();
    if (!document.body.classList.contains("notes-open")) setOpen(true, true);
    ta.focus();
    await addFiles(files);
  });

  /* ---------------- 大图预览 ---------------- */
  function openLightbox(url) {
    lbImg.src = url;
    lightbox.hidden = false;
    lbUrl = url;
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
    lbUrl = null;
  }
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.closest(".notes-lightbox-close")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (!lightbox.hidden) closeLightbox(); else if (document.body.classList.contains("notes-open")) setOpen(false, true); }
  });

  /* 离开页面时释放 objectURL，避免内存泄漏 */
  window.addEventListener("pagehide", () => { revokeAll(); if (lbUrl) URL.revokeObjectURL(lbUrl); });

  /* ---------------- 初始化 ---------------- */
  let open = true;
  try { const v = localStorage.getItem(OPEN_KEY); if (v !== null) open = v === "1"; } catch (e) { /* 默认展开 */ }
  setOpen(open, false);
  renderGallery();
  if (!REDUCED) panel.classList.add("notes-enter");
})();
