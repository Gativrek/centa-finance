// plan.js — Plan tab: savings goals, budgets, budget rollover, custom categories
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Savings Goals ─────────────────────────────────────────
let goalCarouselIdx = 0;
let goalRawCents    = 0;

function goalProgress(goalId) {
  return state.transactions.filter(t => t.category === goalId).reduce((s, t) => s + t.amount, 0);
}

function renderGoalCarousel() {
  const wrap   = document.getElementById('dash-goals');
  const active = state.goals.filter(g => !g.archived);
  if (!active.length) { wrap.innerHTML = ''; return; }
  if (goalCarouselIdx >= active.length) goalCarouselIdx = 0;

  const goal    = active[goalCarouselIdx];
  const prog    = goalProgress(goal.id);
  const pct     = Math.min((prog / goal.target) * 100, 100);
  const rem     = Math.max(goal.target - prog, 0);
  const complete = prog >= goal.target;
  const showNav  = active.length > 1;

  const navPrev = showNav ? `<button class="goal-nav-btn" onclick="prevGoal()">‹</button>` : '';
  const navNext = showNav ? `<button class="goal-nav-btn" onclick="nextGoal()">›</button>` : '';
  const dots    = active.length > 1 ? `<div class="goal-dots-wrap">${
    active.map((_, i) => `<span class="goal-dot${i === goalCarouselIdx ? ' active' : ''}"></span>`).join('')
  }</div>` : '';

  const inner = complete ? `
    <div class="goal-header"><span class="goal-emoji">${goal.emoji||'🎯'}</span><span class="goal-name">${goal.name}</span></div>
    <div class="goal-complete-msg">🎉 Congratulations! Goal complete!</div>
    <div class="goal-bar-wrap"><div class="goal-bar-fill" style="width:100%"></div></div>
    <div class="goal-remaining" style="margin-top:4px">${fmt(prog)} / ${fmt(goal.target)}</div>
    <button onclick="archiveGoal('${goal.id}')" style="margin-top:10px;width:100%;padding:7px;background:var(--green);border:none;color:#fff;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer">Archive this goal ✓</button>
  ` : `
    <div class="goal-header"><span class="goal-emoji">${goal.emoji||'🎯'}</span><span class="goal-name">${goal.name}</span></div>
    <div class="goal-pct">${Math.round(pct)}%</div>
    <div class="goal-bar-wrap"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
    <div class="goal-remaining">${fmt(rem)} remaining · ${fmt(prog)} / ${fmt(goal.target)}</div>
  `;

  wrap.innerHTML = `
    <div class="goal-carousel-outer">
      <div class="goal-carousel">
        ${navPrev}
        <div class="goals-card${complete ? ' complete' : ''}" id="goal-card-inner">${inner}</div>
        ${navNext}
      </div>
      ${dots}
    </div>`;

  // Swipe support
  const card = document.getElementById('goal-card-inner');
  let sx = 0;
  card.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  card.addEventListener('touchend',   e => {
    const dx = sx - e.changedTouches[0].clientX;
    if (dx >  40) nextGoal();
    if (dx < -40) prevGoal();
  });
}

function prevGoal() {
  const n = state.goals.filter(g => !g.archived).length;
  goalCarouselIdx = (goalCarouselIdx - 1 + n) % n;
  renderGoalCarousel();
}
function nextGoal() {
  const n = state.goals.filter(g => !g.archived).length;
  goalCarouselIdx = (goalCarouselIdx + 1) % n;
  renderGoalCarousel();
}

function renderGoalList() {
  const wrap   = document.getElementById('goal-list-wrap');
  const active = state.goals.filter(g => !g.archived);
  if (!active.length) {
    wrap.innerHTML = `<div class="card card-sm" style="color:var(--muted);font-size:13px;text-align:center;padding:14px">${tr('no_goals_yet')}</div>`;
    return;
  }
  wrap.innerHTML = `<div class="card card-sm">${active.map(g => {
    const prog = goalProgress(g.id);
    const pct  = Math.min((prog / g.target) * 100, 100);
    const rem  = Math.max(g.target - prog, 0);
    const comp = prog >= g.target;
    const fill = comp ? 'var(--green)' : 'var(--accent)';
    return `<div class="goal-list-item">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:7px">
          <span style="font-size:18px">${g.emoji||'🎯'}</span>
          <span style="font-weight:600;font-size:14px">${g.name}</span>
        </div>
        <span style="font-size:13px;font-weight:700;color:${fill}">${Math.round(pct)}%</span>
      </div>
      <div class="budget-bar" style="margin-bottom:5px"><div class="budget-fill ok" style="width:${pct}%;background:${fill}"></div></div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:12px;color:var(--muted)">${fmt(prog)} / ${fmt(g.target)}</span>
        ${comp
          ? `<button onclick="archiveGoal('${g.id}')" style="background:var(--green);border:none;color:#fff;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;cursor:pointer">${tr('archive')}</button>`
          : `<span style="font-size:12px;color:var(--muted)">${appLang === 'pt' ? tr('to_go') + ' ' + fmt(rem) : fmt(rem) + ' ' + tr('to_go')}</span>`}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function archiveGoal(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal || !confirm(tr('confirm_archive', { name: goal.name }))) return;
  goal.archived = true;
  goalCarouselIdx = 0;
  save();
  renderBudgets();
  renderGoalCarousel();
}

function addGoal(e) {
  e.preventDefault();
  if (goalRawCents <= 0) { showToast(tr('toast_enter_target')); return; }
  const name = document.getElementById('goal-name').value.trim();
  if (!name) return;
  state.goals.push({
    id:        'goal_' + uid(),
    name,
    emoji:     document.getElementById('goal-emoji').value || '🎯',
    target:    goalRawCents / 100,
    archived:  false,
    createdAt: new Date().toISOString().slice(0, 10),
  });
  goalRawCents = 0;
  resetEmojiPicker('goal-emoji-picker', 'goal-emoji');
  document.getElementById('goal-name').value   = '';
  document.getElementById('goal-amount').value = '';
  save();
  renderBudgets();
  closeSheet('sheet-goal');
  showToast(tr('toast_goal_created'));
}

function initGoalAmountInput() {
  const input = document.getElementById('goal-amount');
  input.addEventListener('beforeinput', e => {
    e.preventDefault();
    switch (e.inputType) {
      case 'deleteContentBackward':
      case 'deleteContentForward':
        goalRawCents = Math.floor(goalRawCents / 10);
        break;
      case 'insertText':
      case 'insertFromPaste':
        for (const ch of (e.data || '')) {
          if (ch >= '0' && ch <= '9' && goalRawCents < 9999999) goalRawCents = goalRawCents * 10 + parseInt(ch);
        }
        break;
    }
    input.value = goalRawCents > 0 ? fmt(goalRawCents / 100) : '';
  });
}

// ── Plan sub-tabs + add sheets ───────────────────────────
let planTab = 'categories';

function setPlanTab(tab) {
  planTab = tab;
  document.querySelectorAll('.plan-tab').forEach(b => b.classList.toggle('active', b.dataset.plan === tab));
  document.querySelectorAll('.plan-panel').forEach(p => p.classList.toggle('active', p.id === 'plan-' + tab));
}

function openSheet(id)  { document.getElementById(id).classList.add('open'); }
function closeSheet(id) { document.getElementById(id).classList.remove('open'); }

function openDrawer()  { document.getElementById('drawer-overlay').classList.add('open'); }
function closeDrawer() { document.getElementById('drawer-overlay').classList.remove('open'); }

// ── Budgets ──────────────────────────────────────────────
// A category's effective budget is simply its monthly limit.
function effectiveBudget(cat) {
  const base = state.budgets[cat] || 0;
  return { base, limit: base };
}

// ── Budgets Page ─────────────────────────────────────────
function renderBudgets() {
  renderCategoryList();
  renderGoalList();
  renderRecurringList();
  const list = document.getElementById('budget-list');
  const entries = Object.entries(state.budgets);
  const txs = txForMonth(state.currentMonth);
  const spent = {};
  txs.filter(t => t.type === 'expense').forEach(t => { spent[t.category] = (spent[t.category] || 0) + t.amount; });

  if (entries.length === 0) {
    list.innerHTML = `<div class="empty"><div class="icon">🎯</div><p>${tr('no_budgets')}</p></div>`;
  } else {
    list.innerHTML = entries.map(([cat]) => {
      const { limit } = effectiveBudget(cat);
      const s = spent[cat] || 0;
      const pct = limit > 0 ? Math.min((s / limit) * 100, 100) : 100;
      const cls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : 'ok';
      const c = catInfo(cat);
      return `<div class="budget-item">
        <div class="budget-row">
          <div class="b-name">${c.emoji} <strong>${c.label}</strong></div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="b-amounts">${fmt(s)} / ${fmt(limit)}</div>
            <button onclick="removeBudget('${cat}')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:16px">×</button>
          </div>
        </div>
        <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>
        ${pct >= 80 ? `<div style="font-size:11px;color:${pct>=100?'var(--red)':'var(--yellow)'};margin-top:4px">${pct>=100?tr('over_budget'):tr('pct_used',{pct:Math.round(pct)})}</div>` : ''}
      </div>`;
    }).join('');
  }

  // Populate budget category selector (only cats not already budgeted)
  const sel = document.getElementById('budget-category');
  const available = allCats('expense').filter(c => !state.budgets[c.id]);
  sel.innerHTML = available.length
    ? available.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('')
    : `<option value="">${tr('all_budgeted')}</option>`;
  document.getElementById('budget-submit').disabled = available.length === 0;

  // Keep subscription category dropdown in sync
  rebuildRecCategory();
}

function addBudget(e) {
  e.preventDefault();
  const cat    = document.getElementById('budget-category').value;
  const amount = parseFloat(document.getElementById('budget-amount').value);
  if (!cat || !amount || amount <= 0) return;
  state.budgets[cat] = amount;
  save();
  document.getElementById('budget-amount').value = '';
  renderBudgets();
  renderPage('dashboard');
  closeSheet('sheet-budget');
}

function removeBudget(cat) {
  delete state.budgets[cat];
  save();
  renderBudgets();
  renderPage('dashboard');
}

// ── Custom Categories ─────────────────────────────────────
let catTab = 'expense';

function setCatTab(type) {
  catTab = type;
  document.getElementById('cat-tab-expense').classList.toggle('active', type === 'expense');
  document.getElementById('cat-tab-income').classList.toggle('active', type === 'income');
  renderCategoryList();
}

function renderCategoryList() {
  const wrap = document.getElementById('cat-list-wrap');
  if (!wrap) return;
  const customs = state.customCategories[catTab] || [];
  if (!customs.length) {
    wrap.innerHTML = `<div class="card card-sm" style="color:var(--muted);font-size:13px;text-align:center;padding:14px">${catTab === 'income' ? tr('no_custom_inc') : tr('no_custom_exp')}</div>`;
    return;
  }
  wrap.innerHTML = `<div class="card card-sm">${customs.map(c => `
    <div class="cat-item">
      <span class="cat-item-label">${c.emoji} ${c.label}</span>
      <button class="cat-item-del" onclick="deleteCategory('${c.id}','${catTab}')">×</button>
    </div>`).join('')}</div>`;
}

function addCategory(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  if (!name) return;
  const emoji = document.getElementById('cat-emoji').value || '📦';
  const id = 'cat_' + uid();
  state.customCategories[catTab].push({ id, label: name, emoji });
  save();
  document.getElementById('cat-name').value = '';
  resetEmojiPicker('cat-emoji-picker', 'cat-emoji');
  renderCategoryList();
  rebuildRecCategory();
  renderBudgets();
  closeSheet('sheet-cat');
  showToast(tr('toast_cat_added'));
}

function deleteCategory(id, type) {
  const cat = (state.customCategories[type] || []).find(c => c.id === id);
  if (!cat || !confirm(tr('confirm_del_cat', { name: cat.label }))) return;
  const fallback = type === 'expense' ? 'other' : 'other_inc';
  state.transactions.forEach(t => { if (t.category === id) t.category = fallback; });
  delete state.budgets[id];
  state.customCategories[type] = state.customCategories[type].filter(c => c.id !== id);
  save();
  renderCategoryList();
  rebuildRecCategory();
  renderPage(currentPage);
  showToast(`"${cat.label}" deleted`);
}

function rebuildRecCategory() {
  const sel = document.getElementById('rec-category');
  if (!sel) return;
  sel.innerHTML = allCats('expense').map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
}

