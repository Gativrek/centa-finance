// core.js — Generic helpers (fmt, uid, dates), balance visibility, page navigation
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Helpers ──────────────────────────────────────────────
function fmt(n) {
  const c = currencyConf();
  return new Intl.NumberFormat(c.locale, { style: 'currency', currency: c.code }).format(n);
}

// Sum of all transactions up to the last day of `ym` (YYYY-MM)
function cumulativeBalance(ym) {
  const [y, m] = ym.split('-').map(Number);
  const cutoff = new Date(y, m, 0).toISOString().slice(0, 10); // last day of month
  return state.transactions
    .filter(t => t.date <= cutoff)
    .reduce((sum, t) => {
      if (t.type === 'income')  return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      if (t.type === 'savings') return sum - t.amount;
      return sum;
    }, 0);
}

function txForMonth(ym) {
  return state.transactions.filter(t => t.date.startsWith(ym));
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return new Date(+y, +m - 1, 1).toLocaleDateString(dateLocale(), { month: 'long', year: 'numeric' });
}

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 2, 1).toISOString().slice(0, 7);
}

function buildCarryHtml(amount, fromYm) {
  const sign = amount >= 0 ? '+' : '';
  return `<div class="tx-item">
    <div class="tx-icon" style="background:rgba(168,85,247,.15)">↩</div>
    <div class="tx-info">
      <div class="tx-cat" style="color:var(--carry)">${tr('carried_over')}</div>
      <div class="tx-note">${tr('balance_from', { month: monthLabel(fromYm) })}</div>
    </div>
    <span class="tx-amount carry">${sign}${fmt(amount)}</span>
  </div>`;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Balance visibility ───────────────────────────────────
let balanceHidden = localStorage.getItem(KEYS.balanceHidden) === '1';

function syncEyeIcon() {
  const icon = document.getElementById('eye-icon');
  if (icon) {
    icon.innerHTML = balanceHidden
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function toggleBalance() {
  balanceHidden = !balanceHidden;
  localStorage.setItem(KEYS.balanceHidden, balanceHidden ? '1' : '0');
  syncEyeIcon();
  renderDashboard();
}

// ── Navigation ───────────────────────────────────────────
let currentPage = 'dashboard';
const pages = ['dashboard', 'add', 'transactions', 'budgets', 'charts'];

function showPage(id) {
  currentPage = id;
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + id));
  document.querySelectorAll('nav button').forEach(b => b.classList.toggle('active', b.dataset.page === id));
  const fab = document.querySelector('.fab-wrap');
  if (fab) fab.style.display = id === 'add' ? 'none' : 'block';
  renderPage(id);
}

function renderPage(id) {
  switch (id) {
    case 'dashboard':    renderDashboard(); break;
    case 'transactions': renderTransactions(); break;
    case 'budgets':      renderBudgets(); break;
  }
}

// Move the viewed month forward/back and re-render the current page.
function changeMonth(delta) {
  const [y, m] = state.currentMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  state.currentMonth = d.toISOString().slice(0, 7);
  renderPage(currentPage);
}

// Count-up animation for a number element; remembers its last value so it
// eases from the previous figure (e.g. on month change) rather than from 0.
function animateValue(el, to, fmtFn, dur = 420) {
  const from = el._val != null ? el._val : 0;
  el._val = to;
  if (from === to) { el.textContent = fmtFn(to); return; }
  const start = performance.now();
  function frame(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = fmtFn(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Faint trend line of the running balance over the last 6 months, drawn on the
// hero card. Hidden when balances are hidden.
function renderBalanceSparkline() {
  const wrap = document.getElementById('balance-spark');
  if (!wrap) return;
  if (balanceHidden) { wrap.innerHTML = ''; return; }

  const months = [];
  let ym = state.currentMonth;
  for (let i = 0; i < 6; i++) { months.unshift(ym); ym = prevMonth(ym); }
  const vals = months.map(m => cumulativeBalance(m));

  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 1;
  const W = 100, H = 30, pad = 3;
  const pts = vals.map((v, i) => [
    pad + (i / (vals.length - 1)) * (W - 2 * pad),
    pad + (1 - (v - min) / range) * (H - 2 * pad),
  ]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `M${pts[0][0].toFixed(1)} ${H} ` + pts.map(p => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0].toFixed(1)} ${H} Z`;

  wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" width="100%" height="${H}">
    <path d="${area}" fill="rgba(255,255,255,.13)"/>
    <path d="${line}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.4" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

