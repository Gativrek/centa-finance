// backup.js — Toast helper + JSON backup/restore
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Toast ────────────────────────────────────────────────
function showToast(msg, undoFn) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;padding:10px 20px;border-radius:99px;font-size:14px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.4);transition:opacity .3s;display:flex;align-items:center;gap:12px;white-space:nowrap;max-width:90vw';
    document.body.appendChild(t);
  }
  clearTimeout(t._timer);
  t.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = msg;
  t.appendChild(span);
  if (undoFn) {
    const btn = document.createElement('button');
    btn.textContent = 'Undo';
    btn.style.cssText = 'background:var(--accent2);border:none;color:#fff;padding:4px 12px;border-radius:99px;font-size:13px;font-weight:700;cursor:pointer;flex-shrink:0';
    btn.onclick = () => { undoFn(); t.style.opacity = '0'; };
    t.appendChild(btn);
  }
  t.style.opacity = '1';
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, undoFn ? 4000 : 2000);
}

// ── Backup & Restore (JSON file) ─────────────────────────
function backupData() {
  return {
    version: 4,
    exportedAt:       new Date().toISOString(),
    transactions:     state.transactions,
    budgets:          state.budgets,
    goals:            state.goals,
    recurring:        state.recurring,
    recurringLog:     state.recurringLog,
    customCategories: state.customCategories,
  };
}

// Load a parsed backup object into state. Unknown extra fields are ignored, so
// backups from other Centa editions still restore their shared data cleanly.
function applyBackupObject(data) {
  if (!data || !Array.isArray(data.transactions)) return false;
  state.transactions     = data.transactions;
  state.budgets          = data.budgets          || {};
  state.goals            = data.goals            || [];
  state.recurring        = data.recurring        || [];
  state.recurringLog     = data.recurringLog     || {};
  state.customCategories = data.customCategories || { expense: [], income: [] };
  save();
  return true;
}

async function exportBackup() {
  const ok = await saveFile(`finance-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(backupData(), null, 2), 'application/json');
  if (ok) showToast(tr('toast_backup_exported'));
}

function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      if (!applyBackupObject(JSON.parse(evt.target.result))) throw new Error('bad format');
      showPage('dashboard');
      showToast(tr('toast_backup_restored'));
    } catch {
      showToast(tr('toast_invalid_backup'));
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}
