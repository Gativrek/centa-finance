// transactions.js — Add-transaction form + Transactions page (list, calendar, search, delete)
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Add Transaction ──────────────────────────────────────
let addType = 'expense';
let rawCents = 0; // banking-style input state

function initAddPage() {
  document.getElementById('add-expense-btn').onclick = () => setAddType('expense');
  document.getElementById('add-income-btn').onclick  = () => setAddType('income');
  document.getElementById('add-savings-btn').onclick = () => setAddType('savings');
  document.getElementById('add-date').value = new Date().toISOString().slice(0, 10);
  setAddType('expense');
  document.getElementById('add-form').onsubmit = submitAdd;
  initAmountInput();
}

function initAmountInput() {
  const input = document.getElementById('add-amount');
  input.addEventListener('beforeinput', e => {
    e.preventDefault();
    switch (e.inputType) {
      case 'deleteContentBackward':
      case 'deleteContentForward':
        rawCents = Math.floor(rawCents / 10);
        break;
      case 'insertText':
      case 'insertFromPaste':
        for (const ch of (e.data || '')) {
          if (ch >= '0' && ch <= '9' && rawCents < 9999999) {
            rawCents = rawCents * 10 + parseInt(ch);
          }
        }
        break;
    }
    input.value = rawCents > 0 ? fmt(rawCents / 100) : '';
  });
}

function setAddType(type) {
  addType = type;
  document.getElementById('add-expense-btn').className = 'type-btn' + (type === 'expense' ? ' active-expense' : '');
  document.getElementById('add-income-btn').className  = 'type-btn' + (type === 'income'  ? ' active-income'  : '');
  document.getElementById('add-savings-btn').className = 'type-btn' + (type === 'savings' ? ' active-savings' : '');
  buildCategorySelect(type);
}

function buildCategorySelect(type) {
  const sel  = document.getElementById('add-category');
  let   cats = allCats(type);
  if (type === 'savings') {
    const goalCats = state.goals.filter(g => !g.archived).map(g => ({ id: g.id, label: g.name, emoji: g.emoji || '🎯' }));
    cats = [...cats, ...goalCats];
  }
  sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.emoji} ${c.label}</option>`).join('');
}

function submitAdd(e) {
  e.preventDefault();
  if (rawCents <= 0) { showToast(tr('toast_enter_valid')); return; }
  const amount = rawCents / 100;
  const tx = {
    id:       uid(),
    type:     addType,
    amount,
    category: document.getElementById('add-category').value,
    date:     document.getElementById('add-date').value,
    notes:    document.getElementById('add-notes').value.trim(),
  };
  state.transactions.push(tx);
  save();
  // Reset form
  rawCents = 0;
  document.getElementById('add-amount').value = '';
  document.getElementById('add-notes').value  = '';
  document.getElementById('add-date').value = new Date().toISOString().slice(0, 10);
  showToast(tr('toast_tx_added'));
  showPage('dashboard');
}

// ── Transactions Page ────────────────────────────────────
let txFilter = 'all';
let txView = 'calendar';
let calSelectedDay = null;
let txSearch = ''; // free-text search; when set, results span ALL months

function onTxSearch(q) {
  txSearch = q.trim();
  renderTransactions();
}

// True if a transaction matches the current search text (category, notes, amount).
function txMatchesSearch(t, needle) {
  const cat = catInfo(t.category);
  const hay = [cat.label, t.notes || '', String(t.amount)].join(' ').toLowerCase();
  return hay.includes(needle);
}

function setTxView(v) {
  txView = v;
  document.getElementById('view-list-btn').classList.toggle('active', v === 'list');
  document.getElementById('view-cal-btn').classList.toggle('active', v === 'calendar');
  document.getElementById('tx-list-view').style.display = v === 'list' ? '' : 'none';
  document.getElementById('tx-cal-view').style.display  = v === 'calendar' ? '' : 'none';
  renderTransactions();
}

function renderTransactions() {
  document.getElementById('tx-month-label').textContent = monthLabel(state.currentMonth);

  if (txView === 'calendar') {
    renderCalendar();
    return;
  }

  // Search spans all months; without it we stay scoped to the current month.
  const searching = txSearch.length > 0;
  let filtered = searching ? [...state.transactions] : txForMonth(state.currentMonth);
  if (txFilter === 'income')  filtered = filtered.filter(t => t.type === 'income');
  if (txFilter === 'expense') filtered = filtered.filter(t => t.type === 'expense');
  if (txFilter === 'savings') filtered = filtered.filter(t => t.type === 'savings');
  if (searching) {
    const needle = txSearch.toLowerCase();
    filtered = filtered.filter(t => txMatchesSearch(t, needle));
  }
  filtered.sort((a, b) => b.date.localeCompare(a.date));

  const hint = document.getElementById('tx-search-hint');
  if (hint) {
    hint.style.display = searching ? '' : 'none';
    if (searching) hint.textContent = tr('search_results', { n: filtered.length });
  }

  const list = document.getElementById('tx-list');
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty"><div class="icon">🔍</div><p>${tr('no_tx_found')}</p></div>`;
  } else {
    list.innerHTML = filtered.map(t => txHtml(t, true)).join('');
  }

  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.filter === txFilter);
  });
}

function renderCalendar() {
  // Clear selection if it belongs to a different month
  if (calSelectedDay && !calSelectedDay.startsWith(state.currentMonth)) calSelectedDay = null;

  const [y, m] = state.currentMonth.split('-').map(Number);
  const txs = txForMonth(state.currentMonth);

  // Group by day string "01"…"31"
  const byDay = {};
  txs.forEach(t => {
    const d = t.date.slice(8, 10);
    (byDay[d] = byDay[d] || []).push(t);
  });

  const firstWeekday = new Date(y, m - 1, 1).getDay(); // 0=Sun
  const daysInMonth  = new Date(y, m, 0).getDate();
  const todayStr     = new Date().toISOString().slice(0, 10);

  let html = '<div class="cal-day empty"></div>'.repeat(firstWeekday);

  for (let d = 1; d <= daysInMonth; d++) {
    const pad     = String(d).padStart(2, '0');
    const dateStr = `${state.currentMonth}-${pad}`;
    const dayTxs  = byDay[pad] || [];
    const isToday = dateStr === todayStr;
    const isSel   = dateStr === calSelectedDay;
    const cls     = ['cal-day', isToday ? 'today' : '', isSel ? 'selected' : ''].filter(Boolean).join(' ');

    html += `<div class="${cls}" onclick="selectCalDay('${dateStr}')">
      <span class="cal-day-num">${d}</span>
      <div class="cal-dots">
        ${dayTxs.some(t => t.type === 'income')  ? '<span class="cal-dot income"></span>'  : ''}
        ${dayTxs.some(t => t.type === 'expense') ? '<span class="cal-dot expense"></span>' : ''}
        ${dayTxs.some(t => t.type === 'savings') ? '<span class="cal-dot savings"></span>' : ''}
      </div>
    </div>`;
  }

  document.getElementById('cal-grid').innerHTML = html;

  if (calSelectedDay) renderCalDetail(calSelectedDay, txs);
  else document.getElementById('cal-detail').innerHTML = '';
}

function selectCalDay(dateStr) {
  calSelectedDay = calSelectedDay === dateStr ? null : dateStr;
  renderCalendar();
}

function renderCalDetail(dateStr, txs) {
  const dayTxs = txs.filter(t => t.date === dateStr).sort((a, b) => a.id.localeCompare(b.id));
  const label  = new Date(dateStr + 'T12:00:00').toLocaleDateString(dateLocale(), { weekday: 'long', month: 'long', day: 'numeric' });
  const detail = document.getElementById('cal-detail');
  if (!dayTxs.length) {
    detail.innerHTML = `<div class="section-title">${label}</div><div class="card"><div class="empty" style="padding:8px"><p>${tr('no_transactions')}</p></div></div>`;
    return;
  }
  detail.innerHTML = `
    <div class="section-title">${label}</div>
    <div class="card" style="padding:0;overflow:hidden">${dayTxs.map(t => txHtml(t, true)).join('')}</div>`;
}

let _deletedTx = null;

function deleteTx(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  _deletedTx = tx;
  state.transactions = state.transactions.filter(t => t.id !== id);
  save();
  renderTransactions();
  renderPage('dashboard');
  const c = catInfo(tx.category);
  showToast(`Deleted: ${c.emoji} ${c.label}`, () => {
    if (!_deletedTx) return;
    state.transactions.push(_deletedTx);
    _deletedTx = null;
    save();
    renderPage(currentPage);
    showToast(tr('toast_restored'));
  });
}

// Save a file so it works both in the native app (Share sheet → Drive/Files/
// email) and in the browser (download). The old <a download> blob trick is a
// silent no-op inside the Android WebView.
// NOTE: no-bundler app — native plugins live on Capacitor.Plugins.<Name>;
// the injected bridge has no registerPlugin() (that's an @capacitor/core export).
function nativeFileApi() {
  const P = window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform() && Capacitor.Plugins;
  if (!(P && P.Share && P.Filesystem)) return null;
  return { Share: P.Share, Filesystem: P.Filesystem };
}

function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

// Export destination: 'share' (Share sheet, default) or 'device' (SAF folder picker).
function exportMode() { return localStorage.getItem(KEYS.exportMode) || 'share'; }

async function saveFile(fileName, content, mime, isBase64) {
  const isNative = window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  const P = (window.Capacitor && Capacitor.Plugins) || {};

  // "Save to device": Android SAF picker — user chooses folder + name, file lands there.
  if (isNative && exportMode() === 'device' && P.FileSaver) {
    try {
      await P.FileSaver.saveFile({ fileName, mimeType: mime, data: isBase64 ? content : utf8ToBase64(content) });
      return true;
    } catch (e) {
      const msg = (e && e.message ? e.message : '').toLowerCase();
      if (msg.includes('cancel')) return false; // user backed out of the picker — no success toast
      console.error('save-to-device failed', e);
      // fall through to the Share sheet as a fallback
    }
  }

  const native = nativeFileApi();
  if (native) {
    try {
      // Filesystem treats data as base64 when no encoding is given (binary files, e.g. PDF)
      const opts = { path: fileName, data: content, directory: 'CACHE' };
      if (!isBase64) opts.encoding = 'utf8';
      await native.Filesystem.writeFile(opts);
      const { uri } = await native.Filesystem.getUri({ path: fileName, directory: 'CACHE' });
      await native.Share.share({ title: fileName, url: uri, dialogTitle: fileName });
      return true;
    } catch (e) {
      const msg = (e && e.message ? e.message : '').toLowerCase();
      if (msg.includes('cancel')) return true; // user dismissed the share sheet
      console.error('Share/export failed', e);
      return false;
    }
  }

  const data = isBase64 ? Uint8Array.from(atob(content), c => c.charCodeAt(0)) : content;
  const blob = new Blob([data], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = fileName; a.click();
  URL.revokeObjectURL(url);
  return true;
}

async function exportCSV() {
  const txs = txForMonth(state.currentMonth);
  if (!txs.length) { showToast(tr('toast_no_export')); return; }
  const rows = [[tr('csv_date'), tr('csv_type'), tr('csv_category'), tr('csv_amount'), tr('csv_notes')]];
  txs.forEach(t => {
    const c = catInfo(t.category);
    rows.push([t.date, t.type, c.label, t.amount.toFixed(2), `"${(t.notes||'').replace(/"/g,'""')}"`]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  await saveFile(`finance-${state.currentMonth}.csv`, csv, 'text/csv');
}

