// ============================================================
// lesson-03/content.js — 第 3 章 · 色彩专题 单一内容源（中英双语）
// 由 shared/render.js 渲染成三 tab 教学页面
// 由旧版内联 HTML 迁移而来（保留全部原文与英文对照）
// ============================================================

const L = (...lines) => lines.join("\n");

export const CONTENT = {
  meta: {
    title: { zh: "第 3 章 · 色彩专题", en: "Ch 3 · Color" },
    navLabel: { zh: "第 3 章 · 色彩专题", en: "Ch 3 · Color" },
    subtitle: { zh: "颜色模型、colormap 三类选择、Lab 色域、五大色系与色觉缺陷（CVD）模拟。", en: "Color models, three kinds of colormaps, the Lab gamut, five color families and color-vision-deficiency simulation." },
    prev: { href: "../lesson-02/", label: { zh: "第 2 章 · 数据可视化流程", en: "Ch 2 · Viz Workflow" } },
    next: { href: "../lesson-04/", label: { zh: "第 4 章 · 低维可视化", en: "Ch 4 · Low-Dim" } },
  },

  sections: [
    {
      id: "ch-3-1",
      title: { zh: "3.1 颜色模型基础", en: "3.1 Color Model Basics" },
      subtitle: { zh: "为什么需要 4 种颜色空间？它们各自擅长什么？色盲眼中看到的世界是怎样的？", en: "Why do we need 4 color spaces? What is each one good at? What does the world look like through the eyes of someone with color blindness?" },
      explain: [
        { h: { zh: "为什么要学颜色模型？", en: "Why learn color models?" } },
        { p: { zh: "设计 colormap 时，<strong>不能直接用 RGB 插值</strong>——因为 RGB 不是感知均匀的（255,0,0 与 0,255,0 \"看上去\"亮度差很多）。你需要感知均匀的颜色空间（Lab / HCL）来插值，才能得到平滑的渐变。", en: "When designing a colormap, <strong>do not interpolate directly in RGB</strong>—because RGB is not perceptually uniform (255,0,0 and 0,255,0 \"look\" very different in lightness). You need a perceptually uniform color space (Lab / HCL) to interpolate and get smooth gradients." } },
        { h: { zh: "4 大颜色空间", en: "The 4 major color spaces" } },
        { ul: { zh: ["<strong>RGB</strong>：加色模型，设备相关。屏幕显示的默认。", "<strong>HSL</strong>：艺术家友好（色相/饱和度/亮度独立），但<strong>仍不感知均匀</strong>。", "<strong>CIE Lab</strong>：感知均匀，<strong>设计 colormap 的黄金标准</strong>。", "<strong>CMYK</strong>：减色（印刷），web 可视化用不到。"], en: ["<strong>RGB</strong>: additive model, device-dependent. The default for screen display.", "<strong>HSL</strong>: artist-friendly (independent hue / saturation / lightness), but <strong>still not perceptually uniform</strong>.", "<strong>CIE Lab</strong>: perceptually uniform, <strong>the gold standard for designing colormaps</strong>.", "<strong>CMYK</strong>: subtractive (print). Not used in web visualizations."] } },
        { h: { zh: "CVD（色觉缺陷）", en: "CVD (Color Vision Deficiency)" } },
        { p: { zh: "约 8% 男性、0.5% 女性是色盲。常见三种：", en: "About 8% of men and 0.5% of women are color-blind. Three common types:" } },
        { ul: { zh: ["<strong>红色盲（protanopia）</strong>：约 1% 男性", "<strong>绿色盲（deuteranopia）</strong>：约 6% 男性（最常见）", "<strong>蓝色盲（tritanopia）</strong>：极罕见"], en: ["<strong>Protanopia (red-blind)</strong>: ~1% of men", "<strong>Deuteranopia (green-blind)</strong>: ~6% of men (most common)", "<strong>Tritanopia (blue-blind)</strong>: extremely rare"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：RGB → HSL 手写</strong>", en: "⭐ <strong>Key point 1: Hand-written RGB ↔ HSL</strong>" },
          code: L(
            "function rgbToHsl(r, g, b) {",
            "  r /= 255; g /= 255; b /= 255;",
            "  const max = Math.max(r, g, b), min = Math.min(r, g, b);",
            "  let h, s, l = (max + min) / 2;",
            "  if (max === min) { h = s = 0; }",
            "  else {",
            "    const d = max - min;",
            "    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);",
            "    switch (max) {",
            "      case r: h = (g - b) / d + (g < b ? 6 : 0); break;",
            "      case g: h = (b - r) / d + 2; break;",
            "      case b: h = (r - g) / d + 4; break;",
            "    }",
            "    h /= 6;",
            "  }",
            "  return [h * 360, s * 100, l * 100];",
            "}",
          ),
          points: { zh: "⭐ 自己写 RGB↔HSL 是为了理解每一步的物理含义——\"最大通道决定色相、相减决定饱和度\"——比用 d3 库更能理解色相为什么在 0-360° 循环。", en: "⭐ Writing RGB↔HSL yourself is to understand the physical meaning of each step—\"the largest channel determines hue, the difference determines saturation\"—which is more illuminating than using a d3 library for understanding why hue cycles between 0–360°." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：CVD 模拟矩阵</strong>", en: "⭐ <strong>Key point 2: CVD simulation matrix</strong>" },
          code: L(
            "const CVD_MATRICES = {",
            "  deuteranopia: [",
            "    [0.625, 0.375, 0.000],",
            "    [0.700, 0.300, 0.000],",
            "    [0.000, 0.300, 0.700]",
            "  ],",
            "  protanopia:   [[0.567, 0.433, 0.000], [0.558, 0.442, 0.000], [0.000, 0.242, 0.758]],",
            "  tritanopia:   [[0.950, 0.050, 0.000], [0.000, 0.433, 0.567], [0.000, 0.475, 0.525]]",
            "};",
            "",
            "function simulateCVD([r, g, b], type) {",
            "  const m = CVD_MATRICES[type];",
            "  return [",
            "    r * m[0][0] + g * m[0][1] + b * m[0][2],",
            "    r * m[1][0] + g * m[1][1] + b * m[1][2],",
            "    r * m[2][0] + g * m[2][1] + b * m[2][2]",
            "  ].map(v => Math.round(Math.max(0, Math.min(255, v))));",
            "}",
          ),
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 3：d3 内置多空间</strong>", en: "⭐ <strong>Key point 3: d3's built-in multi-space support</strong>" },
          code: L(
            "const c = d3.color('rgb(100, 50, 200)');",
            "c.rgb();   // {r, g, b}",
            "c.hsl();   // {h, s, l}",
            "c.lab();   // {l, a, b}  ← 感知均匀",
            "c.hcl();   // {h, c, l}  ← Lab 极坐标版",
          ),
        },
      ],
      demo: {
        id: "d-3-1",
      },
      objectives: {
        zh: ["说清 RGB / HSL / Lab / CVD 四种颜色空间各自擅长什么", "能用矩阵近似模拟色觉障碍下的颜色", "理解「感知均匀」为什么是选色空间的关键标准"],
        en: ["Explain what each of RGB / HSL / Lab / CVD color spaces is good at", "Approximate color-vision deficiency with a matrix transform", "Understand why perceptual uniformity is the key criterion for choosing a color space"],
      },
      summary: { zh: "没有一种颜色空间通吃所有任务：RGB 贴近硬件，HSL 贴近人的直觉描述，Lab 贴近感知均匀，CVD 模拟则用来检验可读性。选空间就是选「在哪把差异放大、在哪把差异压缩」。", en: "No single color space wins everywhere: RGB is close to hardware, HSL to human intuition, Lab to perceptual uniformity, and CVD simulation checks readability. Choosing a space means choosing where differences get amplified and where they get compressed." },
      quiz: [
        {
          q: { zh: "CIE Lab 相对 RGB 的主要优势是？", en: "What is CIE Lab's main advantage over RGB?" },
          options: {
            zh: ["颜色更多", "感知均匀——数值差距≈视觉差距", "计算更快", "浏览器支持更好"],
            en: ["More colors", "Perceptual uniformity — numeric difference ≈ visual difference", "Faster computation", "Better browser support"],
          },
          answer: 1,
          explain: { zh: "RGB 里数值差 10 在暗部和亮部看起来完全不同，Lab 经过非线性变换后，相同的欧氏距离对应大致相同的视觉差异，因此做插值、配色、色域判断都更可靠。", en: "In RGB, a numeric difference of 10 looks completely different in dark and light regions; after Lab's nonlinear transform, equal Euclidean distances correspond to roughly equal visual differences, making interpolation, palette design and gamut checks far more reliable." },
        },
      ],
    },
    {
      id: "ch-3-2",
      title: { zh: "3.2 colormap 三类选择", en: "3.2 Colormap: 3 Types" },
      subtitle: { zh: "顺序型 / 发散型 / 定性型。选错类型 = 误导读者。", en: "Sequential / Diverging / Qualitative. Choosing the wrong type = misleading your readers." },
      explain: [
        { h: { zh: "三类 colormap 对应不同数据语义", en: "Three colormap families match three data semantics" } },
        { ul: { zh: ["<strong>顺序型（Sequential）</strong>：数据有自然顺序（人口、温度）。单调亮度 + 单调色相。例子：<code>Viridis / Plasma / Cividis</code>", "<strong>发散型（Diverging）</strong>：数据有意义的\"中点\"（如 0、正负偏差、白人中位数）。两端异色，中间白/浅。例子：<code>RdBu / BrBG / PiYG</code>", "<strong>定性型（Qualitative）</strong>：数据无序（如产品类别）。色相区分、亮度接近。例子：<code>Tableau10 / Set1 / Set3</code>"], en: ["<strong>Sequential</strong>: data with a natural order (population, temperature). Monotonic lightness + monotonic hue. Examples: <code>Viridis / Plasma / Cividis</code>", "<strong>Diverging</strong>: data with a meaningful \"midpoint\" (e.g., zero, signed deviation, white median). Different hues at the two ends, white/light in the middle. Examples: <code>RdBu / BrBG / PiYG</code>", "<strong>Qualitative</strong>: unordered data (e.g., product categories). Distinct hues, similar lightness. Examples: <code>Tableau10 / Set1 / Set3</code>"] } },
        { h: { zh: "典型错误", en: "Common mistakes" } },
        { p: { zh: "用发散型 RdBu 画\"50 州谋杀率\"（有序数据）——中段接近白色，看上去\"谋杀率 = 100 附近\"的州是\"中点\"——但 100 没有任何语义，纯属误导。", en: "Using the diverging palette RdBu for \"murder rates in 50 states\" (ordinal data)—the middle band looks near-white, so states with a murder rate \"around 100\" appear to be the \"midpoint\"—but 100 has no semantic meaning, so this is purely misleading." } },
        { h: { zh: "CVD 友好检查清单", en: "CVD-friendly checklist" } },
        { ul: { zh: ["Viridis / Cividis：✅ 优（Nature Methods 推荐）", "RdBu / BrBG：△ 中等（红绿对色盲不友好）", "Tableau10（定性）：△ 与色相相关", "Jet（彩虹谱）：⚠ 禁用"], en: ["Viridis / Cividis: ✅ excellent (recommended by Nature Methods)", "RdBu / BrBG: △ moderate (red-green pairs are not CVD-friendly)", "Tableau10 (qualitative): △ hue-related issues", "Jet (rainbow): ⚠ do not use"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：d3 三类 scale 速记</strong>", en: "⭐ <strong>Key point 1: d3's three scale families at a glance</strong>" },
          code: L(
            "// 顺序型：[0, 1] → 颜色",
            "d3.scaleSequential(d3.interpolateViridis);",
            "",
            "// 发散型：[0, 1] → 颜色（带中点反转）",
            "d3.interpolateRdBu;          // t=0 蓝，t=1 红，t=0.5 白",
            "d3.interpolateBrBG;",
            "",
            "// 定性型：离散类别 → 颜色",
            "d3.scaleOrdinal(d3.schemeTableau10);",
          ),
          points: { zh: "⭐ 选错类型 = \"撒谎\"。比如用 Viridis 表示正负偏差，用户会以为\"中点 = 白色\"——但 Viridis 的中点是深紫色。", en: "⭐ Choosing the wrong type = \"lying\". For example, using Viridis for signed deviations makes users assume \"the midpoint is white\" — but Viridis's midpoint is dark purple." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：决策表</strong>", en: "⭐ <strong>Key point 2: Decision table</strong>" },
          code: L(
            "function pickColormap(data) {",
            "  if (data.hasMeaningfulMidpoint) return 'diverging';",
            "  if (data.isOrdered)              return 'sequential';",
            "  return 'categorical';",
            "}",
          ),
        },
      ],
      demo: {
        id: "d-3-2",
      },
      objectives: {
        zh: ["区分顺序型、发散型、定性型三类 colormap 及各自适用数据", "理解感知均匀与色觉友好为什么是硬要求", "能指出彩虹色用于数值编码的两个具体问题"],
        en: ["Distinguish sequential, diverging and qualitative colormaps and the data each suits", "Understand why perceptual uniformity and color-vision friendliness are hard requirements", "Name two concrete problems with using rainbow schemes for numeric encoding"],
      },
      summary: { zh: "colormap 选型先看数据有没有「中点」和「顺序」：有顺序无中点用顺序型，有明显中点用发散型，只有类别用定性型。类型错了，读者会读出根本不存在的结构。", en: "Choosing a colormap starts with whether the data has a midpoint and an order: ordered without a midpoint → sequential, with a clear midpoint → diverging, categories only → qualitative. Get the type wrong and readers perceive structure that isn't there." },
      quiz: [
        {
          q: { zh: "「相对平均值的偏差」这类数据最适合哪类 colormap？", en: "Which colormap type best suits 'deviation from the mean' data?" },
          options: {
            zh: ["顺序型", "发散型", "定性型", "都可以"],
            en: ["Sequential", "Diverging", "Qualitative", "Any of them"],
          },
          answer: 1,
          explain: { zh: "偏差数据有一个语义上的中点（0 / 平均值），两侧方向相反、程度对称，正好对应发散型 colormap「中间浅、两端深」的结构。用顺序型会把中点变成最极端值，误导读者。", en: "Deviation data has a semantic midpoint (0 / the mean), with opposite directions and symmetric magnitudes on either side — exactly matching a diverging colormap's light-middle, dark-ends structure. A sequential scheme would turn the midpoint into the extreme and mislead readers." },
        },
        {
          q: { zh: "彩虹色 colormap 用于数值编码的主要问题是？", en: "What is the main problem with rainbow colormaps for numeric encoding?" },
          options: {
            zh: ["颜色数量不够", "色相环绕制造假边界，且亮度非单调", "打印效果差", "无法插值"],
            en: ["Too few colors", "Hue cycling creates false boundaries and brightness is non-monotonic", "Prints poorly", "Cannot be interpolated"],
          },
          answer: 1,
          explain: { zh: "色相在色环上转一圈，起止颜色接近却被放在数据两端，中间的黄绿段还会让人以为存在真实分界；同时感知亮度忽高忽低，同一档数值在不同位置看起来明暗不同。Viridis 这类方案同时保证了单调亮度与色觉友好。", en: "Hue cycles once around the color wheel, so the ends look similar yet sit at opposite data extremes, and the yellow-green segment suggests a real boundary that isn't there; meanwhile perceived brightness rises and falls, so the same value looks different depending on position. Schemes like Viridis guarantee monotone brightness and color-vision friendliness together." },
        },
      ],
    },
    {
      id: "ch-3-3",
      title: { zh: "3.3 CIE Lab 色域图", en: "3.3 CIE Lab Gamut" },
      subtitle: { zh: "在感知均匀的颜色空间里，色域长什么样？", en: "What does the gamut look like inside a perceptually uniform color space?" },
      explain: [
        { h: { zh: "为什么需要 Lab 色域图？", en: "Why do we need a Lab gamut diagram?" } },
        { p: { zh: "RGB 空间是立方体，但你不知道\"哪些颜色真的存在、哪些会失真\"。CIE Lab 是感知均匀空间，<strong>距离 ≈ 人眼感知差</strong>，是设计 colormap 和检查色域的标准。", en: "RGB space is a cube, but you cannot tell \"which colors actually exist and which would be distorted\". CIE Lab is a perceptually uniform space, <strong>distance ≈ perceived difference</strong>, and is the standard for designing colormaps and checking gamut." } },
        { h: { zh: "三个色域（嵌套关系）", en: "Three gamuts (nested relationship)" } },
        { ul: { zh: ["<strong>sRGB</strong>：屏幕通用标准（Web/PPT/一般科研图）", "<strong>Adobe RGB</strong>：摄影/印刷，绿域更广", "<strong>Rec.2020</strong>：4K 电视/HDR，色域最大"], en: ["<strong>sRGB</strong>: universal screen standard (Web / PPT / general scientific figures)", "<strong>Adobe RGB</strong>: photography / print, wider green gamut", "<strong>Rec.2020</strong>: 4K TV / HDR, the largest gamut"] } },
        { p: { zh: "超出 sRGB 的颜色（如高饱和度的纯绿）在普通屏幕上<strong>显示不出来</strong>，会被 clamp。", en: "Colors outside sRGB (e.g., highly saturated pure green) <strong>cannot be displayed</strong> on ordinary screens and get clamped." } },
        { h: { zh: "实战用法", en: "Practical usage" } },
        { ul: { zh: ["从 <code>d3.lab(L, a, b).rgb()</code> 转换时，超出 sRGB 的颜色会自动 clamp", "设计 colormap 时用 <code>d3.interpolateLab</code>（在 Lab 空间插值），比 <code>d3.interpolateRgb</code> 平滑得多", "高饱和度色仅在打印/4K 屏幕上\"存在\"，Web 上看不一定准确"], en: ["When converting from <code>d3.lab(L, a, b).rgb()</code>, colors outside sRGB are clamped automatically", "When designing colormaps, use <code>d3.interpolateLab</code> (interpolates in Lab space), which is far smoother than <code>d3.interpolateRgb</code>", "Highly saturated colors only \"exist\" on print / 4K screens, and may not look accurate on the Web"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：Lab 颜色对象</strong>", en: "⭐ <strong>Key point 1: Lab color object</strong>" },
          code: L(
            "// 直接构造 Lab 颜色",
            "const c = d3.lab(50, 30, -20);    // L*=50, a*=30, b*=-20",
            "console.log(c.rgb());              // → RGB {r, g, b}（clamp 到 sRGB）",
            "console.log(c.formatHex());       // → \"#xxxxxx\"",
            "",
            "// 从 RGB 反向构造",
            "const c2 = d3.color('#ff0080');",
            "console.log(c2.lab());             // → {l, a, b}",
          ),
          points: { zh: "⭐ d3.lab() 返回的是 Lab 颜色对象，但显示时还是转回 RGB。Lab 是\"思考空间\"，RGB 是\"显示空间\"。", en: "⭐ d3.lab() returns a Lab color object, but when displaying you still convert back to RGB. Lab is the \"thinking space\", RGB is the \"display space\"." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "⭐ Key code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：在 Lab 空间插值</strong>", en: "⭐ <strong>Key point 2: Interpolate in Lab space</strong>" },
          code: L(
            "// 在 Lab 空间插值（感知均匀）",
            "const interp = d3.interpolateLab('#000000', '#ffffff');",
            "interp(0.5);   // → 中间灰（Lab 空间线性插值，结果感知均匀）",
            "",
            "// vs 在 RGB 空间插值（不均匀）",
            "const interpRgb = d3.interpolateRgb('#000000', '#ffffff');",
            "interpRgb(0.5);  // → 中间灰（RGB 空间插值，但在 Lab 看来\"不是中间\"）",
          ),
        },
      ],
      demo: {
        id: "d-3-3",
      },
      objectives: {
        zh: ["理解色域（gamut）的概念：哪些颜色是设备能显示的", "能在 Lab 平面上判断一个颜色是否超出 sRGB 色域", "认识「教科书上的完美颜色」在屏幕上可能并不可见"],
        en: ["Understand the concept of gamut: which colors a device can actually display", "Judge in the Lab plane whether a color falls outside the sRGB gamut", "Recognize that 'textbook-perfect colors' may not be displayable on screen"],
      },
      summary: { zh: "色域是颜色空间的物理边界。Lab 的优势在于它覆盖了人眼可见的全部颜色，因此可以直观地看出 sRGB 只能显示其中一块——超出部分会被裁切，导致设计的颜色在屏幕上「变色」。", en: "A gamut is the physical boundary of a color space. Lab's advantage is that it covers all colors visible to the human eye, so you can see directly that sRGB displays only a slice of it — anything outside gets clipped, making designed colors shift on screen." },
      quiz: [
        {
          q: { zh: "超出 sRGB 色域的颜色会发生什么？", en: "What happens to a color outside the sRGB gamut?" },
          options: {
            zh: ["自动变亮", "被裁切到最近的可见颜色", "显示为黑色", "报错"],
            en: ["It gets brighter automatically", "It is clipped to the nearest displayable color", "It renders as black", "It raises an error"],
          },
          answer: 1,
          explain: { zh: "显示器只能呈现色域内的颜色，超出部分会被映射到边界上最接近的那个颜色。这就是为什么在 Lab 里挑好的颜色转到 RGB 后常常「没那么好看」——不是算错，是物理上给不了。", en: "A display can only render colors inside its gamut; anything outside is mapped to the nearest color on the boundary. This is why a color that looks great in Lab often looks less impressive after conversion to RGB — not a math error, just physics." },
        },
      ],
    },
    {
      id: "ch-3-4",
      title: { zh: "3.4 色系搭配规则（5 大类）", en: "3.4 Color Harmony Rules (5 Types)" },
      subtitle: { zh: "单色 / 类比 / 互补 / 三等分 / 分裂互补——什么时候用哪个？", en: "Monochromatic / Analogous / Complementary / Triadic / Split-Complementary—when do you use each?" },
      explain: [
        { h: { zh: "5 大色系规则", en: "The 5 major color scheme rules" } },
        { ul: { zh: ["<strong>单色 Monochromatic</strong>：同一色相不同亮度/饱和。安全、低风险。", "<strong>类比 Analogous</strong>：色轮相邻 ±30°。和谐但缺少对比度。", "<strong>互补 Complementary</strong>：色轮正对面 180°。对比度强但易刺眼。", "<strong>三等分 Triadic</strong>：色轮 120° 等分。3 种类别时最常用。", "<strong>分裂互补 Split</strong>：互补色相邻 150°。温和版互补。"], en: ["<strong>Monochromatic</strong>: the same hue with varying lightness / saturation. Safe and low risk.", "<strong>Analogous</strong>: adjacent on the color wheel, within ±30°. Harmonious but lacking contrast.", "<strong>Complementary</strong>: directly opposite on the color wheel at 180°. Strong contrast but can be jarring.", "<strong>Triadic</strong>: evenly spaced at 120° on the color wheel. The most common choice for 3 categories.", "<strong>Split-Complementary</strong>: adjacent to the complement at 150°. A softer version of complementary."] } },
        { h: { zh: "选择原则", en: "Selection principles" } },
        { ul: { zh: ["<strong>严肃科研</strong>：单色（Nature 黑白经济型配色）", "<strong>层级 / 分组</strong>：类比", "<strong>突出重点</strong>：互补（实验组 vs 对照组）", "<strong>3 种类别</strong>：三等分", "<strong>一般情况</strong>：分裂互补（不刺眼又有对比）"], en: ["<strong>Serious scientific work</strong>: monochromatic (Nature-style black-and-white economical palette)", "<strong>Hierarchy / grouping</strong>: analogous", "<strong>Highlight a focal point</strong>: complementary (treatment vs control)", "<strong>3 categories</strong>: triadic", "<strong>General cases</strong>: split-complementary (not jarring, but still has contrast)"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码", en: "⭐ Key code" },
          purpose: { zh: "⭐ <strong>关键点 1：HSL 色相差</strong>", en: "⭐ <strong>Key point 1: HSL hue difference</strong>" },
          code: L(
            "// 5 大色系的\"色相差\"参数",
            "const HUE_OFFSETS = {",
            "  monochromatic: 0,     // 同色相",
            "  analogous:     30,    // ±30°",
            "  complementary: 180,   // 180° 对面",
            "  triadic:       120,   // 120° 三等分",
            "  split:         150    // 150° 邻补",
            "};",
            "",
            "// 生成 5 色调色板",
            "function palette(baseH, offset) {",
            "  return [-2, -1, 0, 1, 2].map(i => {",
            "    const h = (baseH + i * offset + 360) % 360;",
            "    return d3.hsl(h, 0.6, 0.55).formatHex();",
            "  });",
            "}",
          ),
          points: { zh: "⭐ <code>d3.hsl(h, s, l)</code> 直接构造 HSL 颜色对象。HSL 中 H 是 0-360° 循环，相加要 mod 360。", en: "⭐ <code>d3.hsl(h, s, l)</code> directly constructs an HSL color object. In HSL, H cycles through 0–360°, so additions must be mod 360." },
        },
      ],
      demo: {
        id: "d-3-4",
      },
      objectives: {
        zh: ["掌握单色、类比、互补、三等分、分裂互补五种搭配规则", "能根据图表类型（定性 / 顺序 / 强调）选合适的搭配", "理解颜色数量与信息量的匹配关系"],
        en: ["Master the five harmony rules: monochromatic, analogous, complementary, triadic, split-complementary", "Pick a suitable harmony based on chart type (qualitative / sequential / emphasis)", "Understand how color count matches information load"],
      },
      summary: { zh: "五种搭配规则本质是「在色环上取几个点」。取的点越近越和谐但对比弱，越远对比强但容易脏。图表里一般别超过 7 个颜色，超过就该考虑分组或用小倍数图。", en: "The five harmony rules are essentially 'how many points to take on the color wheel'. Points close together harmonize but contrast weakly; far apart they contrast strongly but easily turn muddy. In charts, stay under about seven colors — beyond that, consider grouping or small multiples." },
      quiz: [
        {
          q: { zh: "需要突出某一个类别、其余保持低调时，最适合哪种搭配？", en: "Which harmony suits highlighting one category while keeping the rest subdued?" },
          options: {
            zh: ["三等分", "单色 + 一个补色强调", "类比", "全部用互补"],
            en: ["Triadic", "Monochromatic plus one complementary accent", "Analogous", "All complementary"],
          },
          answer: 1,
          explain: { zh: "「单色打底 + 一个对比色强调」让被强调的类别自动成为视觉焦点，其余退成背景。三等分和全互补会让多个类别同时抢注意力，反而没有重点。", en: "A monochromatic base plus one contrasting accent makes the emphasized category the automatic focal point while the rest recede. Triadic and all-complementary schemes let several categories compete for attention, leaving no focus at all." },
        },
      ],
    },
    {
      id: "ch-3-5",
      title: { zh: "3.5 科研经典配色", en: "3.5 Classic Research Palettes" },
      subtitle: { zh: "Wong / Paul Tol / Okabe-Ito / Tableau / Paired / Viridis——顶标都在用什么？", en: "Wong / Paul Tol / Okabe-Ito / Tableau / Paired / Viridis—what are top journals using?" },
      explain: [
        { h: { zh: "3 大黄金标准", en: "The 3 gold standards" } },
        { ul: { zh: ["<strong>Wong 2011</strong>：Nature Methods 8:441 推荐，8 色 CVD 友好，灰度打印友好", "<strong>Paul Tol</strong>：SRON Tech Note，bright（白底）/ muted（深底）/ high-contrast（对比", "<strong>Okabe-Ito 2002</strong>：8 色，CVD 友好，早期 Nature/Science 默认"], en: ["<strong>Wong 2011</strong>: recommended in Nature Methods 8:441, 8-color, CVD-friendly and grayscale-print-friendly", "<strong>Paul Tol</strong>: SRON Tech Note, bright (on white background) / muted (on dark background) / high-contrast", "<strong>Okabe-Ito 2002</strong>: 8 colors, CVD-friendly, the default in early Nature/Science"] } },
        { h: { zh: "商业 / 通用", en: "Commercial / general purpose" } },
        { ul: { zh: ["<strong>Tableau 10</strong>：商业图表之王，10 色，红绿对色盲不友好", "<strong>Paired (12)</strong>：配对设计（处理前/后），12 色过载"], en: ["<strong>Tableau 10</strong>: the king of commercial charts, 10 colors, red-green pairs are not CVD-friendly", "<strong>Paired (12)</strong>: paired designs (pre/post), 12 colors are too many"] } },
        { h: { zh: "顺序型 / 发散型", en: "Sequential / Diverging" } },
        { ul: { zh: ["<strong>Viridis</strong>：matplotlib/d3 默认，感知均匀 + CVD 友好", "<strong>Cividid</strong>：Viridis 的 CVD 强化版（更蓝/黄分明）", "<strong>RdBu</strong>：发散型红蓝"], en: ["<strong>Viridis</strong>: default in matplotlib / d3, perceptually uniform + CVD-friendly", "<strong>Cividis</strong>: a CVD-reinforced version of Viridis (more distinct blue/yellow)", "<strong>RdBu</strong>: diverging red-blue"] } },
        { h: { zh: "实战原则", en: "Practical principles" } },
        { ul: { zh: ["类别数 ≤ 7，类别多时改用连续 colormap", "必须经过 CVD 模拟测试", "优先使用 CVD 友好 + 灰度友好的（顶标都用这套）"], en: ["If the number of categories ≤ 7; for more categories, switch to a continuous colormap", "Must pass CVD simulation testing", "Prefer CVD-friendly + grayscale-friendly palettes (this is what top journals use)"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码", en: "⭐ Key code" },
          purpose: { zh: "⭐ <strong>关键点 1：经典配色硬编码数组</strong>", en: "⭐ <strong>Key point 1: Hard-coding classic palettes as arrays</strong>" },
          code: L(
            "const CLASSIC_PALETTES = {",
            "  'Wong 2011':       ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],",
            "  'Paul Tol bright': ['#4477AA', '#EE6677', '#228833', '#CCBB44', '#66CCEE', '#AA3377', '#BBBBBB'],",
            "  'Okabe-Ito':       ['#000000', '#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7'],",
            "  'Tableau 10':      ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC'],",
            "  'Viridis (seq)':   d3.range(0, 1.01, 0.1).map(d3.interpolateViridis),",
            "  'RdBu (div)':      d3.range(0, 1.01, 0.1).map(t => d3.interpolateRdBu(1 - t))",
            "};",
          ),
          points: { zh: "⭐ 直接用 hex 数组硬编码比用 d3 内置 scheme 更稳——因为 scheme 名字在不同 d3 版本会变。", en: "⭐ Hard-coding as hex arrays is more stable than using d3's built-in schemes—because scheme names change across d3 versions." },
        },
      ],
      demo: {
        id: "d-3-5",
      },
      objectives: {
        zh: ["认识 Wong、Paul Tol、Okabe-Ito、Tableau、Viridis 等经典配色的适用场景", "理解「顶标都在用」的配色为什么经过 CVD 与灰度测试", "能在自己的图里直接套用并说明理由"],
        en: ["Know the use cases of classic palettes: Wong, Paul Tol, Okabe-Ito, Tableau, Viridis", "Understand why palettes favored by top venues pass CVD and grayscale tests", "Apply one directly in your own chart and justify the choice"],
      },
      summary: { zh: "经典配色是别人替你踩完坑的结果：色觉友好、灰度可辨、打印安全。写论文或做汇报时直接套用，比自已调色更稳妥——省下的时间可以用来想清楚要表达什么。", en: "Classic palettes are the result of someone else falling into the pits for you: color-vision friendly, grayscale-distinguishable, print-safe. For papers or presentations, applying one directly is safer than mixing your own — the time saved is better spent on deciding what you want to say." },
      quiz: [
        {
          q: { zh: "Okabe-Ito 配色最常被推荐的理由是什么？", en: "Why is the Okabe-Ito palette most often recommended?" },
          options: {
            zh: ["颜色最鲜艳", "对色觉障碍友好且灰度打印仍可辨", "颜色数量最多", "最容易记"],
            en: ["The most vivid colors", "Color-vision friendly and still distinguishable in grayscale print", "The most colors", "Easiest to memorize"],
          },
          answer: 1,
          explain: { zh: "Okabe-Ito 是专门为可读性设计的定性调色板，色相选择避开了色觉障碍人群难以区分的区域，并且各色亮度不同，转成灰度后依然分得开。这正是它被大量论文与教材采用的原因。", en: "Okabe-Ito is a qualitative palette designed specifically for readability: its hues avoid regions that color-vision-deficient readers struggle to separate, and its differing lightness keeps colors distinguishable in grayscale. That is exactly why it is widely adopted in papers and textbooks." },
        },
      ],
    },
    {
      id: "ch-3-6",
      title: { zh: "3.6 对错案例对比", en: "3.6 Right vs Wrong Comparison" },
      subtitle: { zh: "4 张图，3 错 1 对。点击你认为\"对\"的那张。", en: "4 figures, 3 wrong and 1 right. Click the one you think is \"correct\"." },
      explain: [
        { h: { zh: "4 个典型错误", en: "4 typical mistakes" } },
        { ul: { zh: ["<strong>⚠ 彩虹谱 Jet</strong>：非感知均匀 + CVD 不友好 + 打印不友好。Nature 已禁用。", "<strong>⚠ 红绿对比</strong>：红绿色盲眼中几乎变成同色（最严重的可访问性问题）", "<strong>⚠ 颜色过多 12 色</strong>：超过 7 种时眼睛无法区分", "<strong>✅ Wong 8 色</strong>：CVD 友好 + 灰度打印友好 + 类别数 ≤ 8"], en: ["<strong>⚠ Rainbow palette Jet</strong>: not perceptually uniform + not CVD-friendly + not print-friendly. Nature has banned it.", "<strong>⚠ Red-green contrast</strong>: to a red-green colorblind viewer, they almost become the same color (the most serious accessibility issue)", "<strong>⚠ Too many colors (12)</strong>: the eye cannot distinguish beyond 7", "<strong>✅ Wong 8-color</strong>: CVD-friendly + grayscale-print-friendly + ≤ 8 categories"] } },
        { h: { zh: "教学要点", en: "Teaching takeaways" } },
        { p: { zh: "让学生亲手投票，能加深对\"为什么是错的\"的理解——光看理论不如下场选错一次来得深。", en: "Letting students vote by hand deepens their understanding of \"why it is wrong\"—just reading theory is not as powerful as making the wrong choice in person." } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码", en: "⭐ Key code" },
          purpose: { zh: "⭐ <strong>关键点 1：构建可点击的 quiz 卡片</strong>", en: "⭐ <strong>Key point 1: Build clickable quiz cards</strong>" },
          code: L(
            "// 4 张 SVG 卡片，点哪张就高亮 + 显示原因",
            "cases.forEach((c, i) => {",
            "  const card = document.createElement('div');",
            "  card.className = 'quiz-card';",
            "  card.innerHTML = `${makeSampleBars(c.palette)}<div>${c.name}</div>`;",
            "  card.addEventListener('click', () => {",
            "    cards.forEach((cc, ii) => {",
            "      cc.classList.remove('correct', 'wrong');",
            "      if (ii === i) cc.classList.add(c.type);  // 'correct' or 'wrong'",
            "    });",
            "    showResult(c);",
            "  });",
            "  grid.appendChild(card);",
            "});",
          ),
          points: { zh: "⭐ quiz 模式比\"展示正确\"更适合教学——让学生先犯错再揭示答案。", en: "⭐ Quiz mode is more pedagogical than \"showing the right answer\"—let students make the mistake first, then reveal the answer." },
        },
      ],
      demo: {
        id: "d-3-6",
      },
      objectives: {
        zh: ["能从读者的角度判断一张图错在哪里", "识别常见的四类配色错误：彩虹数值、过多色相、无灰度层次、缺强调", "把「对错判断」变成可复用的自查清单"],
        en: ["Judge from the reader's perspective what is wrong with a chart", "Recognize four common coloring mistakes: rainbow numerics, too many hues, no grayscale ordering, missing emphasis", "Turn the right/wrong judgment into a reusable checklist"],
      },
      summary: { zh: "对错案例的价值不在「记住正确答案」，而在建立条件反射：看到数值用色相、看到十几个颜色、看到灰度下糊成一团，立刻警觉。配色问题几乎都能用「转成灰度再看一遍」测出来。", en: "The value of right/wrong cases is not memorizing the correct answer but building a reflex: numerics encoded by hue, a dozen colors, a grayscale mush — all should trigger alarm. Almost every coloring problem can be caught by 'convert to grayscale and look again'." },
      quiz: [
        {
          q: { zh: "判断一张图配色是否有问题，最省事的自检动作是？", en: "What is the quickest self-check for whether a chart's coloring has problems?" },
          options: {
            zh: ["放大看细节", "转成灰度再看一遍", "换成打印机", "问作者"],
            en: ["Zoom into details", "Convert to grayscale and look again", "Switch to a printer", "Ask the author"],
          },
          answer: 1,
          explain: { zh: "转成灰度后，所有依赖色相的编码都会消失。如果此时数据依然读得出来，说明你的编码有亮度/位置等冗余通道兜底；如果糊成一团，说明信息全靠色相，色觉障碍读者和黑白打印都会丢信息。", en: "In grayscale, all hue-dependent encoding disappears. If the data is still readable, your encoding has redundant channels such as lightness or position; if it turns to mush, the information relies entirely on hue and will be lost for color-vision-deficient readers and black-and-white printing." },
        },
      ],
    },
    {
      id: "ch-3-7",
      title: { zh: "3.7 鲜艳 + 低饱和 哲学生成器", en: "3.7 Vivid + Low-Sat Palette Generator" },
      subtitle: { zh: "颜色数量 ≤ 7、鲜艳颜色 + 低饱和度 = 好看又耐看。算法自动生成 5-7 色搭配。", en: "Color count ≤ 7, vivid colors + low saturation = beautiful and easy on the eye. The algorithm automatically generates 5–7 color combinations." },
      explain: [
        { h: { zh: "你的配色哲学（落地到 3 条规则）", en: "Your color philosophy (distilled into 3 rules)" } },
        { ol: { zh: ["<strong>颜色数量 ≤ 7</strong>：超过 7 种眼睛就分不清", "<strong>鲜艳颜色</strong>（高 H 区分度）：用 H 拉开类间距离（≥30°）", "<strong>低饱和度</strong>（S 30-50%）：每个色都别太\"冲\"，耐看"], en: ["<strong>Color count ≤ 7</strong>: beyond 7 the eye cannot tell them apart", "<strong>Vivid colors</strong> (high H differentiation): use H to separate categories (≥ 30°)", "<strong>Low saturation</strong> (S 30–50%): each color should not be too aggressive—easy on the eyes"] } },
        { h: { zh: "经验公式", en: "Empirical formulas" } },
        { ul: { zh: ["主色 S = 70-80%（鲜明但不刺眼）", "配套色 S = 30-50%（低饱和，耐看）", "强调色用互补或类比，<strong>不要全饱和</strong>", "高亮用 L=85-90%（如背景、注释）"], en: ["Primary color S = 70–80% (vivid but not harsh)", "Supporting color S = 30–50% (low saturation, easy on the eyes)", "For accent colors, use complementary or analogous, <strong>avoid full saturation</strong>", "Highlights use L = 85–90% (e.g., for backgrounds, notes)"] } },
        { h: { zh: "7 色生成规则", en: "The 7-color generation rule" } },
        { p: { zh: "主色 + 2 类比（±30°）+ 1 类比低饱和 + 1 互补 + 1 互补低饱和 + 1 高亮 = 7 色，符合\"≤ 7\"原则。", en: "Primary + 2 analogous (±30°) + 1 analogous low-saturation + 1 complementary + 1 complementary low-saturation + 1 highlight = 7 colors, conforming to the \"≤ 7\" principle." } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码", en: "⭐ Key code" },
          purpose: { zh: "⭐ <strong>关键点 1：7 色生成规则</strong>", en: "⭐ <strong>Key point 1: 7-color generation rule</strong>" },
          code: L(
            "function genPalette(H, S, L) {",
            "  return [",
            "    hslHex((H - 30 + 360) % 360, S * 0.6, L * 1.1),  // 类比 1 低饱和",
            "    hslHex((H - 30 + 360) % 360, S, L),              // 类比 1",
            "    hslHex(H, S, L),                                 // 主色",
            "    hslHex((H + 30) % 360, S, L),                    // 类比 2",
            "    hslHex((H + 30) % 360, S * 0.6, L * 1.1),        // 类比 2 低饱和",
            "    hslHex((H + 180) % 360, S * 0.8, L * 0.95),      // 互补",
            "    hslHex(H, S * 0.2, L * 1.4)                      // 高亮（极低饱和）",
            "  ];",
            "}",
          ),
          points: { zh: "⭐ <code>(H + offset + 360) % 360</code> 是 HSL 色相循环的安全写法——避免负数或 &gt; 360。", en: "⭐ <code>(H + offset + 360) % 360</code> is the safe way to cycle HSL hues—avoiding negatives or values &gt; 360." },
        },
      ],
      demo: {
        id: "d-3-7",
      },
      objectives: {
        zh: ["理解「颜色数量 ≤ 7、鲜艳 + 低饱和」背后的认知负荷依据", "能用算法生成一套 5–7 色的和谐搭配", "在鲜艳与耐看之间找到可复现的平衡点"],
        en: ["Understand the cognitive-load rationale behind 'at most seven colors, vivid yet low-saturation'", "Generate a harmonious 5–7 color palette algorithmically", "Find a reproducible balance between vivid and durable"],
      },
      summary: { zh: "「鲜艳 + 低饱和」听起来矛盾，实际是指「色相明确、明度中高、饱和度受控」：颜色彼此分得开，同时不刺眼。用算法生成的好处是参数固定、结果可复现，改一个滑块就能整套换色。", en: "'Vivid yet low-saturation' sounds contradictory but means clear hue, mid-to-high lightness and controlled saturation: colors stay distinguishable without being harsh. Generating them algorithmically makes parameters fixed and results reproducible — move one slider and the whole palette shifts." },
      quiz: [
        {
          q: { zh: "为什么图表配色通常建议不超过 7 个颜色？", en: "Why are chart palettes usually advised to stay under seven colors?" },
          options: {
            zh: ["CSS 只支持 7 个", "超过工作记忆容量，读者无法可靠记忆图例", "7 是质数", "打印限制"],
            en: ["CSS only supports seven", "Beyond working-memory capacity, readers cannot reliably memorize the legend", "Seven is prime", "Printing constraints"],
          },
          answer: 1,
          explain: { zh: "人一次能同时区分的类别大约在 7 个以内（米勒定律的量级）。超过之后读者必须反复回头看图例，认知负荷陡增。此时更应该做的是分组、排序，或改用小倍数图。", en: "People can distinguish roughly seven categories at once (the order of magnitude of Miller's law). Beyond that, readers must keep glancing back at the legend and cognitive load spikes. The better move is to group, sort, or switch to small multiples." },
        },
      ],
    },
    {
      id: "ch-3-8",
      title: { zh: "3.8 CVD 论文图测", en: "3.8 CVD Paper Figure Test" },
      subtitle: { zh: "你的图在色盲眼里还看得懂吗？拿真实顶标图做测试。", en: "Can your figure still be understood by someone with CVD? Test it with real top-journal figures." },
      explain: [
        { h: { zh: "3 个\"经典论文图\"案例", en: "3 \"classic paper figure\" cases" } },
        { ul: { zh: ["<strong>图 1：5 类别散点（Wong 配色）</strong>——Nature 风格", "<strong>图 2：顺序型热图（Viridis）</strong>——最常见的科研图", "<strong>图 3：红绿对比（错误案例）</strong>——常见但严重"], en: ["<strong>Figure 1: 5-category scatter (Wong palette)</strong>—Nature style", "<strong>Figure 2: Sequential heatmap (Viridis)</strong>—the most common scientific figure", "<strong>Figure 3: Red-green contrast (mistake case)</strong>—common but serious"] } },
        { h: { zh: "CVD 测试流程", en: "CVD testing workflow" } },
        { ol: { zh: ["把图导出 PNG", "用 <a href=\"https://www.color-blindness.com/coblis-color-blindness-simulator/\" target=\"_blank\">Coblis</a> 或 <a href=\"https://colororacle.org/\" target=\"_blank\">Color Oracle</a> 模拟", "看是否仍能区分（亮度对比 / 形状 / 标签）"], en: ["Export the figure as PNG", "Simulate with <a href=\"https://www.color-blindness.com/coblis-color-blindness-simulator/\" target=\"_blank\">Coblis</a> or <a href=\"https://colororacle.org/\" target=\"_blank\">Color Oracle</a>", "Check whether elements can still be distinguished (lightness contrast / shape / labels)"] } },
        { h: { zh: "实测结论", en: "Test results" } },
        { ul: { zh: ["Wong / Okabe-Ito / Paul Tol：✅ 在 3 种 CVD 下都能区分", "红绿对比：⚠ 在绿盲眼中几乎同色（最严重）", "Nature/Science/Cell 已逐步迁移到 CVD 友好配色"], en: ["Wong / Okabe-Ito / Paul Tol: ✅ distinguishable under all 3 types of CVD", "Red-green contrast: ⚠ almost the same color to green-blind viewers (most severe)", "Nature / Science / Cell have been gradually migrating to CVD-friendly palettes"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码", en: "⭐ Key code" },
          purpose: { zh: "⭐ <strong>关键点 1：把 SVG 中所有 fill 做 CVD 模拟</strong>", en: "⭐ <strong>Key point 1: Apply CVD simulation to every fill in an SVG</strong>" },
          code: L(
            "function cvdTransformSvg(svgString, type) {",
            "  const doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');",
            "  doc.querySelectorAll('[fill]').forEach(el => {",
            "    const c = d3.color(el.getAttribute('fill'));",
            "    if (!c) return;",
            "    const rgb = [Math.round(c.rgb().r), Math.round(c.rgb().g), Math.round(c.rgb().b)];",
            "    const sim = simulateCVD(rgb, type);",
            "    el.setAttribute('fill', `rgb(${sim.join(',')})`);",
            "  });",
            "  return new XMLSerializer().serializeToString(doc);",
            "}",
          ),
          points: { zh: "⭐ 用 <code>DOMParser</code> 解析 SVG 字符串，遍历所有 <code>fill</code> 属性应用 CVD 矩阵。比手写 SVG 字符串拼接安全。", en: "⭐ Use <code>DOMParser</code> to parse SVG strings, then walk all <code>fill</code> attributes and apply the CVD matrix. Safer than hand-concatenating SVG strings." },
        },
      ],
      demo: {
        id: "d-3-8",
      },
      objectives: {
        zh: ["能用 CVD 模拟矩阵检验自己的论文图", "理解「作者觉得清楚」与「所有读者都清楚」之间的差距", "建立投稿前的配色检查习惯"],
        en: ["Use CVD simulation matrices to check your own paper figures", "Understand the gap between 'clear to the author' and 'clear to every reader'", "Build a habit of checking palettes before submission"],
      },
      summary: { zh: "CVD 论文图测把「我觉得看得清」变成可量化的检查。约 8% 的男性存在某种色觉障碍，意味着每十几个读者里就可能有人读不出你的图。花五分钟模拟一遍，是最便宜的保险。", en: "The CVD paper-figure test turns 'it looks clear to me' into a quantifiable check. About 8% of men have some form of color-vision deficiency, so among a dozen readers one may not read your figure at all. Five minutes of simulation is the cheapest insurance available." },
      quiz: [
        {
          q: { zh: "CVD 模拟通过后，是否还需要保留色相以外的冗余编码？", en: "After passing CVD simulation, do you still need redundant encoding beyond hue?" },
          options: {
            zh: ["不需要了", "仍然建议保留（亮度/形状/直接标注）", "只在高清图上需要", "只在黑白打印时需要"],
            en: ["No longer needed", "Still advisable (lightness / shape / direct labels)", "Only for high-resolution figures", "Only for black-and-white printing"],
          },
          answer: 1,
          explain: { zh: "CVD 模拟只覆盖色觉障碍一种情况。灰度打印、投影仪偏色、屏幕亮度不足都会吃掉色相信息。多留一条通道（长度、亮度、纹理或直接标数值）几乎不增加成本，却能覆盖所有这些退化场景。", en: "CVD simulation covers only color-vision deficiency. Grayscale printing, projector color casts and dim screens all eat hue information too. Keeping one extra channel (length, lightness, texture, or direct labels) costs almost nothing yet covers every one of these degraded scenarios." },
        },
      ],
    },
  ],
};
