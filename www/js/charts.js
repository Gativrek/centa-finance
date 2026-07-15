// charts.js — Charts page (Chart.js) + month navigation
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Charts ───────────────────────────────────────────────
let barChart = null;

// Expense palette matches the dashboard donut so slice colors are consistent Home ↔ Charts.
const EXPENSE_COLORS = ['#6366f1','#ef4444','#f59e0b','#06b6d4','#22c55e','#a855f7','#f97316','#ec4899','#14b8a6','#94a3b8'];
const SAVE_COLORS    = ['#06b6d4','#0ea5e9','#38bdf8','#67e8f9','#22d3ee','#7dd3fc'];

function renderCharts() {
  const txs = txForMonth(state.currentMonth);
  document.getElementById('charts-month-label').textContent = monthLabel(state.currentMonth);
  renderExpensePie(txs);
  renderChartsInsights(txs);
  renderSavingsPie(txs);
  renderBar();
}

// Two-column category donut: SVG ring with emoji segments (left) + legend with % (right).
function renderCategoryDonut(containerId, byCat, colors, emptyIcon, emptyMsg) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  const ids   = Object.keys(byCat);
  const total = ids.reduce((s, id) => s + byCat[id], 0);

  if (!total) {
    wrap.innerHTML = `<div class="donut-empty"><div style="font-size:36px">${emptyIcon}</div>${emptyMsg}</div>`;
    return;
  }

  const mask = v => balanceHidden ? '••••••' : v;
  const segs = ids.map(id => ({ amt: byCat[id], emoji: catInfo(id).emoji, label: catInfo(id).label }));
  segs.sort((a, b) => b.amt - a.amt);
  segs.forEach((s, i) => { s.frac = s.amt / total; s.color = colors[i % colors.length]; });

  const ring = donutRing(segs.map(s => ({ frac: s.frac, color: s.color, emoji: s.emoji })), { labels: true });
  const legend = segs.map(s => `<div class="donut-legend-item">
      <span class="dl-dot" style="background:${s.color}"></span>
      <span class="dl-label">${s.label}</span>
      <span class="dl-amt">${mask(fmt(s.amt))}</span>
    </div>`).join('')
    + `<div class="donut-legend-item dl-total">
      <span class="dl-dot" style="background:transparent"></span>
      <span class="dl-label">${tr('total')}</span>
      <span class="dl-amt">${mask(fmt(total))}</span>
    </div>`;

  wrap.innerHTML = `<div class="donut-chart-svg">${ring}</div><div class="donut-legend">${legend}</div>`;
}

function renderExpensePie(txs) {
  const byCat = {};
  txs.filter(t => t.type === 'expense').forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  renderCategoryDonut('expense-chart', byCat, EXPENSE_COLORS, '📊', tr('no_expense_data'));
}

function renderSavingsPie(txs) {
  const byCat = {};
  txs.filter(t => t.type === 'savings').forEach(t => { byCat[t.category] = (byCat[t.category] || 0) + t.amount; });
  renderCategoryDonut('savings-chart', byCat, SAVE_COLORS, '🏦', tr('no_savings_month'));
}

function renderBar() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  const sum    = (m, type) => txForMonth(m).filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
  const incomes  = months.map(m => sum(m, 'income'));
  const expenses = months.map(m => sum(m, 'expense'));
  const savings  = months.map(m => sum(m, 'savings'));
  const labels   = months.map(m => { const [y, mo] = m.split('-'); return new Date(+y, +mo-1,1).toLocaleDateString(dateLocale(),{month:'short'}); });

  const ctx = document.getElementById('bar-chart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income',  data: incomes,  backgroundColor: 'rgba(34,197,94,.7)',  borderRadius: 4 },
        { label: 'Expense', data: expenses, backgroundColor: 'rgba(239,68,68,.7)', borderRadius: 4 },
        { label: 'Savings', data: savings,  backgroundColor: 'rgba(6,182,212,.7)', borderRadius: 4 },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,.05)' } },
        y: { ticks: { color: '#94a3b8', callback: v => currencyConf().symbol + v }, grid: { color: 'rgba(255,255,255,.05)' } },
      },
    },
  });
}

