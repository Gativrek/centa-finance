// csv.js — CSV import (free): parse, map columns, preview, dedupe, import
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── CSV import (free) ─────────────────────────────────────
// Bring history in from a bank statement or spreadsheet. Handles ; , and tab
// delimiters, quoted fields, BR "1.234,56" and US "1,234.56" amounts, and a few
// date layouts. Imported rows become normal transactions with fresh ids.
let csvRows = [];      // all parsed rows (array of arrays), header included
let csvNCols = 0;

function csvPad(n) { return String(n).padStart(2, '0'); }

function detectDelimiter(sample) {
  const lines = sample.split(/\r?\n/).filter(l => l.trim()).slice(0, 5);
  let best = ',', bestScore = -1;
  for (const d of [',', ';', '\t', '|']) {
    const counts = lines.map(l => l.split(d).length);
    const cols = counts[0] || 1;
    if (cols < 2) continue;
    const consistent = counts.every(c => c === cols);
    const score = cols * (consistent ? 10 : 1);
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
  const delim = detectDelimiter(text);
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  // drop fully-empty rows
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

function parseCsvAmount(str) {
  if (str == null) return NaN;
  let s = String(str).trim();
  const neg = /^\(.*\)$/.test(s) || s.includes('-');
  s = s.replace(/[^0-9.,]/g, '');
  if (!s) return NaN;
  const lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
  const lastSep = Math.max(lastDot, lastComma);
  let val;
  if (lastSep === -1) {
    val = parseFloat(s);
  } else {
    const bothSeps = lastDot > -1 && lastComma > -1;
    const trailing = s.length - lastSep - 1;
    if (bothSeps || trailing <= 2) {           // decimal separator = the last one
      val = parseFloat(s.slice(0, lastSep).replace(/[.,]/g, '') + '.' + s.slice(lastSep + 1));
    } else {                                   // single separator w/ 3 trailing digits → thousands
      val = parseFloat(s.replace(/[.,]/g, ''));
    }
  }
  if (isNaN(val)) return NaN;
  return neg ? -Math.abs(val) : val;
}

function parseCsvDate(str, fmt) {
  if (!str) return null;
  const s = String(str).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);   // ISO-ish
  if (m) { const mo = +m[2], d = +m[3]; return (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) ? `${m[1]}-${csvPad(mo)}-${csvPad(d)}` : null; }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (!m) { const d = new Date(s); return isNaN(d) ? null : d.toISOString().slice(0, 10); }
  let a = +m[1], b = +m[2], y = m[3];
  if (y.length === 2) y = (+y > 70 ? '19' : '20') + y;
  let day, mon;
  if (fmt === 'dmy') { day = a; mon = b; }
  else if (fmt === 'mdy') { day = b; mon = a; }
  else if (a > 12) { day = a; mon = b; }          // auto
  else if (b > 12) { day = b; mon = a; }
  else if (appLang === 'pt') { day = a; mon = b; } // ambiguous → locale
  else { day = b; mon = a; }
  if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
  return `${y}-${csvPad(mon)}-${csvPad(day)}`;
}

function handleCsvFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    csvRows = parseCSV(evt.target.result || '');
    if (!csvRows.length) { showToast(tr('toast_csv_empty')); return; }
    csvNCols = csvRows.reduce((mx, r) => Math.max(mx, r.length), 0);
    openCsvSheet();
  };
  reader.readAsText(file);
  e.target.value = '';
}

function csvHeaderOn() { return document.getElementById('csv-header-switch').getAttribute('aria-checked') === 'true'; }
function csvSignNeg()  { return document.getElementById('csv-sign-switch').getAttribute('aria-checked') === 'true'; }
function csvHeaderLabels() {
  return csvHeaderOn() && csvRows[0]
    ? csvRows[0].map((h, i) => (h || '').trim() || tr('csv_column', { n: i + 1 }))
    : Array.from({ length: csvNCols }, (_, i) => tr('csv_column', { n: i + 1 }));
}
function csvDataRows() { return csvHeaderOn() ? csvRows.slice(1) : csvRows; }

function guessCol(labels, re, fallback) {
  const i = labels.findIndex(l => re.test(l));
  return i > -1 ? i : (fallback < csvNCols ? fallback : -1);
}

function fillColSelect(sel, labels, selected, allowNone) {
  sel.innerHTML = (allowNone ? `<option value="-1">—</option>` : '') +
    labels.map((l, i) => `<option value="${i}">${escapeHtml(l)}</option>`).join('');
  sel.value = String(selected);
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function fillCatSelect(sel, type, preferred) {
  const cats = allCats(type);
  sel.innerHTML = cats.map(c => `<option value="${c.id}">${c.emoji} ${escapeHtml(c.label)}</option>`).join('');
  if (cats.some(c => c.id === preferred)) sel.value = preferred;
}

function openCsvSheet() {
  const labels = csvHeaderLabels();
  fillColSelect(document.getElementById('csv-col-date'),   labels, guessCol(labels, /date|data|dia|posted|when|fecha/i, 0), false);
  fillColSelect(document.getElementById('csv-col-amount'), labels, guessCol(labels, /amount|valor|value|montante|quantia|total|price|pre[çc]o|debit|credit/i, 1), false);
  fillColSelect(document.getElementById('csv-col-desc'),   labels, guessCol(labels, /desc|hist|memo|note|detail|estabelec|lan[çc]amento|title|name|obs/i, 2), true);
  document.getElementById('csv-date-fmt').value = 'auto';
  fillCatSelect(document.getElementById('csv-cat-expense'), 'expense', 'other');
  fillCatSelect(document.getElementById('csv-cat-income'),  'income',  'other_inc');
  renderCsvPreview();
  openSheet('sheet-csv');
}

function csvBuildRow(row, cfg) {
  const date   = parseCsvDate(row[cfg.dateCol], cfg.fmt);
  const amtRaw = parseCsvAmount(row[cfg.amtCol]);
  if (!date || isNaN(amtRaw) || amtRaw === 0) return null;
  const isExpense = cfg.signNeg ? amtRaw < 0 : amtRaw > 0;
  const notes = cfg.descCol > -1 ? (row[cfg.descCol] || '').trim() : '';
  return {
    id: uid(),
    type: isExpense ? 'expense' : 'income',
    amount: Math.abs(amtRaw),
    category: isExpense ? cfg.catExp : cfg.catInc,
    date,
    notes,
  };
}

function csvConfig() {
  return {
    dateCol: +document.getElementById('csv-col-date').value,
    amtCol:  +document.getElementById('csv-col-amount').value,
    descCol: +document.getElementById('csv-col-desc').value,
    fmt:     document.getElementById('csv-date-fmt').value,
    signNeg: csvSignNeg(),
    catExp:  document.getElementById('csv-cat-expense').value,
    catInc:  document.getElementById('csv-cat-income').value,
  };
}

function csvExistingKeys() {
  return new Set(state.transactions.map(t => `${t.date}|${t.amount.toFixed(2)}|${t.type}|${t.notes || ''}`));
}
function csvKey(e) { return `${e.date}|${e.amount.toFixed(2)}|${e.type}|${e.notes || ''}`; }

function renderCsvPreview() {
  const cfg = csvConfig();
  const rows = csvDataRows();
  const existing = csvExistingKeys();
  const seen = new Set();
  let ok = 0, dup = 0, unreadable = 0;
  const sample = [];
  rows.forEach(r => {
    const e = csvBuildRow(r, cfg);
    if (!e) { unreadable++; return; }
    const k = csvKey(e);
    if (existing.has(k) || seen.has(k)) { dup++; return; }
    seen.add(k); ok++;
    if (sample.length < 4) sample.push(e);
  });
  const summary = dup
    ? tr('csv_summary_dupes', { ok, dup, skip: unreadable })
    : tr('csv_summary', { ok, skip: unreadable });
  let html;
  if (sample.length) {
    html = sample.map(e => {
      const c = catInfo(e.category);
      const dstr = new Date(e.date + 'T12:00:00').toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit', year: '2-digit' });
      const label = e.notes || c.label;
      return `<div class="csv-prow"><span class="csv-p-left">${dstr} · ${escapeHtml(label)}</span><span class="csv-p-amt ${e.type === 'expense' ? 'exp' : 'inc'}">${e.type === 'expense' ? '-' : '+'} ${fmt(e.amount)}</span></div>`;
    }).join('') + `<div class="csv-summary">${summary}</div>`;
  } else {
    // nothing importable: distinguish "all duplicates" from "columns look wrong"
    const hint = (dup > 0 && unreadable <= dup) ? tr('csv_all_dupes') : tr('csv_none_readable');
    html = `<div class="csv-summary bad">${hint}</div><div class="csv-summary">${summary}</div>`;
  }
  document.getElementById('csv-preview').innerHTML = html;
  document.getElementById('csv-import-btn').disabled = ok === 0;
}

function toggleCsvHeader() {
  const sw = document.getElementById('csv-header-switch');
  sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  openCsvSheet(); // header toggle changes labels + data rows → rebuild
}
function toggleCsvSign() {
  const sw = document.getElementById('csv-sign-switch');
  sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
  renderCsvPreview();
}

function runCsvImport() {
  const cfg = csvConfig();
  const existing = csvExistingKeys();
  const seen = new Set();
  let dup = 0;
  const toAdd = [];
  csvDataRows().forEach(r => {
    const e = csvBuildRow(r, cfg);
    if (!e) return;
    const k = csvKey(e);
    if (existing.has(k) || seen.has(k)) { dup++; return; }
    seen.add(k); toAdd.push(e);
  });
  if (!toAdd.length) { showToast(tr('toast_csv_none')); return; }
  state.transactions.push(...toAdd);
  save();
  closeSheet('sheet-csv');
  showPage('dashboard');
  const msg = dup ? tr('toast_csv_done_dupes', { n: toAdd.length, d: dup })
    : (toAdd.length === 1 ? tr('toast_csv_done_one') : tr('toast_csv_done', { n: toAdd.length }));
  showToast(msg);
}

