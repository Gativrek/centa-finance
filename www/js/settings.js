// settings.js — Currency, theme & accent
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Currency ─────────────────────────────────────────────
const CURRENCIES = [
  { code: 'BRL', locale: 'pt-BR', symbol: 'R$', label: 'Brazilian Real — R$' },
  { code: 'USD', locale: 'en-US', symbol: '$',  label: 'US Dollar — $' },
  { code: 'EUR', locale: 'en-IE', symbol: '€',  label: 'Euro — €' },
  { code: 'GBP', locale: 'en-GB', symbol: '£',  label: 'British Pound — £' },
  { code: 'CAD', locale: 'en-CA', symbol: 'C$', label: 'Canadian Dollar — C$' },
  { code: 'AUD', locale: 'en-AU', symbol: 'A$', label: 'Australian Dollar — A$' },
  { code: 'JPY', locale: 'ja-JP', symbol: '¥',  label: 'Japanese Yen — ¥' },
];
let appCurrency = localStorage.getItem(KEYS.currency) || 'BRL';
function currencyConf() { return CURRENCIES.find(c => c.code === appCurrency) || CURRENCIES[0]; }

function setCurrency(code) {
  appCurrency = code;
  localStorage.setItem(KEYS.currency, code);
  renderPage(currentPage);
  renderDashboard();
}

// ── Theme & accent ───────────────────────────────────────
let appTheme  = localStorage.getItem(KEYS.theme)  || 'system';
let appAccent = localStorage.getItem(KEYS.accent) || 'indigo';

function resolveTheme() {
  return appTheme === 'system'
    ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : appTheme;
}

function applyTheme() {
  document.documentElement.dataset.theme  = resolveTheme();
  document.documentElement.dataset.accent = appAccent;
  document.querySelectorAll('#theme-seg button').forEach(b => b.classList.toggle('active', b.dataset.themeMode === appTheme));
  document.querySelectorAll('.accent-dot').forEach(d => d.classList.toggle('active', d.dataset.a === appAccent));
}

function setTheme(mode) { appTheme = mode;  localStorage.setItem(KEYS.theme, mode); applyTheme(); }
function setAccent(a) {
  appAccent = a;
  localStorage.setItem(KEYS.accent, a);
  applyTheme();
}
