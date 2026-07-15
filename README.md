# Centa

**A private, on-device personal finance tracker.** Log income, expenses and
savings, plan budgets and goals, track recurring subscriptions, and see it all on a
dashboard and in charts — in English or Brazilian Portuguese.

Centa is a plain HTML/CSS/JavaScript web app wrapped as an Android application with
[Capacitor](https://capacitorjs.com/). There is **no framework, no bundler, and no
build step** for the app code — the browser loads the source files directly.

> **Your money, your data, on your device.** All data is stored locally in the
> browser's `localStorage`. There is no server, no account, and no tracking.

---

## Features

- **Transactions** — income, expenses and savings with a fast cents-based amount input
- **Categories** — built-in + your own custom categories, with emoji
- **Budgets** — monthly per-category limits with progress bars
- **Goals** — savings goals with progress tracking
- **Subscriptions** — recurring charges (weekly / monthly / yearly), auto-added each period
- **Charts** — spending by category, savings breakdown, monthly bars
- **Multiple profiles** — keep separate sets of finances (e.g. Personal / Business)
- **Bilingual** — full English and Brazilian Portuguese, switchable in-app
- **Theming** — light / dark / system, with accent colors
- **PIN lock** — optional app lock (PIN stored only as a salted SHA-256 hash)
- **Import / export** — CSV import from a bank statement; JSON backup & restore
- **Offline first** — everything works with no connection

---

## Run it

Because the app is just static files, any static file server works:

```bash
npx serve www        # then open the printed http://localhost:… URL
```

Edit a file in `www/`, refresh the browser. That's the whole loop.

## Build for Android

Centa is a [Capacitor](https://capacitorjs.com/) project. The `android/` folder is
generated (not committed), so add it once, then sync and build:

```bash
npm install
npx cap add android          # first time only — generates the android/ project
npx cap sync android         # copies www/ into the android project
cd android && ./gradlew assembleRelease
```

> Note: "Save to device" export uses a small custom native plugin that isn't part of
> this repo; without it, the app falls back to the system Share sheet (and to a normal
> download in the browser). Everything else runs as-is.

---

## Architecture

Understanding a few things up front makes the whole codebase legible.

### One page, one global scope

The entire UI is a single HTML file (`www/index.html`) — every screen and sheet lives
there, shown and hidden by toggling CSS classes. The JavaScript is split into focused
files under `www/js/`, but they are **not ES modules**: they load as ordinary
`<script>` tags and share one global scope. A function declared in one file is callable
from any other, and from inline `onclick=` handlers in the HTML.

Two rules follow from this:

- **`data.js` loads first** — it defines the `state` object, the category tables and the
  `KEYS` storage map that other files read as they load.
- **`boot.js` loads last** — it's the single `DOMContentLoaded` handler that wires up
  events and renders the first screen.

### The render model

There is no reactivity. The pattern everywhere is:

1. mutate the in-memory `state` object,
2. call `save()` to persist it to `localStorage`,
3. call the relevant `render…()` function, which rebuilds a chunk of DOM from `state`.

### Data & storage

All data lives in `localStorage` as JSON. Every storage key is declared once in the
`KEYS` map in `data.js`. The seven per-profile data stores (transactions, budgets,
goals, subscriptions, categories, and their logs) are namespaced per profile by
`storeKey()` in `profiles.js`, so multiple profiles never collide.

### Module map (`www/js/`)

| File | Responsibility |
|---|---|
| `data.js` | `state` object, category tables, the `KEYS` storage map |
| `i18n.js` | EN/PT translations, `tr()`, category lookups |
| `profiles.js` | Profiles, `save()`/`load()`, per-profile key namespacing |
| `settings.js` | Currency, theme & accent |
| `lock.js` | PIN app lock (salted SHA-256), lock overlay |
| `core.js` | Helpers (money/date/id), balance visibility, navigation |
| `dashboard.js` | Dashboard screen + spending/goal donuts |
| `transactions.js` | Add form + Transactions screen (list, calendar, search) |
| `plan.js` | Goals, budgets, custom categories |
| `charts.js` | Charts screen (Chart.js) + month navigation |
| `backup.js` | Toast helper, JSON backup/restore |
| `csv.js` | CSV import (parse, map columns, preview, dedupe) |
| `recurring.js` | Recurring subscriptions |
| `edit.js` | Emoji picker, edit-transaction modal, onboarding |
| `boot.js` | The single `DOMContentLoaded` init — loads **last** |

### Tech

- Plain HTML + CSS + ES2019-ish JavaScript, no framework, no bundler
- [Chart.js](https://www.chartjs.org/) for charts (loaded via CDN in the browser build)
- [Capacitor 8](https://capacitorjs.com/) to wrap the web app as Android

---

## Project layout

```
www/
  index.html      all screens, sheets and modals
  style.css       all styling (themes, accents, layout)
  js/*.js         the app logic (see module map above)
  manifest.json   PWA manifest (the service worker is intentionally disabled in-app)
capacitor.config.json
package.json
```

---

## Contributing

The app is deliberately simple to hack on: no build step, one file per feature. To add
a feature you typically (1) add a `KEYS` entry if it persists anything, (2) add markup
to `index.html` with `data-i18n` labels, (3) add `en` + `pt` strings to `i18n.js`,
(4) write the logic in the most relevant module, (5) wire events (inline `onclick` or in
`boot.js`), and (6) call the right `render…()`.

Every new user-facing string needs both an English and a Portuguese entry.

---

## License

[MIT](LICENSE) © Gabriel Vieira
