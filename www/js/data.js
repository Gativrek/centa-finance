// data.js — App state object + category definitions (the core data model)
// Part of Centa. Loaded as a plain <script> (no bundler); all files share global scope.

// ── Storage keys (the persistence contract) ──────────────
// The complete list of localStorage keys this app owns. Read/write everywhere
// via KEYS.<name> — never re-type the raw 'ft_…' string. Keeping the values
// stable matters: existing installs store their data under these exact keys.
//
// Two families of persisted data:
//   1. Singleton settings/flags below — one value each, global to the app.
//   2. Per-PROFILE data stores (transactions, budgets, goals, …) — NOT here.
//      Those keys are built at runtime by storeKey() in profiles.js as
//      `ft_<store>` (default profile) or `ft_<store>__<profileId>`, driven by
//      the PROFILE_STORES array. See profiles.js for that half of the contract.
//
// NOTE: index.html has a tiny inline <head> script that reads ft_theme /
// ft_accent / ft_lockOn as raw literals BEFORE these modules load (to paint
// the theme with no flash). Those three literals intentionally mirror KEYS
// below — if you ever rename one, update index.html too.
const KEYS = {
  // Localization & display
  lang:              'ft_lang',
  currency:          'ft_currency',
  theme:             'ft_theme',
  accent:            'ft_accent',
  balanceHidden:     'ft_balanceHidden',
  exportMode:        'ft_exportMode',
  dashGoalId:        'ft_dashGoalId',
  onboarded:         'ft_onboarded',
  // Profiles (which profile is active + the profile list; per-profile DATA
  // stores are handled by storeKey()/PROFILE_STORES in profiles.js)
  profiles:          'ft_profiles',
  activeProfile:     'ft_activeProfile',
  // PIN app lock
  lockOn:            'ft_lockOn',
  pinHash:           'ft_pinHash',
  pinSalt:           'ft_pinSalt',
};

// ── State ────────────────────────────────────────────────
let state = {
  transactions: [],
  budgets: {},
  goals: [],
  recurring:        [],   // subscription definitions
  recurringLog:     {},   // { 'rec_id': ['2026-05', ...] } — months already auto-added
  customCategories: { expense: [], income: [] },
  currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
};

const CATEGORIES = {
  expense: [
    { id: 'food',          label: 'Food & Dining',    emoji: '🍔' },
    { id: 'housing',       label: 'Housing & Rent',   emoji: '🏠' },
    { id: 'transport',     label: 'Transport',         emoji: '🚗' },
    { id: 'entertainment', label: 'Entertainment',     emoji: '🎮' },
    { id: 'healthcare',    label: 'Healthcare',        emoji: '💊' },
    { id: 'shopping',      label: 'Shopping',          emoji: '🛍️' },
    { id: 'utilities',     label: 'Utilities',         emoji: '⚡' },
    { id: 'education',     label: 'Education',         emoji: '📚' },
    { id: 'other',         label: 'Other',             emoji: '📦' },
  ],
  income: [
    { id: 'salary',     label: 'Salary',       emoji: '💼' },
    { id: 'freelance',  label: 'Freelance',    emoji: '💻' },
    { id: 'gift',       label: 'Gift',         emoji: '🎁' },
    { id: 'other_inc',  label: 'Other',        emoji: '💰' },
  ],
  savings: [
    { id: 'invest',    label: 'Investments',    emoji: '📈' },
    { id: 'emergency', label: 'Emergency Fund', emoji: '🛡️' },
    { id: 'retire',    label: 'Retirement',     emoji: '🏖️' },
    { id: 'gen_save',  label: 'General Savings',emoji: '🏦' },
  ],
};

