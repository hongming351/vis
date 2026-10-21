// ============================================================
// lesson-01/demos.js — 第 1 章「数据」的交互演示与概念图
// 使用全局 d3（vendor/d3.min.js 已作为普通脚本加载）
// ============================================================

const d3 = globalThis.d3;

function makeSvg(mount, W, H) {
  return d3.select(mount).append("svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "auto")
    .style("max-width", W + "px")
    .style("display", "block")
    .style("margin", "8px auto");
}

export const DEMOS = {};

// ---------- 1.1 数据加载演示 ----------
DEMOS["d-3-1"] = async (mount) => {
  mount.innerHTML = `
    <div class="console" id="d-3-1-log">加载中…</div>
    <div class="controls">
      <button id="d-3-1-reload" class="demo-btn">重新加载</button>
    </div>
    <h4>字段映射（中文 → 英文）</h4>
    <table class="table">
      <thead><tr><th>CSV 中文</th><th>JS 变量</th><th>类型</th></tr></thead>
      <tbody>
        <tr><td>序号</td><td>id</td><td>Number</td></tr>
        <tr><td>姓名</td><td>name</td><td>String</td></tr>
        <tr><td>性别</td><td>gender</td><td>String</td></tr>
        <tr><td>生日</td><td>birthday</td><td>Date</td></tr>
        <tr><td>年龄</td><td>age</td><td>Number</td></tr>
        <tr><td>班级</td><td>class</td><td>String</td></tr>
      </tbody>
    </table>
    <h4>转换后数据（前 10 行）</h4>
    <div id="d-3-1-table"></div>
  `;
  const log = (msg) => {
    const el = document.getElementById("d-3-1-log");
    if (el) el.textContent += "\n" + msg;
  };
  const run = async () => {
    const el = document.getElementById("d-3-1-log");
    if (el) el.textContent = "⏳ 加载 ./data/newstudent.csv...";
    const transformRow = (d) => ({
      id:       +d["序号"],
      name:     d["姓名"].trim(),
      gender:   d["性别"].trim(),
      birthday: new Date(d["生日"]),
      age:      +d["年龄"],
      class:    d["班级"].trim(),
    });
    try {
      const data = await d3.csv("./data/newstudent.csv", transformRow);
      log(`✓ 共 ${data.length} 条`);
      log("【类型验证】");
      log(`typeof data[0].age  →  ${typeof data[0].age}`);
      log(`data[0].birthday instanceof Date  →  ${data[0].birthday instanceof Date}`);
      log(`data[0].age + 1  →  ${data[0].age + 1}（Number 可计算）`);
      log("");
      log("【前 3 条】");
      log(JSON.stringify(data.slice(0, 3).map((d) => ({
        ...d, birthday: d.birthday.toISOString().slice(0, 10),
      })), null, 2));
      const tbl = document.getElementById("d-3-1-table");
      tbl.innerHTML = `<table class="table">
        <thead><tr><th>id</th><th>name</th><th>gender</th><th>birthday</th><th>age</th><th>class</th></tr></thead>
        <tbody>${data.slice(0, 10).map((d) => `<tr>
          <td>${d.id}</td><td>${d.name}</td><td>${d.gender}</td>
          <td>${d.birthday.toISOString().slice(0, 10)}</td>
          <td>${d.age}</td><td>${d.class}</td></tr>`).join("")}</tbody>
      </table>`;
    } catch (err) {
      log("⚠️ 加载失败：请通过 http.server 启动（python -m http.server），直接双击文件会被浏览器 CORS 拦截。");
      log(err.message);
    }
  };
  document.getElementById("d-3-1-reload").addEventListener("click", run);
  await run();
};

// ---------- 1.2 DIKW 金字塔 ----------
DEMOS["d-3-2"] = (mount) => {
  const LAYERS = [
    { name: "Wisdom", cn: "智慧", color: "#9333ea", desc: "运用知识做出明智判断与战略决策。回答「为什么」与「应该怎么做」。", viz: "战略仪表盘、决策树" },
    { name: "Knowledge", cn: "知识", color: "#0891b2", desc: "对信息的进一步提炼和理解，形成模式、规律、关联。回答「如何」。", viz: "统计模型、机器学习预测" },
    { name: "Information", cn: "信息", color: "#059669", desc: "经过处理、组织、赋予上下文的数据。回答「谁、什么、何时、何地」。", viz: "折线图、柱状图、热力图" },
    { name: "Data", cn: "数据", color: "#64748b", desc: "原始、离散的观察结果，缺乏上下文与意义。", viz: "原始表格、CSV 文件" },
  ];
  const W = 640, H = 380, cx = W / 2;
  mount.innerHTML = `
    <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap: 16px; align-items:start;">
      <div id="d-3-2-svg"></div>
      <div id="d-3-2-detail" class="demo-detail">← 点击金字塔任意层</div>
    </div>`;
  const svg = makeSvg(d3.select("#d-3-2-svg").node(), W, H);
  LAYERS.forEach((layer, i) => {
    const topW = [60, 90, 120, 150][i];
    const botW = topW + 60;
    const yTop = 20 + i * 82;
    const yBot = yTop + [62, 80, 100, 120][i];
    const path = `M ${cx - topW / 2} ${yTop} L ${cx + topW / 2} ${yTop} L ${cx + botW / 2} ${yBot} L ${cx - botW / 2} ${yBot} Z`;
    const g = svg.append("g").style("cursor", "pointer")
      .on("mouseover", function () {
        d3.select(this).select("path").transition().duration(150)
          .attr("fill", d3.color(layer.color).brighter(0.4));
      })
      .on("mouseout", function () {
        d3.select(this).select("path").transition().duration(150).attr("fill", layer.color);
      })
      .on("click", () => {
        document.getElementById("d-3-2-detail").innerHTML = `
          <h4 style="color:${layer.color}">${layer.cn}（${layer.name}）</h4>
          <p>${layer.desc}</p>
          <p><strong>典型可视化：</strong>${layer.viz}</p>`;
      });
    g.append("path").attr("d", path).attr("fill", layer.color).attr("stroke", "white").attr("stroke-width", 2);
    g.append("text").attr("x", cx).attr("y", (yTop + yBot) / 2)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", "white").attr("font-size", 15).attr("font-weight", 600)
      .text(`${layer.cn} · ${layer.name}`);
  });
  // 标注「可视化主要承担 Data → Information」
  svg.append("text").attr("x", cx).attr("y", H - 6).attr("text-anchor", "middle")
    .attr("font-size", 11).attr("fill", "#059669").attr("font-weight", 600)
    .text("⬆ 可视化主要承担 Data → Information 的“翻译”");
};

// ---------- 1.3 属性 × 视觉通道 ----------
DEMOS["d-3-3"] = (mount) => {
  const DATA = [
    { name: "张三", major: "软件工程", classNo: 1, age: 18 },
    { name: "李四", major: "软件工程", classNo: 1, age: 19 },
    { name: "王五", major: "软件工程", classNo: 2, age: 20 },
    { name: "赵六", major: "软件工程", classNo: 2, age: 17 },
    { name: "孙七", major: "数据科学", classNo: 1, age: 21 },
    { name: "周八", major: "数据科学", classNo: 1, age: 22 },
    { name: "吴九", major: "数据科学", classNo: 2, age: 19 },
  ];
  mount.innerHTML = `
    <div class="demo-sub"><h4>3.3.1 类别 → 色相（✓ 正确）</h4><div id="d-3-3-cat"></div></div>
    <div class="demo-sub"><h4>3.3.2 序数 → 亮度（✓ 正确）</h4><div id="d-3-3-ord"></div></div>
    <div class="demo-sub"><h4>3.3.3 数值 → 位置（✓ 正确）</h4><div id="d-3-3-num"></div></div>
    <div class="demo-sub"><h4>3.3.4 ❌ 数值 → 色相（错配，看不出大小）</h4><div id="d-3-3-bad"></div></div>
  `;
  // 类别 → 色相
  {
    const svg = makeSvg(document.getElementById("d-3-3-cat"), 600, 150);
    const majors = [...new Set(DATA.map((d) => d.major))];
    const color = d3.scaleOrdinal().domain(majors).range(d3.schemeTableau10);
    const x = d3.scaleBand().domain(DATA.map((d) => d.name)).range([40, 580]).padding(0.3);
    svg.append("g").attr("transform", "translate(0,80)").call(d3.axisBottom(x).tickSize(0));
    svg.selectAll("rect").data(DATA).join("rect")
      .attr("x", (d) => x(d.name)).attr("y", 20).attr("width", x.bandwidth()).attr("height", 60)
      .attr("fill", (d) => color(d.major)).attr("rx", 3);
    svg.append("text").attr("x", 600).attr("y", 150).attr("text-anchor", "end")
      .attr("font-size", 11).attr("fill", "#475569").text("色相区分「专业」类别");
  }
  // 序数 → 亮度
  {
    const svg = makeSvg(document.getElementById("d-3-3-ord"), 600, 90);
    const levels = [1, 2, 3, 4, 5];
    const x = d3.scaleBand().domain(levels).range([40, 580]).padding(0.2);
    const brightness = d3.scaleLinear().domain([1, 5]).range(["#f1f5f9", "#0f172a"]);
    svg.selectAll("rect").data(levels).join("rect")
      .attr("x", (d) => x(d)).attr("y", 10).attr("width", x.bandwidth()).attr("height", 40)
      .attr("fill", (d) => brightness(d)).attr("rx", 3);
    svg.selectAll("text").data(levels).join("text")
      .attr("x", (d) => x(d) + x.bandwidth() / 2).attr("y", 68)
      .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "#475569")
      .text((d) => `等级 ${d}`);
  }
  // 数值 → 位置
  {
    const svg = makeSvg(document.getElementById("d-3-3-num"), 600, 170);
    const x = d3.scaleLinear().domain(d3.extent(DATA, (d) => d.age)).range([70, 580]);
    const y = d3.scaleBand().domain(DATA.map((d) => d.name)).range([10, 140]).padding(0.3);
    svg.append("g").attr("transform", "translate(0,140)").call(d3.axisBottom(x).ticks(5));
    svg.selectAll("circle").data(DATA).join("circle")
      .attr("cx", (d) => x(d.age)).attr("cy", (d) => y(d.name) + y.bandwidth() / 2).attr("r", 7)
      .attr("fill", "#2563eb");
    svg.selectAll("text").data(DATA).join("text")
      .attr("x", 60).attr("y", (d) => y(d.name) + y.bandwidth() / 2 + 4)
      .attr("text-anchor", "end").attr("font-size", 11).attr("fill", "#475569").text((d) => d.name);
  }
  // 错配
  {
    const svg = makeSvg(document.getElementById("d-3-3-bad"), 600, 150);
    const x = d3.scaleBand().domain(DATA.map((d) => d.name)).range([40, 580]).padding(0.3);
    const hue = d3.scaleSequential(d3.interpolateRainbow).domain(d3.extent(DATA, (d) => d.age));
    svg.selectAll("rect").data(DATA).join("rect")
      .attr("x", (d) => x(d.name)).attr("y", 10).attr("width", x.bandwidth()).attr("height", 60)
      .attr("fill", (d) => hue(d.age)).attr("rx", 3);
    svg.selectAll("text").data(DATA).join("text")
      .attr("x", (d) => x(d.name) + x.bandwidth() / 2).attr("y", 90)
      .attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "#475569")
      .text((d) => `${d.name}（${d.age}）`);
    svg.append("text").attr("x", 600).attr("y", 150).attr("text-anchor", "end")
      .attr("font-size", 11).attr("fill", "#b91c1c").text("彩虹色编码数值：无法判断大小顺序");
  }
};

// ---------- 1.3 概念图：Stevens 尺度 × Mackinlay 通道 ----------
DEMOS["concept-stevens"] = (mount) => {
  const W = 720, H = 360;
  const scales = [
    { name: "名义 Nominal", y: 70, op: "等价 / 不等价", color: "#f59e0b" },
    { name: "序数 Ordinal", y: 150, op: "> <", color: "#84cc16" },
    { name: "区间 Interval", y: 230, op: "+ 加减", color: "#06b6d4" },
    { name: "比率 Ratio", y: 310, op: "+ 加减乘除", color: "#2563eb" },
  ];
  const groups = [
    { name: "定性通道", sub: "色相 · 形状", y: 70, color: "#f59e0b" },
    { name: "顺序通道", sub: "亮度 · 密度 · 饱和度", y: 170, color: "#84cc16" },
    { name: "定量通道", sub: "位置 · 长度 · 角度", y: 290, color: "#2563eb" },
  ];
  // 匹配关系：scale index → group index（强匹配）
  const links = [
    [0, 0], [1, 1], [1, 0], [2, 2], [2, 1], [3, 2],
  ];
  const svg = makeSvg(mount, W, H);
  const xL = 40, wL = 210, xR = 430, wR = 250;
  // 连线
  svg.selectAll("path").data(links).join("path")
    .attr("d", (d) => {
      const sy = scales[d[0]].y, ty = groups[d[1]].y;
      return `M ${xL + wL} ${sy} C ${xL + wL + 90} ${sy}, ${xR - 90} ${ty}, ${xR} ${ty}`;
    })
    .attr("fill", "none")
    .attr("stroke", (d) => (d[0] === d[1] ? groups[d[1]].color : "#cbd5e1"))
    .attr("stroke-width", (d) => (d[0] === d[1] ? 3 : 1.5))
    .attr("stroke-dasharray", (d) => (d[0] === d[1] ? "none" : "4 3"))
    .attr("opacity", (d) => (d[0] === d[1] ? 0.9 : 0.6));
  // 左侧尺度节点
  const scaleG = svg.selectAll(".scale").data(scales).join("g").attr("class", "scale")
    .attr("transform", (d) => `translate(${xL},${d.y - 20})`)
    .style("cursor", "pointer");
  scaleG.append("rect").attr("width", wL).attr("height", 40).attr("rx", 8)
    .attr("fill", (d) => d.color).attr("opacity", 0.15).attr("stroke", (d) => d.color);
  scaleG.append("text").attr("x", 12).attr("y", 16).attr("font-size", 13).attr("font-weight", 600)
    .attr("fill", "#1f2937").text((d) => d.name);
  scaleG.append("text").attr("x", 12).attr("y", 31).attr("font-size", 11)
    .attr("fill", "#64748b").text((d) => d.op);
  // 右侧通道组
  const grpG = svg.selectAll(".grp").data(groups).join("g").attr("class", "grp")
    .attr("transform", (d) => `translate(${xR},${d.y - 24})`);
  grpG.append("rect").attr("width", wR).attr("height", 48).attr("rx", 8)
    .attr("fill", (d) => d.color).attr("opacity", 0.12).attr("stroke", (d) => d.color);
  grpG.append("text").attr("x", 12).attr("y", 20).attr("font-size", 13).attr("font-weight", 700)
    .attr("fill", (d) => d.color).text((d) => d.name);
  grpG.append("text").attr("x", 12).attr("y", 36).attr("font-size", 11)
    .attr("fill", "#475569").text((d) => d.sub);
  // 图例
  svg.append("text").attr("x", 40).attr("y", 16).attr("font-size", 11).attr("fill", "#64748b")
    .text("实线 = 强匹配 · 虚线 = 次优可用");
};

// ---------- 1.4 D3 8 个数组函数 ----------
DEMOS["d-3-4"] = (mount) => {
  mount.innerHTML = `
    <div class="controls">
      <label>函数：
        <select id="d-3-4-sel">
          <option value="map">map</option>
          <option value="reduce">reduce</option>
          <option value="cross">cross</option>
          <option value="merge">merge</option>
          <option value="pairs">pairs</option>
          <option value="transpose">transpose</option>
          <option value="zip">zip</option>
          <option value="filter">filter</option>
          <option value="group">group ★</option>
          <option value="rollup">rollup ★</option>
        </select>
      </label>
    </div>
    <div id="d-3-4-out"></div>
  `;
  const SPECS = {
    map: { in: [1, 2, 3, 4], fn: () => d3.map([1, 2, 3, 4], (x) => x * x), hint: "把每个元素平方" },
    reduce: { in: [1, 2, 3, 4], fn: () => d3.reduce([1, 2, 3, 4], (a, b) => a + b, 0), hint: "求和" },
    cross: { in: ["A", "B", "C"], fn: () => d3.cross(["A", "B"], [1, 2]), hint: "笛卡尔积" },
    merge: { in: [[1, 2], [3, 4]], fn: () => d3.merge([[1, 2], [3, 4], [5]]), hint: "扁平合并" },
    pairs: { in: [1, 2, 3, 4], fn: () => d3.pairs([1, 2, 3, 4]), hint: "相邻元素对" },
    transpose: { in: [[1, 2, 3], [4, 5, 6]], fn: () => d3.transpose([[1, 2, 3], [4, 5, 6]]), hint: "矩阵转置" },
    zip: { in: [["A", "B", "C"], [1, 2, 3]], fn: () => d3.zip(["A", "B", "C"], [1, 2, 3]), hint: "按位合并" },
    filter: { in: [1, 2, 3, 4, 5], fn: () => d3.filter([1, 2, 3, 4, 5], (x) => x > 2), hint: "保留 > 2 的" },
    group: {
      in: [{ c: "1班", n: 1 }, { c: "1班", n: 2 }, { c: "2班", n: 3 }, { c: "2班", n: 4 }],
      fn: () => d3.group([{ c: "1班", n: 1 }, { c: "1班", n: 2 }, { c: "2班", n: 3 }, { c: "2班", n: 4 }], (d) => d.c),
      hint: "按班级分组（保留所有元素）",
    },
    rollup: {
      in: [{ c: "1班", n: 1 }, { c: "1班", n: 2 }, { c: "2班", n: 3 }, { c: "2班", n: 4 }],
      fn: () => d3.rollup([{ c: "1班", n: 1 }, { c: "1班", n: 2 }, { c: "2班", n: 3 }, { c: "2班", n: 4 }], (v) => v.length, (d) => d.c),
      hint: "按班级聚合（每班人数）",
    },
  };
  const render = (name) => {
    const s = SPECS[name];
    const out = s.fn();
    document.getElementById("d-3-4-out").innerHTML = `
      <p><strong>${name}</strong> —— ${s.hint}</p>
      <div class="console">输入：${JSON.stringify(s.in)}
输出：${JSON.stringify([...out], null, 2)}</div>`;
  };
  document.getElementById("d-3-4-sel").addEventListener("change", (e) => render(e.target.value));
  render("map");
};

// ---------- 1.5 Selection 三态（带 key 演示） ----------
DEMOS["d-3-5"] = (mount) => {
  mount.innerHTML = `
    <div class="controls">
      <button id="d-3-5-add" class="demo-btn">+ 添加</button>
      <button id="d-3-5-update" class="demo-btn">⇆ 更新</button>
      <button id="d-3-5-remove" class="demo-btn">− 删除</button>
      <button id="d-3-5-shuffle" class="demo-btn secondary">🔀 打乱顺序</button>
      <label><input type="checkbox" id="d-3-5-key" checked> 使用 key 函数</label>
      <button id="d-3-5-reset" class="demo-btn secondary">重置</button>
    </div>
    <p>当前数据：<code id="d-3-5-state">[A, B, C]</code></p>
    <div id="d-3-5-svg"></div>
    <p class="demo-legend">
      <span style="color:#10b981">●</span> enter（绿）
      <span style="color:#0ea5e9">●</span> update（蓝）
      <span style="color:#ef4444">●</span> exit（红）
      <span style="margin-left:12px">试试取消勾选「使用 key 函数」再「打乱顺序」</span>
    </p>
  `;
  const svg = makeSvg(document.getElementById("d-3-5-svg"), 720, 160);
  let data = ["A", "B", "C"].map((id, i) => ({ id, v: i + 1 }));
  let nextId = 4;
  const useKey = () => document.getElementById("d-3-5-key").checked;
  const x = (d) => d.v * 90 + 50;
  const render = () => {
    const key = useKey() ? (d) => d.id : null;
    svg.selectAll("g.item").data(data, key).join(
      (enter) => enter.append("g").attr("class", "item")
        .attr("transform", (d) => `translate(${x(d)},80)`)
        .call((g) => g.append("circle").attr("r", 0).attr("fill", "#10b981")
          .transition().duration(400).attr("r", 26))
        .call((g) => g.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "middle")
          .attr("fill", "#fff").attr("font-weight", 700).attr("font-size", 15).text((d) => d.id)),
      (update) => update.call((g) => g.select("circle").attr("fill", "#0ea5e9"))
        .transition().duration(500).attr("transform", (d) => `translate(${x(d)},80)`),
      (exit) => exit.call((g) => {
        g.select("circle").attr("fill", "#ef4444").transition().duration(400).attr("r", 0);
        g.transition().delay(420).remove();
      })
    );
    document.getElementById("d-3-5-state").textContent = "[" + data.map((d) => d.id).join(", ") + "]";
  };
  document.getElementById("d-3-5-add").onclick = () => {
    data = [...data, { id: String.fromCharCode(64 + nextId), v: nextId }]; nextId++; render();
  };
  document.getElementById("d-3-5-update").onclick = () => { data = data.map((d) => ({ ...d, v: d.v + 0.5 })); render(); };
  document.getElementById("d-3-5-remove").onclick = () => { data = data.slice(0, -1); render(); };
  document.getElementById("d-3-5-shuffle").onclick = () => { data = [...data].sort(() => Math.random() - 0.5); render(); };
  document.getElementById("d-3-5-key").onchange = () => {
    document.getElementById("d-3-5-state").textContent = "[" + data.map((d) => d.id).join(", ") + "]";
    render();
  };
  document.getElementById("d-3-5-reset").onclick = () => { data = ["A", "B", "C"].map((id, i) => ({ id, v: i + 1 })); nextId = 4; render(); };
  render();
};

// ---------- 1.5 概念图：Data-Join 三态流程 ----------
DEMOS["concept-join"] = (mount) => {
  const W = 720, H = 240;
  const svg = makeSvg(mount, W, H);
  const states = [
    { name: "enter", cn: "新增", color: "#10b981", x: 470, desc: "新数据 > 旧数据，append 新元素" },
    { name: "update", cn: "更新", color: "#0ea5e9", x: 300, desc: "数据相等，改属性" },
    { name: "exit", cn: "移除", color: "#ef4444", x: 620, desc: "新数据 < 旧数据，remove 多余元素" },
  ];
  // 数据源
  svg.append("rect").attr("x", 30).attr("y", 80).attr("width", 120).attr("height", 64).attr("rx", 10)
    .attr("fill", "#eef2ff").attr("stroke", "#6366f1");
  svg.append("text").attr("x", 90).attr("y", 106).attr("text-anchor", "middle").attr("font-weight", 700).attr("font-size", 14).attr("fill", "#4338ca").text("数据数组");
  svg.append("text").attr("x", 90).attr("y", 126).attr("text-anchor", "middle").attr("font-size", 11).attr("fill", "#64748b").text("data");
  // join 节点
  svg.append("rect").attr("x", 185).attr("y", 80).attr("width", 110).attr("height", 64).attr("rx", 10)
    .attr("fill", "#0f172a");
  svg.append("text").attr("x", 240).attr("y", 106).attr("text-anchor", "middle").attr("font-weight", 700).attr("font-size", 14).attr("fill", "#e2e8f0").text(".data()");
  svg.append("text").attr("x", 240).attr("y", 126).attr("text-anchor", "middle").attr("font-size", 12).attr("fill", "#94a3b8").text(".join(...)");
  // 箭头
  const arrow = (x1, y1, x2, y2) => svg.append("path")
    .attr("d", `M ${x1} ${y1} L ${x2} ${y2}`).attr("stroke", "#94a3b8").attr("stroke-width", 2)
    .attr("marker-end", "url(#arr)");
  svg.append("defs").append("marker").attr("id", "arr").attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5)
    .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto-start-reverse")
    .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", "#94a3b8");
  arrow(150, 112, 185, 112);
  arrow(295, 112, 300, 112);
  // 三个状态
  states.forEach((s) => {
    const g = svg.append("g").style("cursor", "pointer");
    g.append("rect").attr("x", s.x - 70).attr("y", 20).attr("width", 140).attr("height", 64).attr("rx", 10)
      .attr("fill", s.color).attr("opacity", 0.14).attr("stroke", s.color);
    g.append("circle").attr("cx", s.x).attr("cy", 52).attr("r", 12).attr("fill", s.color);
    g.append("text").attr("x", s.x).attr("y", 92).attr("text-anchor", "middle").attr("font-weight", 700).attr("font-size", 13).attr("fill", "#1f2937").text(`${s.cn} ${s.name}`);
    g.append("text").attr("x", s.x).attr("y", 108).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "#64748b").text(s.desc);
    g.on("click", () => {
      const info = document.getElementById("concept-join-info");
      if (info) info.innerHTML = `<strong style="color:${s.color}">${s.cn}（${s.name}）</strong>：${s.desc}`;
    });
  });
  // 连接线
  [[300, 52, 400, 52], [470, 52, 520, 52]].forEach(([x1, y1, x2, y2]) =>
    svg.append("path").attr("d", `M ${x1} ${y1} L ${x2} ${y2}`).attr("stroke", "#cbd5e1").attr("stroke-width", 1.5).attr("marker-end", "url(#arr)"));
  mount.insertAdjacentHTML("beforeend", `<p class="demo-legend" id="concept-join-info">点击上方任一状态查看说明</p>`);
};
