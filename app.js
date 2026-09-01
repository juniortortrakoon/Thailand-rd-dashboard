/* ---------- Config ---------- */

const INDICATOR_LABELS = {
  "Total expenditure on R&D ($) (WCY)": "ค่าใช้จ่าย R&D รวม (มูลค่า)",
  "Total expenditure on R&D (%) (WCY)": "ค่าใช้จ่าย R&D รวม (% ของ GDP)",
  "Total expenditure on R&D per capita ($) (WCY)": "ค่าใช้จ่าย R&D ต่อหัวประชากร",
  "Business expenditure on R&D ($) (WCY)": "ค่าใช้จ่าย R&D ภาคธุรกิจ (มูลค่า)",
  "Business expenditure on R&D (%) (WCY)": "ค่าใช้จ่าย R&D ภาคธุรกิจ (% ของ GDP)",
  "Total R&D personnel (WCY)": "บุคลากรด้าน R&D รวม",
  "Total R&D personnel per capita (WCY)": "บุคลากรด้าน R&D ต่อประชากร 1,000 คน",
  "Total R&D personnel in business enterprise (WCY)": "บุคลากร R&D ในภาคธุรกิจ",
  "Total R&D personnel in business per capita (WCY)": "บุคลากร R&D ภาคธุรกิจต่อประชากร 1,000 คน",
  "Researchers in R&D per capita (WCY)": "นักวิจัยต่อประชากร 1,000 คน"
};
const INDICATOR_ORDER = Object.keys(INDICATOR_LABELS);
const GROUP_LABELS = { BRICS: "BRICS", Tier: "Tier สูงกว่า", ASEAN: "อาเซียน" };
const GROUP_ACCENT = { BRICS: "var(--rose)", Tier: "var(--sky)", ASEAN: "var(--indigo)" };
const GROUP_ACCENT_DIM = { BRICS: "var(--rose-dim)", Tier: "var(--sky-dim)", ASEAN: "var(--indigo-dim)" };

const COUNTRY_COLORS = {
  Thailand: "#E8A33D",
  Brazil: "#0EA5A0",
  China: "#E1547A",
  India: "#8A97A5",
  "South Africa": "#6C63C7",
  UAE: "#2F8FD1",
  Singapore: "#0EA5A0",
  "Hong Kong SAR": "#E1547A",
  Japan: "#8A97A5",
  "Korea Rep.": "#6C63C7",
  "Taiwan (Chinese Taipei)": "#2F8FD1",
  Malaysia: "#0EA5A0",
  Philippines: "#E1547A",
  Indonesia: "#6C63C7"
};

const state = { group: "BRICS", mode: "value", indicator: INDICATOR_ORDER[1] };

/* ---------- Helpers ---------- */

function fmtNumber(v, decimals) {
  if (v === null || v === undefined || Number.isNaN(v)) return "–";
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function unitDecimals(unit) {
  if (!unit) return 2;
  const u = unit.toLowerCase();
  if (u.includes("percentage")) return 2;
  if (u.includes("per capita") || u.includes("per 1000")) return 2;
  if (u.includes("thousands")) return 1;
  if (u.includes("millions")) return 1;
  return 2;
}
function getCountriesForGroup(group) { return Object.keys(RD_DATA[group][state.mode]); }
function getIndicatorRecord(group, mode, country, indicator) {
  const c = RD_DATA[group][mode][country];
  return c ? (c[indicator] || null) : null;
}
function allYearsFor(group, mode, indicator) {
  const years = new Set();
  getCountriesForGroup(group).forEach(country => {
    const rec = getIndicatorRecord(group, mode, country, indicator);
    if (rec) Object.keys(rec.data).forEach(y => years.add(y));
  });
  return Array.from(years).sort((a, b) => Number(a) - Number(b));
}
function latestYearWithData(group, mode, indicator, country) {
  const rec = getIndicatorRecord(group, mode, country, indicator);
  if (!rec) return null;
  const years = Object.keys(rec.data).sort((a, b) => Number(a) - Number(b));
  return years.length ? years[years.length - 1] : null;
}
function latestValue(group, mode, country, indicator) {
  const rec = getIndicatorRecord(group, mode, country, indicator);
  if (!rec) return null;
  const y = latestYearWithData(group, mode, indicator, country);
  return y ? { year: y, value: rec.data[y] } : null;
}

/* ---------- KPI row ---------- */

function renderKPIs() {
  const pctInd = "Total expenditure on R&D (%) (WCY)";
  const perCapitaInd = "Total expenditure on R&D per capita ($) (WCY)";
  const personnelInd = "Total R&D personnel (WCY)";
  const researchersInd = "Researchers in R&D per capita (WCY)";

  const pct = latestValue("BRICS", "value", "Thailand", pctInd);
  const rank = latestValue("BRICS", "rank", "Thailand", pctInd);
  const perCapita = latestValue("BRICS", "value", "Thailand", perCapitaInd);
  const personnel = latestValue("BRICS", "value", "Thailand", personnelInd);
  const researchers = latestValue("BRICS", "value", "Thailand", researchersInd);

  const cards = [
    { icon: "📊", label: `งบวิจัย R&D รวม (${pct ? pct.year : "-"})`, value: pct ? fmtNumber(pct.value, 2) : "–", unit: "% ของ GDP", accent: "var(--amber)" },
    { icon: "💵", label: `งบวิจัยต่อหัวประชากร (${perCapita ? perCapita.year : "-"})`, value: perCapita ? fmtNumber(perCapita.value, 2) : "–", unit: "USD/คน", accent: "var(--teal)" },
    { icon: "👥", label: `บุคลากร R&D รวม (${personnel ? personnel.year : "-"})`, value: personnel ? fmtNumber(personnel.value, 1) : "–", unit: "พัน FTE", accent: "var(--sky)" },
    { icon: "🔬", label: `นักวิจัยต่อประชากร (${researchers ? researchers.year : "-"})`, value: researchers ? fmtNumber(researchers.value, 2) : "–", unit: "ต่อพันคน", accent: "var(--indigo)" },
    { icon: "🌐", label: `อันดับโลก IMD WCY (${rank ? rank.year : "-"})`, value: rank ? Math.round(rank.value) : "–", unit: "จาก ~69 เขตศก.", accent: "var(--rose)" }
  ];

  const wrap = document.getElementById("kpiRow");
  wrap.innerHTML = cards.map(c => `
    <div class="kpi-card" style="--accent:${c.accent}">
      <span class="kpi-icon">${c.icon}</span>
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.value}<small>${c.unit}</small></div>
    </div>
  `).join("");
}

/* ---------- Insight callout ---------- */

function renderInsightCallout() {
  const pctInd = "Total expenditure on R&D (%) (WCY)";
  const first = { year: "1995", value: RD_DATA.BRICS.value.Thailand[pctInd].data["1995"] };
  const latest = latestValue("BRICS", "value", "Thailand", pctInd);
  const personnel = latestValue("BRICS", "value", "Thailand", "Total R&D personnel (WCY)");
  const rank = latestValue("BRICS", "rank", "Thailand", pctInd);

  const el = document.getElementById("insightCallout");
  el.innerHTML = `ปี <b>${latest.year}</b> ไทยลงทุน R&D คิดเป็น <span class="hl-amber">${fmtNumber(latest.value, 2)}% ของ GDP</span>
    เพิ่มขึ้นจาก <span class="hl-teal">${fmtNumber(first.value, 2)}%</span> ในปี 1995 แต่ยังอยู่ที่อันดับ
    <span class="hl-rose">${Math.round(rank.value)}</span> ในการจัดอันดับโลกของ IMD WCY
    ขณะที่บุคลากรวิจัยของไทยเพิ่มขึ้นเป็น <span class="hl-indigo">${fmtNumber(personnel.value * 1000, 0)} คน (FTE)</span> ในปี ${personnel.year}`;
}

/* ---------- Group insight cards ---------- */

function renderGroupCards() {
  const pctInd = "Total expenditure on R&D (%) (WCY)";
  const wrap = document.getElementById("groupCards");
  wrap.innerHTML = "";

  ["BRICS", "Tier", "ASEAN"].forEach(group => {
    const countries = Object.keys(RD_DATA[group].value).filter(c => c !== "Thailand");
    const thVal = latestValue(group, "value", "Thailand", pctInd);
    let sum = 0, n = 0;
    countries.forEach(c => {
      const v = latestValue(group, "value", c, pctInd);
      if (v) { sum += v.value; n++; }
    });
    const avg = n ? sum / n : null;
    const diff = (avg !== null && thVal) ? thVal.value - avg : null;
    const isUp = diff !== null && diff >= 0;

    const card = document.createElement("div");
    card.className = "group-card";
    card.style.setProperty("--accent", GROUP_ACCENT[group]);
    card.style.setProperty("--accent-dim", GROUP_ACCENT_DIM[group]);
    card.innerHTML = `
      <div class="group-card-title"><span class="group-dot"></span>${GROUP_LABELS[group]}</div>
      <div class="group-card-sub">ไทย vs ค่าเฉลี่ยกลุ่ม (${countries.length} ประเทศ) · ค่าใช้จ่าย R&D % ของ GDP</div>
      <div class="group-card-value">${thVal ? fmtNumber(thVal.value, 2) : "–"}<small>% (ไทย, ${thVal ? thVal.year : "-"})</small></div>
      <div>${diff !== null ? `<span class="group-card-badge ${isUp ? "badge-up" : "badge-down"}">${isUp ? "▲" : "▼"} ${fmtNumber(Math.abs(diff), 2)} จุด ${isUp ? "สูงกว่า" : "ต่ำกว่า"}ค่าเฉลี่ยกลุ่ม (${fmtNumber(avg, 2)}%)</span>` : ""}</div>
      <div class="group-card-cta">ดูกราฟเปรียบเทียบ →</div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll("#groupTabs .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.group === group));
      state.group = group;
      renderAll();
      document.getElementById("explore").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    wrap.appendChild(card);
  });
}

/* ---------- Notes ---------- */

function renderNotes() {
  const notes = [
    {
      accent: "var(--amber)",
      title: "การลงทุนเติบโตต่อเนื่องแต่ไม่สม่ำเสมอ",
      body: "งบ R&D ต่อ GDP ของไทยเพิ่มจาก 0.12% (2538) เป็นระดับ 1% ในช่วงปี 2560 เป็นต้นมา แต่มีความผันผวนปีต่อปี ไม่ใช่แนวโน้มเส้นตรง"
    },
    {
      accent: "var(--sky)",
      title: "ช่องว่างกับกลุ่ม Tier สูงกว่ายังมาก",
      body: "เมื่อเทียบกับเกาหลีใต้ ไต้หวัน และญี่ปุ่นซึ่งลงทุน R&D สูงกว่า 3–5% ของ GDP ไทยยังตามหลังอยู่หลายเท่าตัว"
    },
    {
      accent: "var(--indigo)",
      title: "ไทยยังนำหน้าในกลุ่มอาเซียน",
      body: "ยกเว้นสิงคโปร์ ไทยมีสัดส่วนการลงทุน R&D สูงกว่ามาเลเซีย ฟิลิปปินส์ และอินโดนีเซียในช่วงข้อมูลล่าสุด"
    }
  ];
  document.getElementById("noteGrid").innerHTML = notes.map(n => `
    <div class="note-card" style="--accent:${n.accent}">
      <h4>${n.title}</h4>
      <p>${n.body}</p>
    </div>
  `).join("");
}

/* ---------- Indicator select ---------- */

function populateIndicatorSelect() {
  const select = document.getElementById("indicatorSelect");
  select.innerHTML = "";
  INDICATOR_ORDER.forEach(ind => {
    const opt = document.createElement("option");
    opt.value = ind;
    opt.textContent = INDICATOR_LABELS[ind];
    if (ind === state.indicator) opt.selected = true;
    select.appendChild(opt);
  });
}

/* ---------- Trend chart ---------- */

function renderTrendChart() {
  const { group, mode, indicator } = state;
  const years = allYearsFor(group, mode, indicator);
  const countries = getCountriesForGroup(group);
  const unit = (RD_DATA[group][mode]["Thailand"][indicator] || {}).unit || "";

  document.getElementById("chartTitle").textContent = `${INDICATOR_LABELS[indicator]} — ${GROUP_LABELS[group]}`;
  document.getElementById("chartUnit").textContent = mode === "rank" ? "อันดับ (ยิ่งน้อยยิ่งดี)" : unit.trim();

  const datasets = countries.map(country => {
    const rec = getIndicatorRecord(group, mode, country, indicator);
    const values = years.map(y => (rec && rec.data[y] !== undefined ? rec.data[y] : null));
    return { label: country, values, color: COUNTRY_COLORS[country] || "#999", highlight: country === "Thailand" };
  });

  drawLineChart(document.getElementById("trendChart"), {
    years, datasets, reverseY: mode === "rank",
    formatValue: v => fmtNumber(v, mode === "rank" ? 0 : 2)
  });
  renderLegend(countries);
}
function renderLegend(countries) {
  const wrap = document.getElementById("chartLegend");
  wrap.innerHTML = countries.map(c => `<div class="legend-item"><span class="legend-swatch" style="background:${COUNTRY_COLORS[c] || "#999"}"></span>${c}</div>`).join("");
}

/* ---------- Bar chart ---------- */

function renderBarChartSection() {
  const { group, mode, indicator } = state;
  const countries = getCountriesForGroup(group);

  let latestYear = latestYearWithData(group, mode, indicator, "Thailand");
  if (!latestYear) {
    countries.forEach(c => {
      const y = latestYearWithData(group, mode, indicator, c);
      if (y && (latestYear === null || Number(y) > Number(latestYear))) latestYear = y;
    });
  }
  const values = countries.map(c => {
    const rec = getIndicatorRecord(group, mode, c, indicator);
    return rec && rec.data[latestYear] !== undefined ? rec.data[latestYear] : null;
  });

  document.getElementById("barUnit").textContent = latestYear ? `ปี ${latestYear}` : "ไม่มีข้อมูล";
  drawBarChart(document.getElementById("barChart"), {
    labels: countries, values,
    colors: countries.map(c => COUNTRY_COLORS[c] || "#999"),
    reverseX: mode === "rank",
    formatValue: v => fmtNumber(v, mode === "rank" ? 0 : 2)
  });
}

/* ---------- Table ---------- */

function renderTable() {
  const { group, mode, indicator } = state;
  const years = allYearsFor(group, mode, indicator);
  const countries = getCountriesForGroup(group);
  const table = document.getElementById("dataTable");
  let thead = "<thead><tr><th>ประเทศ</th>" + years.map(y => `<th>${y}</th>`).join("") + "</tr></thead>";
  let tbody = "<tbody>";
  countries.forEach(country => {
    const rec = getIndicatorRecord(group, mode, country, indicator);
    const dec = mode === "rank" ? 0 : unitDecimals(rec ? rec.unit : "");
    const rowClass = country === "Thailand" ? ' class="row-thailand"' : "";
    tbody += `<tr${rowClass}><td>${country}</td>` + years.map(y => `<td>${rec && rec.data[y] !== undefined ? fmtNumber(rec.data[y], dec) : "–"}</td>`).join("") + "</tr>";
  });
  tbody += "</tbody>";
  table.innerHTML = thead + tbody;
}

/* ---------- Render all ---------- */

function renderAll() {
  renderTrendChart();
  renderBarChartSection();
  renderTable();
}

/* ---------- Events ---------- */

function wireControls() {
  document.getElementById("groupTabs").addEventListener("click", e => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    document.querySelectorAll("#groupTabs .seg-btn").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    state.group = btn.dataset.group;
    renderAll();
  });
  document.getElementById("modeTabs").addEventListener("click", e => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    document.querySelectorAll("#modeTabs .seg-btn").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
    renderAll();
  });
  document.getElementById("indicatorSelect").addEventListener("change", e => {
    state.indicator = e.target.value;
    renderAll();
  });
  document.getElementById("toggleTable").addEventListener("click", () => {
    const wrap = document.getElementById("tableWrap");
    const btn = document.getElementById("toggleTable");
    const isHidden = wrap.hasAttribute("hidden");
    if (isHidden) { wrap.removeAttribute("hidden"); btn.textContent = "ซ่อนตาราง"; }
    else { wrap.setAttribute("hidden", ""); btn.textContent = "แสดงตาราง"; }
  });
  document.getElementById("burgerBtn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // active nav highlight on scroll
  const sections = Array.from(document.querySelectorAll(".section[id]"));
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navItems.forEach(n => n.classList.toggle("active", n.getAttribute("href") === "#" + entry.target.id));
      }
    });
  }, { rootMargin: "-40% 0px -50% 0px" });
  sections.forEach(s => obs.observe(s));

  navItems.forEach(n => n.addEventListener("click", () => document.getElementById("sidebar").classList.remove("open")));
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  populateIndicatorSelect();
  wireControls();
  renderKPIs();
  renderInsightCallout();
  renderGroupCards();
  renderNotes();
  renderAll();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderAll, 150);
  });
});
