// methods-recurring.js — Recurring subscriptions
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Recurring Subscriptions ───────────────────────────────
let recurringRawCents = 0;
let editingRecId      = null; // null = add mode, else editing this recurring id

function recFreq(r) { return r.frequency || 'monthly'; } // back-compat: legacy subs are monthly

// Capitalize a locale name (pt-BR month/weekday names come back lowercase).
function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function weekdayName(i, style = 'long') { return capFirst(new Intl.DateTimeFormat(dateLocale(), { weekday: style }).format(new Date(2024, 0, 7 + Number(i)))); } // 2024-01-07 = Sunday
function monthName(m, style = 'long')   { return capFirst(new Intl.DateTimeFormat(dateLocale(), { month: style }).format(new Date(2024, Number(m) - 1, 1))); }

// The current billing period for a recurring def: a period-key (already-billed
// marker stored in recurringLog), the ISO date to stamp the charge with, and
// whether that moment has been reached today. Monthly keeps the legacy 'YYYY-MM'
// key so existing logs stay valid.
function recurringDue(r, today) {
  const f = recFreq(r);
  const y = today.getFullYear();
  if (f === 'yearly') {
    const mo = r.billMonth || 1;
    const lastDay = new Date(y, mo, 0).getDate();
    const day = Math.min(r.dayOfMonth || 1, lastDay);
    const due = new Date(y, mo - 1, day);
    return { period: 'Y' + y, reached: today >= due, date: `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
  }
  if (f === 'weekly') {
    const wd = r.dayOfWeek == null ? 1 : r.dayOfWeek;      // 0=Sun … 6=Sat
    const occ = new Date(today);
    occ.setHours(0, 0, 0, 0);
    occ.setDate(today.getDate() - ((today.getDay() - wd + 7) % 7)); // most recent billing weekday
    return { period: 'W' + occ.toISOString().slice(0, 10), reached: true, date: occ.toISOString().slice(0, 10) };
  }
  const mo = today.getMonth() + 1;
  const lastDay = new Date(y, mo, 0).getDate();
  const day = Math.min(r.dayOfMonth || 1, lastDay);
  const ym = today.toISOString().slice(0, 7);
  return { period: ym, reached: today.getDate() >= day, date: `${ym}-${String(day).padStart(2, '0')}` };
}

// Monthly-equivalent cost so the dashboard total stays comparable across cadences.
function monthlyEquiv(r) {
  const f = recFreq(r);
  return f === 'weekly' ? r.amount * 52 / 12 : f === 'yearly' ? r.amount / 12 : r.amount;
}

// Compact "when" for the dashboard row; full cadence label for the Plan list.
function recurringShortWhen(r) {
  const f = recFreq(r);
  if (f === 'weekly') return weekdayName(r.dayOfWeek || 0, 'short');
  if (f === 'yearly') return monthName(r.billMonth || 1, 'short') + ' ' + (r.dayOfMonth || 1);
  return tr('day') + ' ' + (r.dayOfMonth || 1);
}
function recurringWhenLabel(r) {
  const f = recFreq(r);
  if (f === 'weekly') return tr('freq_weekly') + ' · ' + weekdayName(r.dayOfWeek || 0);
  if (f === 'yearly') return tr('freq_yearly') + ' · ' + monthName(r.billMonth || 1) + ' ' + (r.dayOfMonth || 1);
  return tr('freq_monthly') + ' · ' + tr('day') + ' ' + (r.dayOfMonth || 1);
}

// Called at boot / on profile switch: inserts the current period's charge for any
// active subscription whose billing moment has passed and isn't logged yet.
function autoAddRecurring() {
  const today = new Date();
  let changed = false;
  state.recurring.filter(r => r.active).forEach(r => {
    if (!state.recurringLog[r.id]) state.recurringLog[r.id] = [];
    const { period, reached, date } = recurringDue(r, today);
    if (!reached) return;
    if (state.recurringLog[r.id].includes(period)) return; // already billed this period
    state.transactions.push({
      id:          uid(),
      type:        'expense',
      amount:      r.amount,
      category:    r.category,
      date,
      notes:       `🔄 ${r.name}`,
      recurringId: r.id,
    });
    state.recurringLog[r.id].push(period);
    changed = true;
  });
  if (changed) save();
}

function renderRecurringDashboard() {
  const wrap   = document.getElementById('dash-recurring');
  const active = state.recurring.filter(r => r.active);
  if (!active.length) { wrap.innerHTML = ''; return; }

  const today  = new Date();
  const total  = active.reduce((s, r) => s + monthlyEquiv(r), 0);
  const sorted = [...active].sort((a, b) => recurringDue(a, today).date.localeCompare(recurringDue(b, today).date));

  wrap.innerHTML = `
    <div class="section-title">${tr('monthly_subscriptions')}</div>
    <div class="card card-sm">
      <div class="recurring-header">
        <span>💳 ${tr('subs_count', { n: active.length, s: active.length !== 1 ? 's' : '' })}</span>
        <span><strong>${fmt(total)}</strong><span class="recurring-period">${tr('per_mo')}</span></span>
      </div>
      ${sorted.map(r => {
        const billed = (state.recurringLog[r.id] || []).includes(recurringDue(r, today).period);
        return `<div class="insight-row">
          <span class="insight-cat">${r.emoji || '💳'} ${r.name}</span>
          <span class="insight-pct" style="color:${billed ? 'var(--muted)' : 'var(--yellow)'}">
            ${billed ? '✓' : '⏳ ' + recurringShortWhen(r)} · ${fmt(r.amount)}
          </span>
        </div>`;
      }).join('')}
    </div>`;
}

function renderRecurringList() {
  const wrap = document.getElementById('recurring-list');
  if (!wrap) return;
  if (!state.recurring.length) {
    wrap.innerHTML = `<div style="padding:12px 16px;color:var(--muted);font-size:14px;text-align:center">${tr('no_subs')}</div>`;
    return;
  }
  wrap.innerHTML = state.recurring.map(r => {
    const cat = catInfo(r.category);
    return `<div class="goal-list-item" style="${r.active ? '' : 'opacity:0.5'}">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span style="font-size:15px">${r.emoji || '💳'} <strong>${r.name}</strong></span>
        <span style="font-weight:600;color:var(--red)">-${fmt(r.amount)}</span>
      </div>
      <div style="font-size:13px;color:var(--muted);margin-top:4px">${cat.emoji} ${cat.label} · ${recurringWhenLabel(r)}</div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-outline" style="flex:1;font-size:12px;padding:6px"
          onclick="openEditRecurring('${r.id}')">✏ ${tr('edit')}</button>
        <button class="btn btn-outline" style="flex:1;font-size:12px;padding:6px"
          onclick="toggleRecurring('${r.id}')">${r.active ? tr('pause') : tr('resume')}</button>
        <button class="btn btn-outline" style="flex:1;font-size:12px;padding:6px;color:var(--red);border-color:var(--red)"
          onclick="deleteRecurring('${r.id}')">🗑 ${tr('delete')}</button>
      </div>
    </div>`;
  }).join('');
}

function toggleRecurring(id) {
  const r = state.recurring.find(r => r.id === id);
  if (!r) return;
  r.active = !r.active;
  save();
  renderRecurringList();
  renderRecurringDashboard();
}

function deleteRecurring(id) {
  if (!confirm(tr('confirm_del_sub'))) return;
  state.recurring = state.recurring.filter(r => r.id !== id);
  save();
  renderRecurringList();
  renderRecurringDashboard();
}

// (Re)build the weekday + month dropdowns in the sub sheet, respecting language.
function populateRecWhenSelects() {
  const wd = document.getElementById('rec-weekday');
  if (wd) wd.innerHTML = [0,1,2,3,4,5,6].map(i => `<option value="${i}">${weekdayName(i)}</option>`).join('');
  const mo = document.getElementById('rec-month');
  if (mo) mo.innerHTML = [1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}">${monthName(m)}</option>`).join('');
}

// Show/hide the day / weekday / month inputs based on the chosen frequency.
function syncRecFrequencyFields() {
  const f = document.getElementById('rec-frequency').value;
  document.getElementById('rec-weekday-group').style.display = f === 'weekly' ? '' : 'none';
  document.getElementById('rec-month-group').style.display   = f === 'yearly' ? '' : 'none';
  document.getElementById('rec-day-group').style.display     = f === 'weekly' ? 'none' : '';
  document.getElementById('rec-day-label').textContent   = tr(f === 'yearly' ? 'day_of_month' : 'billing_day');
  document.getElementById('rec-amount-label').textContent = tr(f === 'weekly' ? 'weekly_amount' : f === 'yearly' ? 'yearly_amount' : 'monthly_amount');
}

// Open the sub sheet in ADD mode (fresh form).
function openRecSheet() {
  editingRecId = null;
  populateRecWhenSelects();
  document.getElementById('rec-sheet-title').textContent  = tr('add_subscription_title');
  document.getElementById('rec-submit-btn').textContent   = tr('add_subscription');
  document.getElementById('rec-name').value   = '';
  document.getElementById('rec-amount').value = '';
  recurringRawCents = 0;
  resetEmojiPicker('rec-emoji-picker', 'rec-emoji');
  document.getElementById('rec-frequency').value = 'monthly';
  document.getElementById('rec-day').value     = '';
  document.getElementById('rec-weekday').value = '1';
  document.getElementById('rec-month').value   = '1';
  syncRecFrequencyFields();
  openSheet('sheet-rec');
}

// Open the sub sheet in EDIT mode, pre-filled from an existing subscription.
function openEditRecurring(id) {
  const r = state.recurring.find(x => x.id === id);
  if (!r) return;
  editingRecId = id;
  populateRecWhenSelects();
  document.getElementById('rec-sheet-title').textContent = tr('edit_subscription_title');
  document.getElementById('rec-submit-btn').textContent  = tr('save_changes');
  document.getElementById('rec-name').value = r.name;
  setEmojiPicker('rec-emoji-picker', 'rec-emoji', r.emoji || '💳');
  recurringRawCents = Math.round(r.amount * 100);
  document.getElementById('rec-amount').value   = fmt(r.amount);
  document.getElementById('rec-category').value = r.category;
  document.getElementById('rec-frequency').value = recFreq(r);
  document.getElementById('rec-day').value     = r.dayOfMonth || '';
  document.getElementById('rec-weekday').value = r.dayOfWeek == null ? '1' : String(r.dayOfWeek);
  document.getElementById('rec-month').value   = String(r.billMonth || 1);
  syncRecFrequencyFields();
  openSheet('sheet-rec');
}

function submitRecurring(e) {
  e.preventDefault();
  if (recurringRawCents <= 0) { showToast(tr('toast_enter_amount')); return; }
  const name = document.getElementById('rec-name').value.trim();
  if (!name) return;
  const freq = document.getElementById('rec-frequency').value;
  const day  = parseInt(document.getElementById('rec-day').value, 10);
  if (freq !== 'weekly' && (!day || day < 1 || day > 31)) { showToast(tr('toast_enter_day')); return; }

  const def = {
    name,
    emoji:      document.getElementById('rec-emoji').value || '💳',
    amount:     recurringRawCents / 100,
    category:   document.getElementById('rec-category').value,
    frequency:  freq,
    dayOfMonth: freq === 'weekly' ? null : day,
    dayOfWeek:  freq === 'weekly' ? parseInt(document.getElementById('rec-weekday').value, 10) : null,
    billMonth:  freq === 'yearly' ? parseInt(document.getElementById('rec-month').value, 10) : null,
  };

  const isEdit = !!editingRecId;
  if (isEdit) {
    const r = state.recurring.find(x => x.id === editingRecId);
    if (r) Object.assign(r, def); // keep id, active, and existing log (past charges unchanged)
  } else {
    state.recurring.push({ id: 'rec_' + uid(), ...def, active: true });
  }
  editingRecId = null;
  recurringRawCents = 0;
  save();
  renderRecurringList();
  renderRecurringDashboard();
  renderPage(currentPage);
  closeSheet('sheet-rec');
  showToast(tr(isEdit ? 'toast_sub_saved' : 'toast_sub_added'));
}

function initRecurringAmountInput() {
  const input = document.getElementById('rec-amount');
  input.addEventListener('beforeinput', e => {
    e.preventDefault();
    switch (e.inputType) {
      case 'deleteContentBackward':
      case 'deleteContentForward':
        recurringRawCents = Math.floor(recurringRawCents / 10);
        break;
      case 'insertText':
      case 'insertFromPaste':
        for (const ch of (e.data || '')) {
          if (ch >= '0' && ch <= '9' && recurringRawCents < 9999999)
            recurringRawCents = recurringRawCents * 10 + parseInt(ch);
        }
    }
    input.value = recurringRawCents > 0 ? fmt(recurringRawCents / 100) : '';
  });
}

