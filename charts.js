/* Minimal, dependency-free SVG chart renderer.
   Provides renderLineChart() and renderBarChart() used by app.js. */

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  if (attrs) {
    for (const k in attrs) el.setAttribute(k, attrs[k]);
  }
  return el;
}

function niceTicks(min, max, count) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const rough = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / mag;
  let step;
  if (norm < 1.5) step = 1 * mag;
  else if (norm < 3) step = 2 * mag;
  else if (norm < 7) step = 5 * mag;
  else step = 10 * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

function fmtTick(v) {
  if (Math.abs(v) >= 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (Number.isInteger(v)) return String(v);
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/* ---------- Line chart ---------- */
// opts: { years: [...], datasets: [{label, color, values, highlight}], reverseY, formatValue }
function drawLineChart(container, opts) {
  const { years, datasets, reverseY = false, formatValue } = opts;
  container.innerHTML = "";

  const rect = container.getBoundingClientRect();
  const width = Math.max(280, Math.round(rect.width) || 900);
  const height = container.clientHeight || 380;
  const isNarrow = width < 520;
  const padL = isNarrow ? 40 : 56, padR = 12, padT = 16, padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // gather all numeric values across datasets
  let allVals = [];
  datasets.forEach(ds => ds.values.forEach(v => { if (v !== null && v !== undefined) allVals.push(v); }));
  if (allVals.length === 0) {
    container.innerHTML = '<div class="empty-note">ไม่มีข้อมูลสำหรับตัวเลือกนี้</div>';
    return;
  }
  let min = Math.min(...allVals), max = Math.max(...allVals);
  const ticks = niceTicks(min, max, 5);
  min = ticks[0]; max = ticks[ticks.length - 1];

  const n = years.length;
  const xFor = i => padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yFor = v => {
    const t = (v - min) / (max - min);
    const yy = reverseY ? t : 1 - t;
    return padT + yy * plotH;
  };

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "100%",
    role: "img"
  });

  // gridlines + y labels
  ticks.forEach(t => {
    const y = yFor(t);
    svg.appendChild(svgEl("line", { x1: padL, x2: width - padR, y1: y, y2: y, stroke: "#c7cdb9", "stroke-width": 1 }));
    const label = svgEl("text", { x: padL - 8, y: y + 4, "text-anchor": "end", "font-size": isNarrow ? 9 : 11, "font-family": "IBM Plex Mono, monospace", fill: "#6b7d86" });
    label.textContent = fmtTick(t);
    svg.appendChild(label);
  });

  // x labels (sparse) — spacing chosen so labels don't collide regardless of width
  const minLabelGap = isNarrow ? 46 : 60;
  const maxLabels = Math.max(3, Math.floor(plotW / minLabelGap));
  const step = Math.max(1, Math.ceil(n / maxLabels));
  const shown = [];
  years.forEach((yr, i) => { if (i % step === 0) shown.push(i); });
  if (shown[shown.length - 1] !== n - 1) {
    // avoid crowding: only append the final year if it won't collide with the last shown label
    if (n - 1 - shown[shown.length - 1] >= step * 0.6) shown.push(n - 1);
    else shown[shown.length - 1] = n - 1;
  }
  shown.forEach(i => {
    const x = xFor(i);
    const label = svgEl("text", { x, y: height - padB + 18, "text-anchor": "middle", "font-size": isNarrow ? 8.5 : 10, "font-family": "IBM Plex Mono, monospace", fill: "#6b7d86" });
    label.textContent = years[i];
    svg.appendChild(label);
  });

  // lines
  datasets.forEach(ds => {
    const pts = [];
    ds.values.forEach((v, i) => {
      if (v === null || v === undefined) return;
      pts.push([xFor(i), yFor(v)]);
    });
    if (pts.length === 0) return;
    const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ");
    const path = svgEl("path", {
      d, fill: "none",
      stroke: ds.color,
      "stroke-width": ds.highlight ? 3.2 : 1.6,
      "stroke-linejoin": "round",
      "stroke-linecap": "round",
      opacity: ds.highlight ? 1 : 0.85
    });
    svg.appendChild(path);

    if (ds.highlight) {
      pts.forEach(p => {
        svg.appendChild(svgEl("circle", { cx: p[0], cy: p[1], r: 2.5, fill: ds.color }));
      });
    }
  });

  // hover interaction
  const hoverLine = svgEl("line", { x1: 0, x2: 0, y1: padT, y2: height - padB, stroke: "#0f2436", "stroke-width": 1, opacity: 0 });
  svg.appendChild(hoverLine);

  const wrap = document.createElement("div");
  wrap.className = "svg-chart-wrap";
  wrap.appendChild(svg);

  const tooltip = document.createElement("div");
  tooltip.className = "svg-tooltip";
  tooltip.style.display = "none";
  wrap.appendChild(tooltip);

  svg.addEventListener("mousemove", e => {
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let idx = Math.round(((relX - padL) / plotW) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    const x = xFor(idx);
    hoverLine.setAttribute("x1", x);
    hoverLine.setAttribute("x2", x);
    hoverLine.setAttribute("opacity", 1);

    const rows = datasets.map(ds => {
      const v = ds.values[idx];
      return `<div class="tt-row"><span class="tt-swatch" style="background:${ds.color}"></span>${ds.label}: <b>${v === null || v === undefined ? "–" : (formatValue ? formatValue(v) : v)}</b></div>`;
    }).join("");
    tooltip.innerHTML = `<div class="tt-year">${years[idx]}</div>${rows}`;
    tooltip.style.display = "block";

    const leftPct = (x / width) * 100;
    tooltip.style.left = leftPct > 60 ? "auto" : `calc(${leftPct}% + 10px)`;
    tooltip.style.right = leftPct > 60 ? `calc(${100 - leftPct}% + 10px)` : "auto";
    tooltip.style.top = "8px";
  });
  svg.addEventListener("mouseleave", () => {
    hoverLine.setAttribute("opacity", 0);
    tooltip.style.display = "none";
  });

  container.appendChild(wrap);
}

/* ---------- Bar chart (horizontal) ---------- */
// opts: { labels: [...], values: [...], colors: [...], reverseX, formatValue }
function drawBarChart(container, opts) {
  const { labels, values, colors, reverseX = false, formatValue } = opts;
  container.innerHTML = "";

  const rowH = 40;
  const rect = container.getBoundingClientRect();
  const width = Math.max(280, Math.round(rect.width) || 900);
  const height = Math.max(container.clientHeight || 300, labels.length * rowH + 20);
  const longest = Math.max(...labels.map(l => l.length), 4);
  const isNarrow = width < 520;
  const padL = Math.min(isNarrow ? 130 : 220, Math.max(isNarrow ? 70 : 90, longest * (isNarrow ? 6 : 7.5))), padR = 56, padT = 10, padB = 10;
  const plotW = width - padL - padR;

  const nums = values.filter(v => v !== null && v !== undefined);
  if (nums.length === 0) {
    container.innerHTML = '<div class="empty-note">ไม่มีข้อมูลสำหรับตัวเลือกนี้</div>';
    return;
  }
  let min = Math.min(0, ...nums), max = Math.max(...nums);
  if (reverseX) { const t = min; min = 0; max = Math.max(max, 1); }
  if (min === max) max = min + 1;

  const xFor = v => padL + ((v - min) / (max - min)) * plotW;
  const zeroX = xFor(0);

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "100%"
  });

  svg.appendChild(svgEl("line", { x1: zeroX, x2: zeroX, y1: padT, y2: height - padB, stroke: "#c7cdb9", "stroke-width": 1 }));

  labels.forEach((label, i) => {
    const y = padT + i * rowH;
    const v = values[i];

    const labelEl = svgEl("text", { x: padL - 10, y: y + rowH / 2 + 4, "text-anchor": "end", "font-size": isNarrow ? 11 : 13, "font-family": "IBM Plex Sans Thai, sans-serif", fill: "#16324a" });
    labelEl.textContent = label;
    svg.appendChild(labelEl);

    if (v === null || v === undefined) return;

    const barH = 20;
    const x0 = Math.min(zeroX, xFor(v));
    const x1 = Math.max(zeroX, xFor(v));
    const rect = svgEl("rect", {
      x: x0, y: y + (rowH - barH) / 2, width: Math.max(1, x1 - x0), height: barH,
      rx: 3, fill: colors[i] || "#999"
    });
    svg.appendChild(rect);

    const valLabel = svgEl("text", {
      x: x1 + 8, y: y + rowH / 2 + 4,
      "font-size": isNarrow ? 11 : 12, "font-family": "IBM Plex Mono, monospace", fill: "#16324a"
    });
    valLabel.textContent = formatValue ? formatValue(v) : v;
    svg.appendChild(valLabel);
  });

  const wrap = document.createElement("div");
  wrap.className = "svg-chart-wrap";
  wrap.style.minHeight = height + "px";
  wrap.appendChild(svg);
  container.appendChild(wrap);
}
