// lock.js — PIN app lock: hashing, PIN pad, lock/unlock flow
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── App lock (PIN) ───────────────────────────────────────
// PIN is stored as a salted SHA-256 hash (ft_pinHash + ft_pinSalt), never plaintext.
// Lock keys are device-local prefs — excluded from backup JSON like other ft_ prefs.
let lockOn = localStorage.getItem(KEYS.lockOn) === '1';
let pinFlow = null;   // { mode: 'set'|'change'|'disable', step: 'current'|'new'|'confirm', first }
let lockEntry = '';
let hiddenAt = 0;
const LOCK_GRACE_MS = 60000; // don't re-lock for quick app switches under 60s

async function hashPin(pin, salt) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPin(pin) {
  const salt = localStorage.getItem(KEYS.pinSalt) || '';
  return (await hashPin(pin, salt)) === localStorage.getItem(KEYS.pinHash);
}
async function storePin(pin) {
  const salt = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(KEYS.pinSalt, salt);
  localStorage.setItem(KEYS.pinHash, await hashPin(pin, salt));
}

function buildPinPad(padEl, onKey) {
  padEl.innerHTML = ['1','2','3','4','5','6','7','8','9','','0','⌫']
    .map(k => k === '' ? '<span></span>' : `<button type="button" data-k="${k}">${k}</button>`).join('');
  padEl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => onKey(b.dataset.k)));
}
function renderPinDots(el, n) {
  el.innerHTML = [0, 1, 2, 3].map(i => `<span class="pin-dot${i < n ? ' filled' : ''}"></span>`).join('');
}
function pinShake(dotsEl) {
  renderPinDots(dotsEl, 0);
  dotsEl.classList.remove('shake');
  void dotsEl.offsetWidth; // restart animation
  dotsEl.classList.add('shake');
}

function syncLockUI() {
  const sw = document.getElementById('lock-switch');
  sw.setAttribute('aria-checked', lockOn ? 'true' : 'false');
  document.getElementById('change-pin-btn').style.display = lockOn ? 'block' : 'none';
  document.getElementById('pin-note').style.display = lockOn ? 'block' : 'none';
}

function toggleLock() { openPinSheet(lockOn ? 'disable' : 'set'); }

function openPinSheet(mode) {
  pinFlow = { mode, step: mode === 'set' ? 'new' : 'current', first: '', entry: '' };
  updatePinSheet();
  openSheet('sheet-pin');
}
function cancelPinFlow() { pinFlow = null; closeSheet('sheet-pin'); }

function updatePinSheet() {
  const titles = { current: 'pin_current_title', new: 'pin_set_title', confirm: 'pin_confirm_title' };
  document.getElementById('pin-sheet-title').textContent = tr(titles[pinFlow.step]);
  renderPinDots(document.getElementById('pin-sheet-dots'), pinFlow.entry.length);
}

async function pinSheetKey(k) {
  if (!pinFlow) return;
  if (k === '⌫') pinFlow.entry = pinFlow.entry.slice(0, -1);
  else if (pinFlow.entry.length < 4) pinFlow.entry += k;
  updatePinSheet();
  if (pinFlow.entry.length < 4) return;

  const pin = pinFlow.entry;
  pinFlow.entry = '';
  const dots = document.getElementById('pin-sheet-dots');

  if (pinFlow.step === 'current') {
    if (!(await verifyPin(pin))) { pinShake(dots); return; }
    if (pinFlow.mode === 'disable') {
      lockOn = false;
      localStorage.setItem(KEYS.lockOn, '0');
      localStorage.removeItem(KEYS.pinHash);
      localStorage.removeItem(KEYS.pinSalt);
      syncLockUI();
      cancelPinFlow();
      showToast(tr('toast_lock_off'));
    } else {
      pinFlow.step = 'new';
      updatePinSheet();
    }
  } else if (pinFlow.step === 'new') {
    pinFlow.first = pin;
    pinFlow.step = 'confirm';
    updatePinSheet();
  } else { // confirm
    if (pin !== pinFlow.first) {
      pinFlow.first = '';
      pinFlow.step = 'new';
      updatePinSheet();
      pinShake(dots);
      showToast(tr('pin_mismatch'));
      return;
    }
    await storePin(pin);
    const wasChange = pinFlow.mode === 'change';
    lockOn = true;
    localStorage.setItem(KEYS.lockOn, '1');
    syncLockUI();
    cancelPinFlow();
    showToast(tr(wasChange ? 'toast_pin_changed' : 'toast_pin_set'));
  }
}

function showLock() {
  if (!lockOn) return;
  lockEntry = '';
  renderPinDots(document.getElementById('lock-dots'), 0);
  document.documentElement.classList.add('locked');
}

async function lockKey(k) {
  if (k === '⌫') lockEntry = lockEntry.slice(0, -1);
  else if (lockEntry.length < 4) lockEntry += k;
  const dots = document.getElementById('lock-dots');
  renderPinDots(dots, lockEntry.length);
  if (lockEntry.length < 4) return;
  const pin = lockEntry;
  lockEntry = '';
  if (await verifyPin(pin)) document.documentElement.classList.remove('locked');
  else pinShake(dots);
}

function initLock() {
  // Corrupt/inconsistent state guard: lock flag without a stored PIN would be unopenable
  if (lockOn && !localStorage.getItem(KEYS.pinHash)) {
    lockOn = false;
    localStorage.setItem(KEYS.lockOn, '0');
    document.documentElement.classList.remove('locked');
  }
  buildPinPad(document.getElementById('pin-sheet-pad'), pinSheetKey);
  buildPinPad(document.getElementById('lock-pad'), lockKey);
  syncLockUI();
  if (lockOn) showLock(); // head script already added .locked pre-paint; this resets the dots
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (lockOn && Date.now() - hiddenAt > LOCK_GRACE_MS) showLock();
  });
}

