// dashboard.js — Dashboard page: balance, sparkline, budget summary, spending & goal donuts
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Dashboard ────────────────────────────────────────────
function renderDashboard() {
  const txs = txForMonth(state.currentMonth);
  const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savings = txs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);
  const balance = cumulativeBalance(state.currentMonth); // running total up to end of this month

  const mask = v => balanceHidden ? '••••••' : v;
  const balEl = document.getElementById('dash-balance');
  if (balanceHidden) { balEl.textContent = '••••••'; balEl._val = balance; }
  else animateValue(balEl, balance, v => fmt(v));
  document.getElementById('dash-income').textContent   = mask(fmt(income));
  document.getElementById('dash-expense').textContent  = mask(fmt(expense));
  document.getElementById('dash-savings').textContent  = mask(fmt(savings));
  document.getElementById('dash-month-label').textContent = monthLabel(state.currentMonth);
  renderBalanceSparkline();

  // Spending + goal donuts (replaces goal carousel + insights list)
  renderDashDonuts(txs);

  // Subscriptions widget
  renderRecurringDashboard();

  // Carry-over row (balance from previous month)
  const prev = prevMonth(state.currentMonth);
  const carryAmt = cumulativeBalance(prev);
  const carryHtml = carryAmt !== 0 ? buildCarryHtml(carryAmt, prev) : '';

  // Recent transactions (last 8)
  const recent = [...txs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const list = document.getElementById('dash-recent');
  if (recent.length === 0 && !carryHtml) {
    list.innerHTML = `<div class="empty"><div class="icon">💸</div><p>${tr('no_tx_month')}</p></div>`;
  } else {
    list.innerHTML = carryHtml + recent.map(txHtml).join('');
  }

  // Budget mini-summary
  renderBudgetSummary(txs);
}

function renderBudgetSummary(txs) {
  const wrap = document.getElementById('dash-budgets');
  const entries = Object.entries(state.budgets);
  if (entries.length === 0) { wrap.innerHTML = `<div style="color:var(--muted);font-size:13px;text-align:center;padding:8px">${tr('no_budgets_set')}</div>`; return; }
  const spent = {};
  txs.filter(t => t.type === 'expense').forEach(t => { spent[t.category] = (spent[t.category] || 0) + t.amount; });
  wrap.innerHTML = entries.map(([cat]) => {
    const { limit } = effectiveBudget(cat);
    const s = spent[cat] || 0;
    const pct = limit > 0 ? Math.min((s / limit) * 100, 100) : 100;
    const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
    const c = catInfo(cat);
    return `<div class="budget-item">
      <div class="budget-row">
        <div class="b-name">${c.emoji} ${c.label}</div>
        <div class="b-amounts">${fmt(s)} / ${fmt(limit)}</div>
      </div>
      <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

// Spending breakdown for the Charts page (moved off the dashboard).
// With income, shows each expense category as a % of income with warn/over flags;
// with no income for the month, falls back to plain amounts.
function renderChartsInsights(txs) {
  const wrap = document.getElementById('charts-insights');
  if (!wrap) return;

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const spent = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    spent[t.category] = (spent[t.category] || 0) + t.amount;
  });

  const items = Object.entries(spent)
    .map(([cat, amt]) => ({ cat, amt, pct: income > 0 ? (amt / income) * 100 : 0 }))
    .sort((a, b) => b.amt - a.amt);

  if (!items.length) { wrap.innerHTML = ''; return; }

  const hasIncome = income > 0;
  wrap.innerHTML = `
    <div class="section-title">${hasIncome ? tr('spending_insights_pct') : tr('spending_insights')}</div>
    <div class="card card-sm">
      ${items.map(x => {
        const c = catInfo(x.cat);
        const warn = x.pct >= 50;
        const over = x.pct >= 100;
        const color = over ? 'var(--red)' : warn ? 'var(--yellow)' : 'var(--muted)';
        const flag  = over ? '🔴 ' : warn ? '⚠️ ' : '';
        const right = hasIncome ? `${flag}${Math.round(x.pct)}${tr('pct_of_income')}` : fmt(x.amt);
        return `<div class="insight-row">
          <span class="insight-cat">${c.emoji} ${c.label}</span>
          <span class="insight-pct" style="color:${color}">${right}</span>
        </div>`;
      }).join('')}
    </div>`;
}

// ── Dashboard donuts (spending + goal) ───────────────────
const DONUT_COLORS = ['#6366f1','#ef4444','#f59e0b','#06b6d4','#22c55e','#a855f7','#f97316','#ec4899','#14b8a6','#94a3b8'];
let dashGoalId = localStorage.getItem(KEYS.dashGoalId) || null;

// segments: [{ frac, color, emoji? }] — frac is 0..1; arcs drawn clockwise from 12 o'clock.
// opts.labels: place each segment's emoji on the ring band (skips slivers too small to fit).
function donutRing(segments, opts = {}) {
  const r = 42, C = 2 * Math.PI * r;
  const cap = opts.rounded ? ' stroke-linecap="round"' : '';
  let off = 0;
  const arcs = [], labels = [];
  segments.forEach(s => {
    const len = Math.max(s.frac, 0) * C;
    arcs.push(`<circle cx="50" cy="50" r="${r}" fill="none" stroke="${s.color}" stroke-width="14" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 50 50)"${cap}/>`);
    if (opts.labels && s.emoji && s.frac >= 0.08) {
      const ang = (off + len / 2) / C * 2 * Math.PI - Math.PI / 2; // mid-angle, 0 = 12 o'clock
      const lx = 50 + r * Math.cos(ang);
      const ly = 50 + r * Math.sin(ang);
      labels.push(`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="11" text-anchor="middle" dominant-baseline="central">${s.emoji}</text>`);
    }
    off += len;
  });
  return `<svg viewBox="0 0 100 100" width="96" height="96"><circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(148,163,184,.18)" stroke-width="14"/>${arcs.join('')}${labels.join('')}</svg>`;
}

function renderDashDonuts(txs) {
  const wrap = document.getElementById('dash-donuts');
  if (!wrap) return;
  const mask = v => balanceHidden ? '••••••' : v;

  // ── Spending tile: expenses by category → tap into Charts ──
  const spent = {};
  txs.filter(t => t.type === 'expense').forEach(t => { spent[t.category] = (spent[t.category] || 0) + t.amount; });
  const total = Object.values(spent).reduce((a, b) => a + b, 0);
  const segs = Object.entries(spent).sort((a, b) => b[1] - a[1])
    .map(([cat, amt], i) => ({ frac: total ? amt / total : 0, color: DONUT_COLORS[i % DONUT_COLORS.length], emoji: catInfo(cat).emoji }));
  const spendCenter = total > 0
    ? ''
    : `<div class="donut-center"><div class="dc-sub" style="font-size:11px">${tr('no_expenses')}</div></div>`;
  const spendTile = `<div class="donut-tile" onclick="showPage('charts')">
    <div class="dt-label">${tr('spending')}</div>
    <div class="donut-svg-wrap">${donutRing(segs, { labels: true })}${spendCenter}</div>
    <div class="dt-cap">${tr('tap_breakdown')}</div>
  </div>`;

  // ── Goal tile: selected goal, cycles on tap, selection persisted ──
  const active = state.goals.filter(g => !g.archived);
  let goalTile;
  if (!active.length) {
    goalTile = `<div class="donut-tile" onclick="showPage('budgets')">
      <div class="dt-label">${tr('goals_label')}</div>
      <div class="donut-svg-wrap">${donutRing([])}<div class="donut-center"><div class="dc-sub" style="font-size:11px">${tr('no_goal_yet')}</div></div></div>
      <div class="dt-cap">${tr('tap_to_add')}</div>
    </div>`;
  } else {
    const goal = active.find(g => g.id === dashGoalId) || active[0];
    dashGoalId = goal.id;
    localStorage.setItem(KEYS.dashGoalId, dashGoalId);
    const prog = goalProgress(goal.id);
    const pct  = goal.target > 0 ? Math.min(prog / goal.target * 100, 100) : 0;
    const rem  = Math.max(goal.target - prog, 0);
    const done = prog >= goal.target;
    const color = done ? 'var(--green)' : 'var(--savings)';
    const center = `<div class="dc-main">${Math.round(pct)}%</div><div class="dc-sub">${done ? tr('done_emoji') : mask(fmt(rem))}</div>`;
    const footer = active.length > 1
      ? `<div class="donut-dots">${active.map(g => `<span class="dd${g.id === goal.id ? ' on' : ''}"></span>`).join('')}</div>`
      : `<div class="dt-cap">${tr('goal_progress')}</div>`;
    goalTile = `<div class="donut-tile" onclick="cycleDashGoal()">
      <div class="dt-label">${goal.emoji || '🎯'} ${goal.name}</div>
      <div class="donut-svg-wrap">${donutRing([{ frac: pct / 100, color }], { rounded: true })}<div class="donut-center">${center}</div></div>
      ${footer}
    </div>`;
  }
  wrap.innerHTML = spendTile + goalTile;
}

function cycleDashGoal() {
  const active = state.goals.filter(g => !g.archived);
  if (active.length <= 1) return; // single goal: nothing to cycle
  const idx = Math.max(0, active.findIndex(g => g.id === dashGoalId));
  dashGoalId = active[(idx + 1) % active.length].id;
  localStorage.setItem(KEYS.dashGoalId, dashGoalId);
  renderDashDonuts(txForMonth(state.currentMonth));
}

function txHtml(t, allowDelete = false) {
  const c = catInfo(t.category);
  const bg   = t.type === 'income'  ? 'rgba(34,197,94,.15)'
             : t.type === 'savings' ? 'rgba(6,182,212,.15)'
             :                        'rgba(239,68,68,.15)';
  const sign = t.type === 'income'  ? '+' : t.type === 'savings' ? '→' : '-';
  const actions = allowDelete ? `<div class="tx-actions">
      <button class="tx-edit" onclick="openEditModal('${t.id}')" aria-label="Edit">✏</button>
      <button class="tx-delete" onclick="deleteTx('${t.id}')" aria-label="Delete">🗑</button>
    </div>` : '';
  return `<div class="tx-item">
    <div class="tx-icon" style="background:${bg}">${c.emoji}</div>
    <div class="tx-info">
      <div class="tx-cat">${c.label}</div>
      <div class="tx-date">${new Date(t.date + 'T12:00:00').toLocaleDateString(dateLocale(), { month: 'short', day: 'numeric' })}</div>
      ${t.notes ? `<div class="tx-note">${t.notes}</div>` : ''}
    </div>
    <div class="tx-right">
      <span class="tx-amount ${t.type}">${sign}${fmt(t.amount)}</span>
      ${actions}
    </div>
  </div>`;
}

