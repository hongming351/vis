/* ============================================================
 * shared/confetti.js — 课程完成彩带（零依赖 Canvas）
 * ------------------------------------------------------------
 * 用法：celebrate(durationMs)
 * 触发时机由 shared/render.js 的课程仪表板决定（全部章节点亮时）
 * 遵循 prefers-reduced-motion：不撒彩带，只静态展示一次。
 * ============================================================ */

const PALETTE = ["#E4572E", "#C9852B", "#2E6B4F", "#3D5A80", "#7B4B6B", "#E8A87C", "#8FB996"];

export function celebrate(duration = 6000) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "9998",
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  /* 每片彩带：位置、速度、尺寸、旋转、颜色、形状 */
  const N = 160;
  const bits = [];
  for (let i = 0; i < N; i++) {
    bits.push({
      x: Math.random() * W,
      y: -20 - Math.random() * H * 0.6,
      w: 5 + Math.random() * 7,
      h: 8 + Math.random() * 10,
      vx: (Math.random() - 0.5) * 1.8,
      vy: 2 + Math.random() * 2.6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.22,
      color: PALETTE[i % PALETTE.length],
      round: Math.random() < 0.3,
    });
  }

  const started = performance.now();
  let raf = 0;

  const frame = (now) => {
    const t = now - started;
    ctx.clearRect(0, 0, W, H);

    /* 最后 1.2 秒整体淡出 */
    const fade = t > duration - 1200 ? Math.max(0, 1 - (t - (duration - 1200)) / 1200) : 1;
    ctx.globalAlpha = fade;

    for (const b of bits) {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.035;            /* 重力 */
      b.vx *= 0.995;            /* 空气阻力 */
      b.rot += b.vr;
      if (b.y > H + 30) { b.y = -20; b.x = Math.random() * W; }

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.color;
      if (b.round) {
        ctx.beginPath();
        ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (t < duration) raf = requestAnimationFrame(frame);
    else cleanup();
  };

  function cleanup() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    canvas.remove();
  }

  raf = requestAnimationFrame(frame);
}
