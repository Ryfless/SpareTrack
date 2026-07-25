const API = window.location.origin;

let featureChart = null;
let predChart = null;
let allPredictions = [];

// ---------- enriched table state ----------
let enrichedData = [];
let enrichedFiltered = [];
let enrichedPage = 1;
const PAGE_SIZE = 15;

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function showToast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

function escapeHtml(text) {
  if (text == null) return "--";
  const d = document.createElement("div");
  d.textContent = String(text);
  return d.innerHTML;
}

// ================================
// TAB SWITCHING
// ================================
function switchTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(el => el.classList.remove("active"));
  document.getElementById("tab-" + tabId).classList.add("active");
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add("active");
}
document.querySelectorAll(".tab").forEach(el => {
  el.addEventListener("click", () => switchTab(el.dataset.tab));
});

// ================================
// DASHBOARD TAB
// ================================
async function loadMetrics() {
  try {
    const data = await fetchJSON("/api/metrics");
    if (data.metrics) {
      document.getElementById("m-mae").textContent = data.metrics.mae;
      document.getElementById("m-rmse").textContent = data.metrics.rmse;
      document.getElementById("m-r2").textContent = data.metrics.r2;
      document.getElementById("m-mape").textContent = data.metrics.mape;
      document.getElementById("m-samples").textContent = (data.n_train || 0) + (data.n_test || 0);
      document.getElementById("lastTrained").textContent =
        data.training_date ? "Last trained: " + new Date(data.training_date).toLocaleString() : "Last trained: --";
    }
  } catch {}
}

async function loadFeatureImportance() {
  try {
    const data = await fetchJSON("/api/feature-importance");
    if (!data.length) return;
    const labels = data.map(d => d.feature);
    const values = data.map(d => +(d.importance * 100).toFixed(2));
    const colors = ["#2563eb","#3b82f6","#60a5fa","#7dd3fc","#6366f1","#8b5cf6","#a78bfa","#c4b5fd","#f59e0b","#f97316"];

    if (featureChart) featureChart.destroy();
    const fCtx = document.getElementById("featureChart").getContext("2d");
    featureChart = new Chart(fCtx, {
      type: "bar",
      data: {
        labels: labels.reverse(),
        datasets: [{
          data: values.reverse(),
          backgroundColor: colors.slice(0, labels.length).reverse(),
          borderRadius: 4,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => ctx.parsed.x.toFixed(2) + "%" } },
        },
        scales: {
          x: { beginAtZero: true, grid: { color: "#f1f5f9" }, title: { display: true, text: "Importance (%)", font: { size: 10 } } },
          y: { grid: { display: false } },
        },
      },
    });
  } catch {}
}

async function loadPredictions() {
  try {
    const data = await fetchJSON("/api/predictions?limit=500");
    allPredictions = data;
    renderPredChart();
    populateSparepartSelect();
  } catch {}
}

function populateSparepartSelect() {
  const sel = document.getElementById("sparepartSelect");
  const names = [...new Set(allPredictions.map(d => d.sparepart_name).filter(Boolean))].sort();
  sel.innerHTML = '<option value="">All spareparts</option>' +
    names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
}

function updatePredChart() { renderPredChart(); }

function renderPredChart() {
  const sel = document.getElementById("sparepartSelect");
  const filterName = sel.value;
  let filtered = allPredictions;
  if (filterName) {
    filtered = allPredictions.filter(p => p.sparepart_name === filterName);
  }

  const grouped = {};
  filtered.forEach(p => {
    const key = p.month ? p.month.slice(0, 7) : "unknown";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p.predicted_quantity);
  });

  const labels = Object.keys(grouped).sort();
  const predicted = labels.map(k => {
    const vals = grouped[k];
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  });

  if (predChart) predChart.destroy();
  const ctx = document.getElementById("predChart").getContext("2d");
  predChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Avg Predicted",
        data: predicted,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#2563eb",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: true, position: "top" } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      },
    },
  });
}

// ================================
// PREDICTION TABLE TAB
// ================================
const MONTH_NAMES = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatMonth(ym) {
  const [y, m] = ym.split("-");
  return MONTH_NAMES[parseInt(m) - 1] + " " + y;
}

async function loadEnrichedTable() {
  try {
    const data = await fetchJSON("/api/output");
    enrichedData = data;

    const names = [...new Set(data.map(d => d.sparepart_name).filter(Boolean))].sort();
    const branches = [...new Set(data.map(d => d.branch_name).filter(Boolean))].sort();
    const months = [...new Set(data.map(d => d.month).filter(Boolean))].sort();

    const selSp = document.getElementById("ftSparepart");
    const selBr = document.getElementById("ftBranch");
    const selMo = document.getElementById("ftMonthFilter");

    selSp.innerHTML = '<option value="">All Sparepart</option>' + names.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");
    selBr.innerHTML = '<option value="">All Branch</option>' + branches.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");

    const prevVal = selMo.value;
    selMo.innerHTML = '<option value="">Semua Bulan</option>' + months.map(m => `<option value="${escapeHtml(m)}">${formatMonth(m)}</option>`).join("");
    selMo.value = prevVal || "";

    selSp.onchange = applyTableFilters;
    selBr.onchange = applyTableFilters;
    selMo.onchange = applyTableFilters;

    applyTableFilters();
  } catch {}
}

function applyTableFilters() {
  const fSp = document.getElementById("ftSparepart").value;
  const fBr = document.getElementById("ftBranch").value;
  const fMo = document.getElementById("ftMonthFilter").value;

  enrichedFiltered = enrichedData.filter(d => {
    if (fSp && d.sparepart_name !== fSp) return false;
    if (fBr && d.branch_name !== fBr) return false;
    if (fMo && d.month !== fMo) return false;
    return true;
  }).sort((a, b) => {
    const cmp = (a.sparepart_name || "").localeCompare(b.sparepart_name || "");
    if (cmp !== 0) return cmp;
    return (a.branch_name || "").localeCompare(b.branch_name || "");
  });

  document.getElementById("ftInfo").textContent = enrichedFiltered.length + " items";
  enrichedPage = 1;
  renderTablePage();
}

function statusHtml(status) {
  const s = (status || "aman").toLowerCase().replace(/\s+/g, "");
  const label = status || "Aman";
  const cls = s === "kritis" ? "kritis" : s === "perlurestock" ? "restock" : s === "overstock" ? "overstock" : "aman";
  return `<span class="status-badge ${cls}">${escapeHtml(label)}</span>`;
}

function renderTablePage() {
  const tbody = document.getElementById("ftBody");
  const total = enrichedFiltered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (enrichedPage > totalPages) enrichedPage = totalPages;

  const start = (enrichedPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const page = enrichedFiltered.slice(start, end);

  tbody.innerHTML = page.map(d => {
    const [y, m] = (d.month || "").split("-");
    const monthStr = y && m ? `${m}/${y.slice(2)}` : "--";
    return `<tr>
      <td><strong>${escapeHtml(d.sparepart_name)}</strong></td>
      <td>${escapeHtml(d.branch_name)}</td>
      <td>${monthStr}</td>
      <td class="cell-num">${d.current_stock}</td>
      <td class="cell-num cell-pred">${d.predicted_quantity.toFixed(1)}</td>
      <td class="cell-num cell-lo">${d.confidence_lower.toFixed(1)}</td>
      <td class="cell-num cell-hi">${d.confidence_upper.toFixed(1)}</td>
      <td class="cell-num">${d.safety_stock.toFixed(1)}</td>
      <td class="cell-num">${d.reorder_point.toFixed(1)}</td>
      <td class="cell-num">${d.eoq.toFixed(1)}</td>
      <td class="cell-num cell-max">${d.max_stock.toFixed(1)}</td>
      <td>${statusHtml(d.status)}</td>
    </tr>`;
  }).join("");

  document.getElementById("ftPage").textContent = enrichedPage + " / " + totalPages;
  document.getElementById("ftPrev").disabled = enrichedPage <= 1;
  document.getElementById("ftNext").disabled = enrichedPage >= totalPages;
}

function pageTable(dir) {
  enrichedPage += dir;
  renderTablePage();
}

// ================================
// TUNING PARAMETERS
// ================================
let tuningDefaults = {};

async function loadTuningParams() {
  try {
    const params = await fetchJSON("/api/train-params");
    tuningDefaults = {};
    const grid = document.getElementById("tuningGrid");
    grid.innerHTML = "";
    Object.entries(params).forEach(([key, cfg]) => {
      tuningDefaults[key] = cfg.default;
      const stored = localStorage.getItem("tune_" + key);
      const val = stored !== null ? parseFloat(stored) : cfg.default;
      const div = document.createElement("div");
      div.className = "tuning-item";
      if (cfg.step >= 1) {
        div.innerHTML =
          '<label>' + key + ' <span class="ti-val">' + val + '</span></label>' +
          '<input type="range" min="' + cfg.min + '" max="' + cfg.max + '" step="' + cfg.step + '" value="' + val + '" data-key="' + key + '" oninput="updateTuningValue(this)">' +
          '<div class="ti-desc">' + escapeHtml(cfg.desc) + '</div>';
      } else {
        div.innerHTML =
          '<label>' + key + ' <span class="ti-val">' + val.toFixed(2) + '</span></label>' +
          '<input type="range" min="' + cfg.min + '" max="' + cfg.max + '" step="' + cfg.step + '" value="' + val + '" data-key="' + key + '" oninput="updateTuningValue(this)">' +
          '<div class="ti-desc">' + escapeHtml(cfg.desc) + '</div>';
      }
      grid.appendChild(div);
    });
  } catch {}
}

function updateTuningValue(el) {
  const key = el.dataset.key;
  const val = parseFloat(el.value);
  const label = el.closest(".tuning-item").querySelector(".ti-val");
  label.textContent = Number.isInteger(val) ? val : val.toFixed(2);
  localStorage.setItem("tune_" + key, val);
}

function toggleTuning() {
  const panel = document.getElementById("tuningPanel");
  panel.classList.toggle("open");
}

function resetTuning() {
  Object.entries(tuningDefaults).forEach(([key, val]) => {
    localStorage.removeItem("tune_" + key);
    const input = document.querySelector('#tuningGrid input[data-key="' + key + '"]');
    if (input) {
      input.value = val;
      const label = input.closest(".tuning-item").querySelector(".ti-val");
      label.textContent = Number.isInteger(val) ? val : val.toFixed(2);
    }
  });
}

function gatherTuningParams() {
  const params = {};
  document.querySelectorAll('#tuningGrid input').forEach(el => {
    params[el.dataset.key] = parseFloat(el.value);
  });
  return params;
}

// ================================
// TRAINING LOG TAB
// ================================
let trainRunId = null;
let trainPollTimer = null;
let lastLogCount = 0;

async function triggerTrainAsync() {
  const btn = document.getElementById("btnTrain");
  const badge = document.getElementById("trainStatusBadge");
  const output = document.getElementById("trainLogOutput");

  btn.disabled = true;
  output.textContent = "";
  badge.textContent = "Starting...";
  badge.className = "train-badge running";

  try {
    const params = gatherTuningParams();
    const r = await fetch("/api/train?async=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params }),
    });
    const dt = await r.json();
    if (!dt.success) {
      showToast("Error: " + (dt.error || "Unknown"));
      badge.textContent = "Error";
      badge.className = "train-badge error";
      btn.disabled = false;
      return;
    }
    trainRunId = dt.run_id;
    lastLogCount = 0;
    showToast("Training started!");
    startTrainPolling();
  } catch (e) {
    showToast("Error: " + e.message);
    badge.textContent = "Error";
    badge.className = "train-badge error";
    btn.disabled = false;
  }
}

function startTrainPolling() {
  if (trainPollTimer) clearInterval(trainPollTimer);
  trainPollTimer = setInterval(pollTrain, 800);
}

function stopTrainPolling() {
  if (trainPollTimer) {
    clearInterval(trainPollTimer);
    trainPollTimer = null;
  }
}

async function pollTrain() {
  if (!trainRunId) return;

  const badge = document.getElementById("trainStatusBadge");
  const output = document.getElementById("trainLogOutput");
  const btn = document.getElementById("btnTrain");

  try {
    // fetch log
    const logR = await fetch(`/api/train-log?run_id=${trainRunId}&since=${lastLogCount}`);
    const logDt = await logR.json();

    if (logDt.log && logDt.log.length > 0) {
      lastLogCount = logDt.total;
      const newLines = logDt.log.map(line => {
        if (line.includes("ERROR")) return `<span class="log-error">${escapeHtml(line)}</span>`;
        if (line.startsWith("[") && line.includes("] ")) return `<span class="log-info">${escapeHtml(line)}</span>`;
        return escapeHtml(line);
      }).join("\n");
      output.innerHTML += (output.textContent === "No training logs yet. Click \"Train Now\" to start." ? "" : "\n") + newLines;
      output.scrollTop = output.scrollHeight;
    }

    // fetch status
    const sR = await fetch(`/api/train-status?run_id=${trainRunId}`);
    const sDt = await sR.json();

    if (sDt.status === "completed") {
      badge.textContent = "Completed";
      badge.className = "train-badge completed";
      btn.disabled = false;
      stopTrainPolling();
      showToast("Training complete!");
      refreshAll();
    } else if (sDt.status === "error") {
      badge.textContent = "Error";
      badge.className = "train-badge error";
      btn.disabled = false;
      stopTrainPolling();
      showToast("Training error!");
    } else if (sDt.status === "running") {
      badge.textContent = "Running...";
      badge.className = "train-badge running";
    }
  } catch {}
}

// ================================
// TRAINING STATISTICS
// ================================
async function loadTrainingStats() {
  try {
    const [modelData, impData] = await Promise.all([
      fetchJSON("/api/model-stats"),
      fetchJSON("/api/feature-importance").catch(() => []),
    ]);
    const container = document.getElementById("trainStats");
    if (!modelData.best_iteration && modelData.best_iteration !== 0) {
      container.innerHTML = '<div class="train-stats-empty">Model belum ditrain.</div>';
      document.getElementById("trainImportance").style.display = "none";
      return;
    }

    const cards = [
      { cls: "rmse", value: modelData.best_score, label: "Best RMSE",
        desc: "Rata-rata error prediksi ±" + modelData.best_score + " unit. Semakin kecil semakin akurat." },
      { cls: "rounds", value: modelData.best_iteration, label: "Boosting Rounds",
        desc: "Jumlah iterasi boosting. Early stopping berhenti di sini saat error validasi tidak membaik." },
      { cls: "trees", value: modelData.num_trees, label: "Total Trees",
        desc: "Setiap iterasi menambah beberapa pohon. Total " + modelData.num_trees + " pohon keputusan." },
      { cls: "features", value: modelData.num_features, label: "Features",
        desc: "Variabel input: lag historis, rolling mean, musim, harga, cabang, sparepart." },
    ];

    container.innerHTML = cards.map(c =>
      '<div class="train-stat-card ' + c.cls + '">' +
        '<div class="ts-value">' + escapeHtml(c.value) + '</div>' +
        '<div class="ts-label">' + escapeHtml(c.label) + '</div>' +
        '<div class="ts-desc">' + escapeHtml(c.desc) + '</div>' +
      '</div>'
    ).join("");

    const impContainer = document.getElementById("trainImportance");
    const barsContainer = document.getElementById("trainImportanceBars");
    if (impData.length) {
      const maxImp = Math.max(...impData.map(d => d.importance));
      barsContainer.innerHTML = impData.map(d => {
        const pct = (d.importance * 100).toFixed(2);
        const width = (d.importance / maxImp) * 100;
        const hue = Math.round(220 - d.importance / maxImp * 80);
        return '<div class="importance-row">' +
          '<span class="ir-name">' + escapeHtml(d.feature) + '</span>' +
          '<div class="ir-bar-track"><div class="ir-bar-fill" style="width:' + width.toFixed(0) + '%;background:hsl(' + hue + ',70%,55%)"></div></div>' +
          '<span class="ir-pct">' + pct + '%</span>' +
        '</div>';
      }).join("");
      impContainer.style.display = "block";
    } else {
      impContainer.style.display = "none";
    }
  } catch {
    document.getElementById("trainStats").innerHTML = '<div class="train-stats-empty">Model belum ditrain.</div>';
    document.getElementById("trainImportance").style.display = "none";
  }
}

// ================================
// TRIGGER PREDICT
// ================================
async function triggerPredict() {
  const btn = document.getElementById("btnPredict");
  btn.disabled = true;
  btn.textContent = "Predicting...";
  showToast("Generating predictions...");
  try {
    const r = await fetch("/api/predict", { method: "POST" });
    const dt = await r.json();
    if (dt.success) {
      showToast(`Predictions saved! (${dt.total_predictions} items)`);
      await refreshAll();
    } else {
      showToast("Error: " + (dt.error || "Unknown"));
    }
  } catch (e) {
    showToast("Error: " + e.message);
  }
  btn.disabled = false;
  btn.textContent = "Predict";
}

// ================================
// REFRESH ALL
// ================================
async function refreshAll() {
  await Promise.all([loadMetrics(), loadFeatureImportance(), loadPredictions(), loadEnrichedTable(), loadTrainingStats()]);
}

document.addEventListener("DOMContentLoaded", () => {
  refreshAll();
  loadTuningParams();
  setInterval(loadPredictions, 30000);
});
