// boot.js — App bootstrap — the single DOMContentLoaded init. MUST load last.
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Boot ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ensureProfiles();   // seed the default profile before first load
  load();
  autoAddRecurring(); // auto-insert this month's subscriptions
  initAddPage();

  // Profiles: switcher form + emoji picker + drawer chip
  document.getElementById('profile-form').onsubmit = addProfileFromForm;
  initEmojiPicker('prof-emoji-picker', 'prof-emoji');
  updateDrawerProfile();

  // Nav
  document.querySelectorAll('nav button').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });

  // Floating add button
  document.querySelector('.fab').addEventListener('click', () => showPage('add'));

  // View tabs (List / Calendar)
  document.getElementById('view-list-btn').addEventListener('click', () => setTxView('list'));
  document.getElementById('view-cal-btn').addEventListener('click',  () => setTxView('calendar'));

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => { txFilter = chip.dataset.filter; renderTransactions(); });
  });

  // Goal form
  document.getElementById('goal-form').onsubmit = addGoal;
  initGoalAmountInput();
  initEmojiPicker('goal-emoji-picker', 'goal-emoji');

  // Edit modal
  document.getElementById('edit-expense-btn').onclick = () => setEditType('expense');
  document.getElementById('edit-income-btn').onclick  = () => setEditType('income');
  document.getElementById('edit-savings-btn').onclick = () => setEditType('savings');
  initEditAmountInput();

  // Category form
  document.getElementById('cat-form').onsubmit = addCategory;
  initEmojiPicker('cat-emoji-picker', 'cat-emoji');

  // Recurring / Subscriptions form
  document.getElementById('recurring-form').onsubmit = submitRecurring;
  initRecurringAmountInput();
  initEmojiPicker('rec-emoji-picker', 'rec-emoji');
  rebuildRecCategory();
  populateRecWhenSelects();
  syncRecFrequencyFields();

  // Budget form
  document.getElementById('budget-form').onsubmit = addBudget;

  // Month nav buttons
  document.querySelectorAll('[data-month-delta]').forEach(btn => {
    btn.addEventListener('click', () => changeMonth(+btn.dataset.monthDelta));
  });

  // Backup file input (export/backup/restore are triggered from the utility drawer)
  document.getElementById('restore-file').addEventListener('change', importBackup);

  // CSV import (free): file input + live-preview on any mapping change
  document.getElementById('csv-file').addEventListener('change', handleCsvFile);
  ['csv-col-date', 'csv-col-amount', 'csv-col-desc', 'csv-date-fmt', 'csv-cat-expense', 'csv-cat-income']
    .forEach(id => document.getElementById(id).addEventListener('change', renderCsvPreview));

  // Currency selector (in Settings sheet)
  const curSel = document.getElementById('setting-currency');
  curSel.innerHTML = CURRENCIES.map(c => `<option value="${c.code}">${c.label}</option>`).join('');
  curSel.value = appCurrency;
  curSel.addEventListener('change', () => setCurrency(curSel.value));

  // Language selector (in Settings sheet)
  const langSel = document.getElementById('setting-language');
  langSel.value = appLang;
  langSel.addEventListener('change', () => setLang(langSel.value));

  // Export destination selector (in Settings sheet)
  const expSel = document.getElementById('setting-export');
  expSel.value = exportMode();
  expSel.addEventListener('change', () => localStorage.setItem(KEYS.exportMode, expSel.value));

  // Nuke any stale service workers AND their caches (not needed in native APK)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
  }
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }

  applyTheme();
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (appTheme === 'system') applyTheme(); });

  applyStaticI18n();
  checkOnboarding();
  syncEyeIcon();
  showPage('dashboard');
});
