// edit.js — Emoji picker, edit-transaction modal, onboarding
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Emoji Picker ─────────────────────────────────────────
function initEmojiPicker(pickerId, hiddenInputId) {
  const picker = document.getElementById(pickerId);
  const input  = document.getElementById(hiddenInputId);
  picker.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      picker.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      input.value = btn.dataset.emoji;
    });
  });
}

function resetEmojiPicker(pickerId, hiddenInputId) {
  const picker = document.getElementById(pickerId);
  const btns   = picker.querySelectorAll('.emoji-btn');
  btns.forEach((b, i) => b.classList.toggle('active', i === 0));
  document.getElementById(hiddenInputId).value = btns[0]?.dataset.emoji || '';
}

// Select a specific emoji in a picker (for edit flows); highlights it if present.
function setEmojiPicker(pickerId, hiddenInputId, emoji) {
  const picker = document.getElementById(pickerId);
  picker.querySelectorAll('.emoji-btn').forEach(b => b.classList.toggle('active', b.dataset.emoji === emoji));
  document.getElementById(hiddenInputId).value = emoji;
}

// ── Edit Transaction ─────────────────────────────────────
let editingTxId  = null;
let editRawCents = 0;
let editType     = 'expense';

function openEditModal(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  editingTxId  = id;
  editType     = tx.type;
  editRawCents = Math.round(tx.amount * 100);

  setEditType(tx.type, tx.category);
  document.getElementById('edit-amount').value = fmt(tx.amount);
  document.getElementById('edit-date').value   = tx.date;
  document.getElementById('edit-notes').value  = tx.notes || '';

  // Move-to-profile: only meaningful when more than one profile exists.
  const profs = getProfiles();
  const moveGroup = document.getElementById('edit-move-group');
  if (profs.length > 1) {
    document.getElementById('edit-move-profile').innerHTML =
      profs.map(p => `<option value="${p.id}"${p.id === activeProfileId() ? ' selected' : ''}>${p.emoji} ${escapeHtml(p.name)}</option>`).join('');
    moveGroup.style.display = '';
  } else {
    moveGroup.style.display = 'none';
  }

  document.getElementById('edit-overlay').classList.add('open');
}

function closeEditModal() {
  document.getElementById('edit-overlay').classList.remove('open');
  editingTxId = null;
}

function setEditType(type, selectedCat) {
  editType = type;
  document.getElementById('edit-expense-btn').className = 'type-btn' + (type === 'expense' ? ' active-expense' : '');
  document.getElementById('edit-income-btn').className  = 'type-btn' + (type === 'income'  ? ' active-income'  : '');
  document.getElementById('edit-savings-btn').className = 'type-btn' + (type === 'savings' ? ' active-savings' : '');
  const sel  = document.getElementById('edit-category');
  let   cats = allCats(type);
  if (type === 'savings') {
    const goalCats = state.goals.filter(g => !g.archived).map(g => ({ id: g.id, label: g.name, emoji: g.emoji || '🎯' }));
    cats = [...cats, ...goalCats];
  }
  sel.innerHTML = cats.map(c => `<option value="${c.id}"${c.id === selectedCat ? ' selected' : ''}>${c.emoji} ${c.label}</option>`).join('');
}

function submitEditTx() {
  if (!editingTxId || editRawCents <= 0) { showToast(tr('toast_enter_valid')); return; }
  const tx = state.transactions.find(t => t.id === editingTxId);
  if (!tx) return;
  tx.type     = editType;
  tx.amount   = editRawCents / 100;
  tx.category = document.getElementById('edit-category').value;
  tx.date     = document.getElementById('edit-date').value;
  tx.notes    = document.getElementById('edit-notes').value.trim();
  save();
  closeEditModal();
  renderPage(currentPage);
  showToast(tr('toast_tx_updated'));
}

// Duplicate the transaction being edited: a fresh copy (new id, today's date) so
// repeat purchases are one tap. Opens the copy for immediate tweaking.
function duplicateTx() {
  const tx = state.transactions.find(t => t.id === editingTxId);
  if (!tx) return;
  const copy = { ...tx, id: uid(), date: new Date().toISOString().slice(0, 10) };
  delete copy.recurringId; // a manual copy isn't an auto-billed subscription charge
  state.transactions.push(copy);
  save();
  closeEditModal();
  renderPage(currentPage);
  showToast(tr('toast_tx_duplicated'));
  openEditModal(copy.id);
}

// Move the edited transaction into another profile's data set. The other profile
// isn't loaded in memory, so we write straight to its namespaced store.
function moveTxToProfile(targetId) {
  if (!editingTxId || targetId === activeProfileId()) return;
  const idx = state.transactions.findIndex(t => t.id === editingTxId);
  if (idx < 0) return;
  const tx = state.transactions[idx];
  const key = storeKey('transactions', targetId);
  const targetTxs = JSON.parse(localStorage.getItem(key) || '[]');
  targetTxs.push(tx);
  localStorage.setItem(key, JSON.stringify(targetTxs));
  state.transactions.splice(idx, 1); // remove from the active profile
  save();
  closeEditModal();
  renderPage(currentPage);
  renderDashboard();
  const p = getProfiles().find(x => x.id === targetId);
  showToast(tr('toast_tx_moved', { name: p ? p.name : '' }));
}

function initEditAmountInput() {
  const input = document.getElementById('edit-amount');
  input.addEventListener('beforeinput', e => {
    e.preventDefault();
    switch (e.inputType) {
      case 'deleteContentBackward':
      case 'deleteContentForward':
        editRawCents = Math.floor(editRawCents / 10);
        break;
      case 'insertText':
      case 'insertFromPaste':
        for (const ch of (e.data || '')) {
          if (ch >= '0' && ch <= '9' && editRawCents < 9999999) editRawCents = editRawCents * 10 + parseInt(ch);
        }
        break;
    }
    input.value = editRawCents > 0 ? fmt(editRawCents / 100) : '';
  });
}

// ── Onboarding ───────────────────────────────────────────
function checkOnboarding() {
  if (localStorage.getItem(KEYS.onboarded)) return;
  document.getElementById('onboarding-overlay').style.display = 'flex';
}

function dismissOnboarding() {
  localStorage.setItem(KEYS.onboarded, '1');
  document.getElementById('onboarding-overlay').style.display = 'none';
}

