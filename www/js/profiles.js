// profiles.js — Multi-profile support: profiles, localStorage persistence (save/load), CRUD
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Profiles ─────────────────────────────────────────────
// Each profile owns an isolated copy of the finance data (transactions, budgets,
// goals, subscriptions, categories, payment methods). Everything else — currency,
// language, theme, PIN, Pro entitlement — stays global across profiles.
//
// Zero-migration namespacing: the DEFAULT profile keeps the original unprefixed
// keys (`ft_transactions`, …), so an existing install's data simply becomes its
// "Personal" profile with nothing moved. Extra profiles suffix their keys with
// `__<profileId>` (e.g. `ft_transactions__prof_ab12`).
const PROFILE_STORES = ['transactions', 'budgets', 'goals', 'recurring', 'recurringLog', 'customCategories'];

function getProfiles() { try { return JSON.parse(localStorage.getItem(KEYS.profiles) || '[]'); } catch { return []; } }
function activeProfileId() { return localStorage.getItem(KEYS.activeProfile) || 'default'; }
function activeProfile() { return getProfiles().find(p => p.id === activeProfileId()) || getProfiles()[0] || null; }
// Storage key for a per-profile store under a given profile id (default = legacy key).
function storeKey(store, id = activeProfileId()) { return id === 'default' ? `ft_${store}` : `ft_${store}__${id}`; }

// Seed the default profile on first run; self-heal a dangling active id. Idempotent.
function ensureProfiles() {
  if (!localStorage.getItem(KEYS.profiles)) {
    localStorage.setItem(KEYS.profiles, JSON.stringify([{ id: 'default', name: tr('personal_profile'), emoji: '👤', color: '#6366f1' }]));
  }
  const profs = getProfiles();
  if (!profs.some(p => p.id === activeProfileId())) {
    localStorage.setItem(KEYS.activeProfile, profs[0] ? profs[0].id : 'default');
  }
}

// ── Persistence ──────────────────────────────────────────
function save() {
  localStorage.setItem(storeKey('transactions'),     JSON.stringify(state.transactions));
  localStorage.setItem(storeKey('budgets'),          JSON.stringify(state.budgets));
  localStorage.setItem(storeKey('goals'),            JSON.stringify(state.goals));
  localStorage.setItem(storeKey('recurring'),        JSON.stringify(state.recurring));
  localStorage.setItem(storeKey('recurringLog'),     JSON.stringify(state.recurringLog));
  localStorage.setItem(storeKey('customCategories'), JSON.stringify(state.customCategories));
}

function load() {
  state.transactions      = JSON.parse(localStorage.getItem(storeKey('transactions'))     || '[]');
  state.budgets           = JSON.parse(localStorage.getItem(storeKey('budgets'))          || '{}');
  state.goals             = JSON.parse(localStorage.getItem(storeKey('goals'))            || '[]');
  state.recurring         = JSON.parse(localStorage.getItem(storeKey('recurring'))        || '[]');
  state.recurringLog      = JSON.parse(localStorage.getItem(storeKey('recurringLog'))     || '{}');
  state.customCategories  = JSON.parse(localStorage.getItem(storeKey('customCategories')) || '{"expense":[],"income":[]}');
}

// ── Profile CRUD + switching ─────────────────────────────
function createProfile(name, emoji) {
  const profs = getProfiles();
  const id = 'prof_' + uid();
  profs.push({ id, name: (name || '').trim() || tr('new_profile'), emoji: emoji || '📊', color: '#6366f1' });
  localStorage.setItem(KEYS.profiles, JSON.stringify(profs));
  switchProfile(id); // new profile has no stored keys yet → load() yields empty state
}

function renameProfile(id, name, emoji) {
  const profs = getProfiles();
  const p = profs.find(x => x.id === id);
  if (!p) return;
  if (name != null) p.name = name.trim() || p.name;
  if (emoji != null) p.emoji = emoji || p.emoji;
  localStorage.setItem(KEYS.profiles, JSON.stringify(profs));
  renderProfilesSheet();
  updateDrawerProfile();
}

function deleteProfile(id) {
  let profs = getProfiles();
  if (profs.length <= 1) return; // never orphan the user — keep at least one profile
  if (!confirm(tr('confirm_del_profile', { name: (profs.find(p => p.id === id) || {}).name || '' }))) return;
  PROFILE_STORES.forEach(store => localStorage.removeItem(storeKey(store, id))); // drop its data
  profs = profs.filter(p => p.id !== id);
  localStorage.setItem(KEYS.profiles, JSON.stringify(profs));
  if (activeProfileId() === id) switchProfile(profs[0].id);
  else { renderProfilesSheet(); updateDrawerProfile(); }
}

function switchProfile(id) {
  if (!getProfiles().some(p => p.id === id)) return;
  localStorage.setItem(KEYS.activeProfile, id);
  load();
  autoAddRecurring();
  rebuildRecCategory();
  renderRecurringList();
  renderRecurringDashboard();
  renderPage(currentPage);
  renderDashboard();
  renderProfilesSheet();
  updateDrawerProfile();
  closeSheet('sheet-profiles');
  closeDrawer();
}

// Reflect the active profile on the drawer chip.
function updateDrawerProfile() {
  const p = activeProfile();
  const emo = document.getElementById('drawer-profile-emoji');
  const nam = document.getElementById('drawer-profile-name');
  if (emo) emo.textContent = p ? p.emoji : '👤';
  if (nam) nam.textContent = p ? p.name : tr('personal_profile');
}

// Render the profile picker list: tap a row to switch; rename / delete controls.
function renderProfilesSheet() {
  const wrap = document.getElementById('profiles-list');
  if (!wrap) return;
  const profs = getProfiles();
  const active = activeProfileId();
  const canDelete = profs.length > 1;
  wrap.innerHTML = profs.map(p => {
    const isActive = p.id === active;
    return `<div class="goal-list-item" style="${isActive ? 'border-color:var(--accent)' : ''}">
      <div style="display:flex;align-items:center;gap:10px">
        <button class="btn btn-outline" style="flex:1;justify-content:flex-start;text-align:left;font-size:15px;padding:10px 12px;${isActive ? 'font-weight:700' : ''}"
          onclick="switchProfile('${p.id}')">
          ${p.emoji} ${escapeHtml(p.name)} ${isActive ? '✓' : ''}
        </button>
        <button class="btn btn-outline" style="font-size:13px;padding:10px 12px" onclick="promptRenameProfile('${p.id}')" aria-label="Rename">✏</button>
        ${canDelete ? `<button class="btn btn-outline" style="font-size:13px;padding:10px 12px;color:var(--red);border-color:var(--red)" onclick="deleteProfile('${p.id}')" aria-label="Delete">🗑</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function promptRenameProfile(id) {
  const p = getProfiles().find(x => x.id === id);
  if (!p) return;
  const name = prompt(tr('profile_name'), p.name);
  if (name == null) return; // cancelled
  renameProfile(id, name, null);
}

function addProfileFromForm(e) {
  e.preventDefault();
  const name  = document.getElementById('prof-name').value.trim();
  const emoji = document.getElementById('prof-emoji').value || '📊';
  if (!name) return;
  createProfile(name, emoji);
  document.getElementById('prof-name').value = '';
  resetEmojiPicker('prof-emoji-picker', 'prof-emoji');
  showToast(tr('toast_profile_added'));
}

