// ============================================================
// lesson-04/content.js — 第 4 章 · 低维数据可视化 单一内容源（中英双语）
// 由 shared/render.js 渲染成三 tab 教学页面
// 由旧版内联 HTML 迁移而来（保留全部原文与英文对照）
// ============================================================

const L = (...lines) => lines.join("\n");

export const CONTENT = {
  meta: {
    title: { zh: "第 4 章 · 低维可视化", en: "Ch 4 · Low-Dim" },
    navLabel: { zh: "第 4 章 · 低维可视化", en: "Ch 4 · Low-Dim" },
    subtitle: { zh: "三层坐标变换、曲线拟合、Cleveland 45° 倾角与 Marching Squares 等值线。", en: "Three-layer coordinate transforms, curve fitting, Cleveland's 45° banking angle and Marching Squares contours." },
    prev: { href: "../lesson-03/", label: { zh: "第 3 章 · 色彩专题", en: "Ch 3 · Color" } },
    next: { href: "../lesson-05/", label: { zh: "第 5 章 · 时序可视化", en: "Ch 5 · Time Series" } },
  },

  sections: [
    {
      id: "ch-4-1",
      title: { zh: "4.1 数据转换", en: "4.1 Data Transformation" },
      subtitle: { zh: "你的 Crime 数据是宽格式，可视化常需要长格式。转换函数一行解决。", en: "Your Crime data is in wide format, but visualization often needs long format. A one-liner conversion function handles it." },
      explain: [
        { note: { zh: "🎨 本节使用了 colormap（Viridis）画热图。colormap 理论详见\n              <a href=\"../lesson-03/#ch-3-2\">第 3 章 3.2 colormap 三类选择</a>。", en: "🎨 本节使用了 colormap（Viridis）画热图。colormap 理论详见\n              <a href=\"../lesson-03/#ch-3-2\">第 3 章 3.2 colormap 三类选择</a>。" } },
        { h: { zh: "你的原案例", en: "Your Original Case" } },
        { p: { zh: "原 5.1 节用了 1985 美国 50 州犯罪数据（CSV），含 8 个犯罪指标列。", en: "Section 5.1 used 1985 U.S. crime data (CSV) for the 50 states, with 8 crime-indicator columns." } },
        { h: { zh: "嵌入陈为教材理论", en: "Embedded Theory" } },
        { ul: { zh: ["<strong>长格式（long）</strong>：每行一个观测，列 = 字段（如 <code>{state, metric, value}</code>）。优点：方便过滤、分组、绑定到 d3 join。", "<strong>宽格式（wide）</strong>：每行一个实体，列 = 指标（如 <code>{state, murder, robbery, ...}</code>）。优点：人眼读得懂、直观。", "<strong>转换</strong>：<code>flatMap</code> + 循环键名 = 几行代码搞定。", "<strong>d3.autoType</strong>：自动推断列类型（数字、日期、布尔），省得手动 <code>+d.field</code>。"], en: ["<strong>Long format (long)</strong>: one observation per row, columns = fields (e.g., <code>{state, metric, value}</code>). Pros: easy to filter, group, and bind to a d3 join.", "<strong>Wide format (wide)</strong>: one entity per row, columns = metrics (e.g., <code>{state, murder, robbery, ...}</code>). Pros: human-readable and intuitive.", "<strong>Conversion</strong>: <code>flatMap</code> + iterating over key names = a few lines of code.", "<strong>d3.autoType</strong>: auto-infers column types (number, date, boolean), saving you from manual <code>+d.field</code>."] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：d3.csv 第二参 = 类型转换回调</strong>", en: "&#9733; <strong>Key Point 1: the second argument of d3.csv = the type-conversion callback</strong>" },
          code: L(
            "// ⭐ 自动类型推断（数字/日期/布尔）",
            "const raw = await d3.csv('./data/crime.csv', d3.autoType);",
            "console.log(raw[0]);  // {state: 'Alabama', population: 3979000, murder: 350, ...}",
          ),
          points: { zh: "⭐ <code>d3.autoType</code> 内部就是遍历每列、用 <code>Number()</code> / <code>Date()</code> / 字符串检测。能识别的就转、识别不了保持字符串。", en: "&#9733; <code>d3.autoType</code> internally walks each column using <code>Number()</code> / <code>Date()</code> / string detection. Recognized types are converted; unrecognized values stay as strings." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：宽 → 长（flatMap 模式）</strong>", en: "&#9733; <strong>Key Point 2: wide &rarr; long (the flatMap pattern)</strong>" },
          code: L(
            "// ⭐ flatMap：每行展开成多个观测",
            "const long = raw.flatMap(d =>",
            "  ['murder', 'robbery', 'burglary'].map(key => ({",
            "    state:  d.state,",
            "    metric: key,",
            "    value:  d[key]",
            "  }))",
            ");",
            "// 现在可以做：d3.group(long, d => d.metric)",
          ),
          points: { zh: "⭐ <code>flatMap</code> 是 ES2019，是 \"map + 一维 flatten\" 的简写。比 <code>map().flat()</code> 链式更直观。", en: "&#9733; <code>flatMap</code> is ES2019, shorthand for &ldquo;map + one-level flatten&rdquo;. More intuitive than the <code>map().flat()</code> chain." },
        },
      ],
      demo: {
        id: "d-4-1",
      },
      objectives: {
        zh: ["理解宽格式转长格式的动机与写法", "掌握 flatMap + map 的组合用法", "能判断一份数据该用宽格式还是长格式进入可视化"],
        en: ["Understand why and how to convert wide to long format", "Master combining flatMap with map", "Decide whether data should enter visualization as wide or long"],
      },
      summary: { zh: "宽格式一列一个指标，长格式一行一个 (维度, 指标, 值)。绝大多数图表库（含 d3 的比例尺、图例、堆叠）都假设输入是长格式，所以转换通常是可视化前的第一步。", en: "Wide format has one column per measure; long format has one row per (dimension, measure, value). Most charting libraries — including d3's scales, legends and stacking — assume long-format input, so the conversion is usually the first step before visualizing." },
      quiz: [
        {
          q: { zh: "把「每列一个指标」的宽表转成长表，最合适的数组方法是？", en: "Which array method best converts a wide table with one column per measure into long format?" },
          options: {
            zh: ["filter", "flatMap", "reduce", "sort"],
            en: ["filter", "flatMap", "reduce", "sort"],
          },
          answer: 1,
          explain: { zh: "每一行要展开成多行（一个指标一行），filter/reduce/sort 都不改变行数，只有 flatMap 能把一条输入映射成零或多条输出并自动拍平，正适合这种一对多的展开。", en: "Each row must expand into several rows (one per measure). filter/reduce/sort never change the row count, while flatMap maps one input to zero or more outputs and flattens automatically — exactly what this one-to-many expansion needs." },
        },
      ],
    },
    {
      id: "ch-4-2",
      title: { zh: "4.2 坐标轴变换", en: "4.2 Axis Transformation" },
      subtitle: { zh: "数据空间 → 坐标系空间 → 屏幕空间。三层职责分明，错了就乱套。", en: "Data space &rarr; coordinate system space &rarr; screen space. Three layers with clearly separated responsibilities; mix them up and everything falls apart." },
      explain: [
        { h: { zh: "你的原案例", en: "Your Original Case" } },
        { p: { zh: "原 5.1.2 节用散点展示 Crime 数据（murder vs robbery），坐标轴是 1985 数据。", en: "Section 5.1.2 used a scatter plot to display Crime data (murder vs. robbery), with the 1985 data on the coordinate axes." } },
        { h: { zh: "嵌入陈为教材理论", en: "Embedded Theory" } },
        { ul: { zh: ["<strong>三层空间</strong>：\n                <ol>\n                  <li><strong>数据空间</strong>：原始数值（如人口 27058000、谋杀率 8）</li>\n                  <li><strong>坐标系空间</strong>：归一化到 0..innerWidth（标准化坐标）</li>\n                  <li><strong>屏幕空间</strong>：加上 margin 偏移（最终像素位置）</li>\n                </ol>", "<strong>为什么分层</strong>：坐标系空间内的元素（线、点）可以共享，切换屏幕尺寸时无需重算。d3.axisBottom 自动帮你做坐标系→屏幕。", "<strong>scale 选型</strong>：\n                <ul>\n                  <li><code>scaleLinear</code>：均匀分布，最常用</li>\n                  <li><code>scaleLog</code>：跨数量级（人口从 53 万到 2700 万）</li>\n                  <li><code>scaleSqrt</code>：面积感知（圆面积映射到值）</li>\n                  <li><code>scaleBand</code>：类别轴（柱状图）</li>\n                </ul>"], en: ["<strong>Three-layer space</strong>:\n                <ol>\n                  <li><strong>Data Space</strong>: raw values (e.g., population 27058000, murder rate 8)</li>\n                  <li><strong>Coordinate Space</strong>: normalized to 0..innerWidth (standardized coordinates)</li>\n                  <li><strong>Screen Space</strong>: add the margin offset (final pixel positions)</li>\n                </ol>", "<strong>Why layer them</strong>: elements inside the coordinate system space (lines, points) can be shared &mdash; no recalculation when the screen size changes. d3.axisBottom handles the coordinate-system &rarr; screen step automatically.", "<strong>Scale selection</strong>:\n                <ul>\n                  <li><code>scaleLinear</code>: uniform distribution, most common</li>\n                  <li><code>scaleLog</code>: spans orders of magnitude (population from 530k to 27M)</li>\n                  <li><code>scaleSqrt</code>: area-aware (maps circle area to value)</li>\n                  <li><code>scaleBand</code>: categorical axis (bar charts)</li>\n                </ul>"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：数据空间 vs 屏幕空间，两层 scale</strong>", en: "&#9733; <strong>Key Point 1: data space vs. screen space &mdash; two layers of scales</strong>" },
          code: L(
            "// 数据空间：值 → 坐标系",
            "const xData = d3.scaleLinear()",
            "  .domain([0, d3.max(data, d => d.x)])",
            "  .range([0, innerW]);",
            "",
            "// 屏幕空间：坐标系 → 屏幕（加 margin）",
            "const xScreen = d3.scaleLinear()",
            "  .domain([0, innerW])",
            "  .range([M.l, M.l + innerW]);",
            "",
            "// 渲染：数据 → 坐标系 → 屏幕",
            ".attr('cx', d => xScreen(xData(d.x)))",
          ),
          points: { zh: "⭐ 错位示范：直接把 domain/max 和 range/[M.l, M.l+innerW] 写在一个 scale 里 → 改 margin 要改两处。三层分立就清爽。", en: "&#9733; Misalignment example: writing <code>domain=max</code> and <code>range=[M.l, M.l+innerW]</code> in one scale &rarr; changing the margin means editing two places. The three-layer separation keeps things clean." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：log scale 跨数量级</strong>", en: "&#9733; <strong>Key Point 2: log scale spans orders of magnitude</strong>" },
          code: L(
            "// 50 州人口从 53 万到 2700 万（差 50 倍）",
            "// linear 缩放下，小州挤成一团，CA/NY/TX 占满屏幕",
            "const xLog = d3.scaleLog()",
            "  .domain([1, d3.max(data, d => d.x)])",
            "  .range([0, innerW]);",
          ),
          points: { zh: "⭐ log 轴对\"指数增长\"数据特别合适。人的视觉是\"乘法\"而不是\"加法\"，所以 log 让\"等比数列\"在屏幕上\"等距\"。", en: "&#9733; A log axis is especially well-suited for &ldquo;exponential growth&rdquo; data. Human vision is &ldquo;multiplicative&rdquo; rather than &ldquo;additive&rdquo;, so log turns a &ldquo;geometric sequence&rdquo; into &ldquo;equally-spaced&rdquo; points on screen." },
        },
      ],
      demo: {
        id: "d-4-2",
      },
      objectives: {
        zh: ["区分数据空间、坐标系空间、屏幕空间三层职责", "掌握 d3.scaleLinear / scaleLog / scaleBand 的选取", "理解三层之间错误的传播方式"],
        en: ["Distinguish the responsibilities of data space, coordinate space and screen space", "Master choosing among d3.scaleLinear / scaleLog / scaleBand", "Understand how errors propagate between the three layers"],
      },
      summary: { zh: "三层坐标变换是「原始值 → 归一化值 → 像素值」的流水线。把三层混在一起写，代码会迅速变得不可维护；分开之后，换坐标系只改中间一层，换画布大小只改最后一层。", en: "The three-layer coordinate transform is a pipeline of 'raw value → normalized value → pixel value'. Mixing the layers makes code unmaintainable fast; separated, changing the coordinate system touches only the middle layer and changing canvas size only the last." },
      quiz: [
        {
          q: { zh: "把「年月日」映射到「一年中的第几天」，属于哪一层变换？", en: "Mapping 'year-month-day' to 'day of year' belongs to which layer?" },
          options: {
            zh: ["数据空间变换", "坐标系空间变换", "屏幕空间变换", "不属于任何一层"],
            en: ["Data space transformation", "Coordinate space transformation", "Screen space transformation", "None of the layers"],
          },
          answer: 0,
          explain: { zh: "这一步还在改变数据本身的含义（日期 → 序数），属于数据变换；坐标系空间负责把序数映射到 0–1 或角度；屏幕空间才负责乘上像素尺寸。三层分清，bug 才好定位。", en: "This step still changes the meaning of the data itself (date → ordinal), so it is a data transformation; coordinate space maps the ordinal to 0–1 or an angle, and screen space multiplies by pixel size. Keeping the three apart is what makes bugs locatable." },
        },
      ],
    },
    {
      id: "ch-4-3",
      title: { zh: "4.3 曲线拟合", en: "4.3 Curve Fitting" },
      subtitle: { zh: "同 50 个点，用 10 种 line.curve 画风各异。什么时候用哪种？", en: "Same 50 points, 10 different line.curve styles. Which to use when?" },
      explain: [
        { h: { zh: "你的原案例", en: "Your Original Case" } },
        { p: { zh: "原 5.1.3 节用折线 + 散点展示趋势。原始代码用了 <code>curveCatmullRom</code>，没讲为什么。", en: "Section 5.1.3 used a line + scatter plot to show trends. The original code used <code>curveCatmullRom</code> without explaining why." } },
        { h: { zh: "嵌入陈为教材理论", en: "Embedded Theory" } },
        { ul: { zh: ["<strong>插值 vs 拟合</strong>：\n                <ul>\n                  <li>插值（interpolation）：曲线经过所有数据点（如 Catmull-Rom、Natural）</li>\n                  <li>拟合（fitting）：曲线不经过数据点，只反映趋势（如线性回归 LOESS）</li>\n                </ul>", "<strong>d3.line().curve()</strong> 提供 10+ 种 curve，最常用：", "<strong>step 系</strong>：用于离散阶跃（数字信号、状态切换）", "<strong>catmullRom / natural</strong>：过所有点的张力样条，\"看起来平滑\"", "<strong>monotoneX</strong>：保持原数据序列单调（不会出现伪震荡）", "<strong>选择原则</strong>：数据有顺序性 → monotoneX / linear；数据本身抖动大 → catmullRom / basis 平滑；离散状态 → step"], en: ["<strong>Interpolation vs. Fitting</strong>:\n                <ul>\n                  <li><strong>Interpolation</strong>: the curve passes through every data point (e.g., Catmull-Rom, Natural)</li>\n                  <li><strong>Fitting</strong>: the curve does not necessarily pass through data points, only reflects the trend (e.g., linear regression, LOESS)</li>\n                </ul>", "<strong>d3.line().curve()</strong> offers 10+ curves; the most commonly used are:", "<strong>step family</strong>: for discrete steps (digital signals, state transitions)", "<strong>catmullRom / natural</strong>: tension splines that pass through all points &mdash; &ldquo;looks smooth&rdquo;", "<strong>monotoneX</strong>: preserves the monotonicity of the original data sequence (no spurious oscillations)", "<strong>Selection principles</strong>: ordered data &rarr; <code>monotoneX</code> / <code>linear</code>; jittery data &rarr; <code>catmullRom</code> / <code>basis</code> to smooth; discrete states &rarr; <code>step</code>"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：d3.line + curve 一行切换</strong>", en: "&#9733; <strong>Key Point 1: switch curves with d3.line + curve in one line</strong>" },
          code: L(
            "const line = d3.line()",
            "  .x(d => xScale(d.x))",
            "  .y(d => yScale(d.y))",
            "  .curve(d3.curveCatmullRom);     // <- 这一行换 curve 类型",
            "",
            "svg.append('path').datum(data).attr('d', line);",
          ),
          points: { zh: "⭐ <code>datum(data)</code> 把数组当整体传给 path（不是每个元素绑一个）。d3.line 内部循环生成 M/L/C 命令。", en: "&#9733; <code>datum(data)</code> passes the array as a whole to the path (not one element at a time). Inside, d3.line loops to generate M/L/C commands." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：拟合 vs 插值的取舍</strong>", en: "&#9733; <strong>Key Point 2: the trade-off between fitting and interpolation</strong>" },
          code: L(
            "// 拟合：d3.regressionLinear / d3.regressionLoess",
            "import { regressionLinear } from 'd3-regression';",
            "const lin = regressionLinear()",
            "  .x(d => d.population)",
            "  .y(d => d.murder)",
            "  .domain([0, d3.max(data, d => d.population)]);",
            "const points = lin(data);  // 起点-终点",
            "svg.append('path').attr('d', d3.line()(points));",
          ),
          points: { zh: "⭐ 经验法则：散点超过 30 个 → 用拟合；散点 &lt; 10 个 → 用插值（保持信息完整）。Crime 数据 50 个州 → 拟合更稳。", en: "&#9733; Rule of thumb: more than 30 points &rarr; use fitting; fewer than 10 points &rarr; use interpolation (preserve full information). Crime data has 50 states &rarr; fitting is more robust." },
        },
      ],
      demo: {
        id: "d-4-3",
      },
      objectives: {
        zh: ["认识 d3.line 的 10 种 curve 插值方式及其视觉差异", "理解插值是「在没有数据的地方做声明」", "能根据数据密度与语义选合适的 curve"],
        en: ["Recognize d3.line's ten curve interpolation modes and their visual differences", "Understand that interpolation 'makes claims where there is no data'", "Choose an appropriate curve based on data density and semantics"],
      },
      summary: { zh: "curve 的选择是语义选择而非审美选择：线性表示「只有这些点可信」，平滑曲线表示「底层过程连续」，阶梯表示「值在某段时间内恒定」。选错曲线等于对读者做无声的断言。", en: "Choosing a curve is a semantic choice, not an aesthetic one: linear says 'only these points are trustworthy', a smooth curve says 'the underlying process is continuous', and a step says 'the value holds constant for a while'. The wrong curve makes a silent claim to the reader." },
      quiz: [
        {
          q: { zh: "表示「每日收盘价」这类离散观测，最稳妥的 curve 是？", en: "Which curve is safest for discrete observations such as daily closing prices?" },
          options: {
            zh: ["curveBasis（平滑）", "curveLinear（直线）", "curveCardinal（过点平滑）", "curveCatmullRom"],
            en: ["curveBasis (smooth)", "curveLinear (straight)", "curveCardinal (point-hugging smooth)", "curveCatmullRom"],
          },
          answer: 1,
          explain: { zh: "收盘价是离散观测，任何平滑都会在两个观测之间造出「看似存在」的中间值。curveLinear 只连接真实数据点，不做额外声明；如果确实想强调趋势，可以另加一条拟合线并明确标注。", en: "Closing prices are discrete observations, and any smoothing invents intermediate values that appear to exist between them. curveLinear only connects real data points without extra claims; if you want to emphasize the trend, add a separate fitted line and label it clearly." },
        },
      ],
    },
    {
      id: "ch-4-4",
      title: { zh: "4.4 倾角感知（45° 黄金角）", en: "4.4 Slope Perception (45° Sweet Spot)" },
      subtitle: { zh: "人眼对斜率的估计 不是 线性的。45° 是视觉\"中点\"。", en: "Human perception of slope is not linear. 45&deg; is the visual &ldquo;midpoint&rdquo;." },
      explain: [
        { h: { zh: "你的原案例", en: "Your Original Case" } },
        { p: { zh: "原 5.1.4 节提到\"平均倾斜度最优为 45°\"，但没解释原因。", en: "Section 5.1.4 mentions that &ldquo;the optimal average slope is 45&deg;&rdquo; without explaining why." } },
        { h: { zh: "嵌入陈为教材理论", en: "Embedded Theory" } },
        { ul: { zh: ["<strong>Cleveland 1984 实验</strong>：让被试估计直线的斜率，发现：\n                <ul>\n                  <li>斜率 = 0° 或 90° 时，估计误差最大</li>\n                  <li>斜率 = 45° 时，估计最准</li>\n                  <li>呈 U 型曲线</li>\n                </ul>", "<strong>Stevens 幂律</strong>：感知斜率 ≈ (真实斜率)^1.0 ~ 1.3。即人眼把\"陡度\"夸张了 30%。", "<strong>设计原则</strong>：\n                <ul>\n                  <li>关键数据斜率落在 30°~60° 区间最稳</li>\n                  <li>对比增长曲线时，用 log 轴让陡度落在 45° 左右</li>\n                  <li>避免在 5° 以下或 85° 以上做趋势对比（误差太大）</li>\n                </ul>"], en: ["<strong>Cleveland 1984 experiment</strong>: subjects were asked to estimate line slopes:\n                <ul>\n                  <li>Slope = 0&deg; or 90&deg;: estimation error is largest</li>\n                  <li>Slope = 45&deg;: estimation is most accurate</li>\n                  <li>The error curve is U-shaped</li>\n                </ul>", "<strong>Stevens&rsquo; power law</strong>: perceived slope &asymp; (actual slope)<sup>1.0&ndash;1.3</sup>. In other words, the eye exaggerates &ldquo;steepness&rdquo; by about 30%.", "<strong>Design principles</strong>:\n                <ul>\n                  <li>Key data slopes are most stable in the 30&deg;&ndash;60&deg; range</li>\n                  <li>When comparing growth curves, use a log axis so steepness lands near 45&deg;</li>\n                  <li>Avoid trend comparisons below 5&deg; or above 85&deg; (errors grow too large)</li>\n                </ul>"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：极坐标转笛卡尔坐标</strong>", en: "&#9733; <strong>Key Point 1: convert polar to Cartesian coordinates</strong>" },
          code: L(
            "// 角度 → 屏幕坐标",
            "function lineAtAngle(angleDeg, length = 240, origin = {x: 100, y: 240}) {",
            "  const r = (angleDeg * Math.PI) / 180;",
            "  return {",
            "    x1: origin.x,",
            "    y1: origin.y,",
            "    x2: origin.x + length * Math.cos(r),",
            "    y2: origin.y - length * Math.sin(r)   // SVG y 向下为正，所以取负",
            "  };",
            "}",
          ),
          points: { zh: "⭐ SVG 的 y 轴向下（与数学相反），所以 sin 角度项要取负。这是初学者最常踩的坑。", en: "&#9733; SVG&rsquo;s y axis points downward (opposite to math convention), so the sine term must be negated. This is the most common pitfall for beginners." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：把抽象理论变成可调参数</strong>", en: "&#9733; <strong>Key Point 2: turn abstract theory into tunable parameters</strong>" },
          code: L(
            "// 让用户拖滑块改角度，立刻看到\"哪段斜率最稳\"",
            "const slider = document.getElementById('angle');",
            "slider.addEventListener('input', e => {",
            "  const angle = +e.target.value;",
            "  renderLine(angle);     // 30°~60° 误差小，0°/90° 误差大",
            "});",
          ),
        },
      ],
      demo: {
        id: "d-4-4",
      },
      objectives: {
        zh: ["理解人眼对斜率的估计不是线性的", "记住 45° 是斜率判断的「视觉中点」", "能把倾角结论应用到折线图与散点连线的设计上"],
        en: ["Understand that human slope estimation is not linear", "Remember that 45° is the visual midpoint for judging slope", "Apply the banking-angle conclusion to line charts and scatter connections"],
      },
      summary: { zh: "Cleveland 的实验表明：沿接近 45° 的连线判断差值，误差最小、速度最快。原因是水平与垂直距离都参与判断，双通道互相校验。这条结论对所有「连接数据点的线」都适用。", en: "Cleveland's experiments show that judging differences along lines near 45° yields the smallest error and fastest speed, because both horizontal and vertical distances participate and the two channels cross-check each other. The conclusion applies to every line that connects data points." },
      quiz: [
        {
          q: { zh: "为什么约 45° 的倾角最容易被准确读取？", en: "Why is a slope of about 45° read most accurately?" },
          options: {
            zh: ["屏幕是方的", "水平与垂直距离都参与判断，双通道互相校验", "45° 最好看", "渲染最快"],
            en: ["Screens are square", "Both horizontal and vertical distances participate, so two channels cross-check", "45° looks best", "It renders fastest"],
          },
          answer: 1,
          explain: { zh: "接近水平或垂直时，判断几乎只依赖一个通道；接近 45° 时两个通道贡献相当，误差可以互相补偿。这也是「banking to 45°」成为折线图设计原则的原因。", en: "Near horizontal or vertical, judgment relies almost entirely on one channel; near 45° both channels contribute comparably and their errors compensate. This is why 'banking to 45°' became a line-chart design principle." },
        },
      ],
    },
    {
      id: "ch-4-5",
      title: { zh: "4.5 等值线（Marching Squares）", en: "4.5 Marching Squares (Contour Lines)" },
      subtitle: { zh: "给定标量场 + 阈值，追踪 值 = 阈值 的曲线。", en: "Given a scalar field + threshold, trace the curve where value = threshold." },
      explain: [
        { h: { zh: "你的原案例", en: "Your Original Case" } },
        { p: { zh: "原 5.2.2 节用 Marching Squares 提取 Crime 数据的等值线。原始代码是截图占位。", en: "Section 5.2.2 used Marching Squares to extract isocontours from Crime data. The original code was a screenshot placeholder." } },
        { h: { zh: "嵌入陈为教材理论", en: "Embedded Theory" } },
        { ul: { zh: ["<strong>Marching Squares 原理</strong>：把标量场离散化为网格，每个 cell 4 个角的\"是否大于阈值\"决定 case 编号 0~15（2⁴=16 种）。每种 case 对应 0/1/2 条线段，把\"超过阈值\"和\"未超过阈值\"的两片区域分开。", "<strong>16 种 case</strong>：编码 bit0=BL、bit1=BR、bit2=TR、bit3=TL。", "<strong>扩展到 3D</strong>：Marching Cubes（Lorensen & Cline 1987），2⁸=256 种 case，常用于医学 MRI / CT 等值面提取。", "<strong>应用场景</strong>：\n                <ul>\n                  <li>地形等高线（地图）</li>\n                  <li>医学影像（MRI/CT 等值面）</li>\n                  <li>密度等高图（核密度估计）</li>\n                  <li>天气预报（等温线、等压线）</li>\n                </ul>"], en: ["<strong>How Marching Squares works</strong>: discretize the scalar field into a grid. For each cell, the &ldquo;above threshold / not&rdquo; state of its 4 corners yields a case index from 0 to 15 (2<sup>4</sup> = 16 cases). Each case corresponds to 0, 1, or 2 line segments that separate the &ldquo;above-threshold&rdquo; region from the &ldquo;not&rdquo; region.", "<strong>16 cases</strong>: encoded as bit0=BL, bit1=BR, bit2=TR, bit3=TL.", "<strong>Extension to 3D</strong>: Marching Cubes (Lorensen &amp; Cline, 1987), with 2<sup>8</sup> = 256 cases, widely used for extracting isosurfaces from medical MRI / CT scans.", "<strong>Application scenarios</strong>:\n                <ul>\n                  <li>Terrain contour lines (maps)</li>\n                  <li>Medical imaging (MRI / CT isosurfaces)</li>\n                  <li>Density contours (kernel density estimation)</li>\n                  <li>Weather forecasting (isotherms, isobars)</li>\n                </ul>"] } },
      ],
      code: [
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 1：16 case lookup table（核心数据结构）</strong>", en: "&#9733; <strong>Key Point 1: the 16-case lookup table (core data structure)</strong>" },
          code: L(
            "// ⭐ 16 种 case 每种对应 0/1/2 条线段（用边的编号表示）",
            "// 边编号：0=左中, 1=下中, 2=右中, 3=上中",
            "const EDGE_TABLE = [",
            "  [],                  // 0000 全小",
            "  [[3, 0]],            // 0001 仅 BL 大",
            "  [[0, 1]],            // 0010 仅 BR 大",
            "  [[3, 1]],            // 0011 BL+BR",
            "  [[1, 2]],            // 0100 仅 TR 大",
            "  [[3, 0], [1, 2]],    // 0101（saddle 鞍点，需）",
            "  [[0, 2]],            // 0110 BR+TR",
            "  [[3, 2]],            // 0111",
            "  [[2, 3]],            // 1000 仅 TL 大",
            "  [[2, 0]],            // 1001 TL+BL",
            "  [[0, 1], [2, 3]],    // 1010（saddle）",
            "  [[2, 1]],",
            "  [[1, 3]],",
            "  [[1, 0]],",
            "  [[0, 3]],",
            "  []                   // 1111 全大",
            "];",
          ),
          points: { zh: "⭐ <strong>saddle case（5 和 10）是 Marching Squares 唯一需要\"判断中心值\"的歧义情况</strong>——其它 14 种 case 一查表就出。Saddle 用 cell 中心点对比阈值决定连线方向。", en: "&#9733; <strong>The saddle case (5 and 10) is the only ambiguous situation in Marching Squares that requires &ldquo;checking the center value&rdquo;</strong> &mdash; the other 14 cases are resolved with a simple lookup. For saddle cases, compare the cell center to the threshold to decide how to connect the line segments." },
        },
        {
          title: { zh: "⭐ 关键代码 ②", en: "&#9733; Key Code (2)" },
          purpose: { zh: "⭐ <strong>关键点 2：位运算拼 case 编号</strong>", en: "&#9733; <strong>Key Point 2: assemble the case index with bitwise operations</strong>" },
          code: L(
            "// 4 个角是否 > 阈值 → 4 位二进制 → case 编号",
            "let code = 0;",
            "if (bl > threshold) code |= 1;   // bit 0",
            "if (br > threshold) code |= 2;   // bit 1",
            "if (tr > threshold) code |= 4;   // bit 2",
            "if (tl > threshold) code |= 8;   // bit 3",
            "",
            "const lines = EDGE_TABLE[code];   // 查表",
          ),
        },
      ],
      demo: {
        id: "d-4-5",
      },
      objectives: {
        zh: ["理解 Marching Squares 的基本思想：逐格判断、查表连线", "能说出它与线性插值的结合点", "认识等值线在标量场可视化中的定位"],
        en: ["Understand the core idea of Marching Squares: decide per cell, connect by lookup table", "Explain where it combines with linear interpolation", "Situate contour lines within scalar-field visualization"],
      },
      summary: { zh: "Marching Squares 把连续的标量场离散成网格，对每个格子按四个角的值查表决定线段怎么穿过去，再用线性插值确定精确交点。实现简单、结果稳定，是等值线的标准算法。", en: "Marching Squares discretizes a continuous scalar field into a grid, uses a lookup table per cell to decide how a segment crosses it, and linear interpolation to find exact crossing points. Simple, stable, and the standard algorithm for contour lines." },
      quiz: [
        {
          q: { zh: "Marching Squares 中，线段与格子边的交点位置如何确定？", en: "In Marching Squares, how is the intersection of a segment with a cell edge determined?" },
          options: {
            zh: ["取边中点", "用角点值线性插值", "随机", "取格心"],
            en: ["Take the edge midpoint", "Linearly interpolate from the corner values", "Randomly", "Take the cell center"],
          },
          answer: 1,
          explain: { zh: "查表只决定「连哪两条边」，具体连在什么位置由线性插值给出：阈值落在两个角点值之间的比例，就是交点在边上的比例。这样等值线才会平滑地穿过场，而不是一律走中点。", en: "The lookup table only decides which two edges to connect; the exact position comes from linear interpolation — the ratio at which the threshold falls between two corner values becomes the ratio along the edge. This is what lets contours pass smoothly through the field instead of always hitting midpoints." },
        },
      ],
    },
  ],
};
