# Changelog

All notable changes to jsondeck are written down here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html), with patch-only bumps (`0.1.0` → `0.1.1`) unless a bigger bump is decided on.

## [Unreleased]

### Changed

- `jsondeck.js` no longer bundles any library. React, React DOM and the scheduler, Base UI with floating-ui, react-day-picker with date-fns, clsx and class-variance-authority load from the public JSPM CDN (`ga.jspm.io`; `reselect` from jsDelivr) at the exact versions jsondeck is built with, each only when needed: React with the first render, Base UI with the first menu or popover, the calendar libraries when a date filter opens. jsondeck's own JavaScript on a plain table page is about 40 kB (gzip); with React from the CDN the page downloads about 110 kB. The first menu and the first date filter now fetch more than before (the CDN serves whole library entry points), and the CDN files can be shared through the browser cache.
- The loader adds an import map before anything loads, so every module, jsondeck's and the libraries', uses one single React. A page that has its own import map for React keeps its React: jsondeck adds only the names the page does not map (more than one import map needs Chrome or Edge 133 or later).
- Before Base UI first loads, `window.process = { env: { NODE_ENV: "production" } }` is defined if the page has none (Base UI's published files read it).
- `jsondeck.full.js` is unchanged: one file with React and everything bundled, no network, for `file://` pages. `jsondeck.mjs` is unchanged too (React from your app; Base UI and the calendar bundled in its chunks).
- If a library cannot be loaded, the error goes to the browser console (the message inside the mount element is only for `file://` pages, pointing at `jsondeck.full.js`).
- New `task gen:externals` (`scripts/gen-externals.mjs`) rewrites the import map from the installed versions after a dependency changes; the build fails until it is run.
- The core shrank (a plain table page went from 115 kB to 105 kB of JavaScript with React still bundled, before the change above). More of the core loads only when used: the config issue messages and "did you mean" suggestions (only when a config has problems), saved views (on the first hover or click of the Views button), column resize and drag-reorder (when the pointer enters a header), the keyboard shortcuts (on the first key press; "/" still focuses search on the very first press), the right-click menu items and copy helpers, grouping, toasts, the empty-table message, the relation index, chart and facets items, and `describe` / `htmlSnippet` / the constants.
- Parts that change the first paint load before it, so nothing jumps: a stored default saved view (the table now opens on it directly, with no flash of the unfiltered rows), pinned columns, the sidebar navigation, the page filter bar and the header's theme and edit buttons.
- `mount(...).issues` and the console warning fill in when `handle.ready` resolves, also in the ES module and the offline file (the messages are loaded on demand). The deck's issues box is unchanged.
- With the `<script>` loader, `describe`, `htmlSnippet`, `toSource` and the constants need `await JsonDeck.ready` (as documented); `handle.ready` no longer guarantees them.
- Resizing a column now starts from its current width (it used to start from 160px for a column that had not been resized, so the first drag could jump).
- The lucide icons are drawn by a few lines of our own instead of lucide's runtime (same SVG); the class merger's tables list only the utilities jsondeck uses (`scripts/check-merge.mjs` still finds no difference from tailwind-merge).

## [0.1.1] - 2026-11-05

### Changed

- `dist/jsondeck.js` is now a small loader (about 2 kB gzipped) instead of the whole library. It loads the core (React and the table) from `dist/chunks/` next to itself, and every other part only when a page uses it: charts and stat tiles, the menus and popovers (on the first hover or click), the date calendar, the row drawer, expanded rows, the right-click menu and copy formats, the layout editor, the code view, site search and the config issues box. A plain table page now downloads about 115 kB of JavaScript instead of 219 kB.
- `JsonDeck.mount` and `JsonDeck.example` still work right after the script tag: the call waits for the core and returns its handle at once, with a new `ready` promise. `setTheme`, `pageTheme`, `defineConfig` and `version` work at once; the rest of the API is there after the new `JsonDeck.ready` resolves, and throws a clear error before.
- `jsondeck.js` links `jsondeck.css` itself when the page does not, so one tag is enough.
- On pages opened from `file://`, use `dist/jsondeck.full.js` (one file with everything, CSS included). `jsondeck.js` cannot load modules there and shows a message pointing at it.
- `dist/jsondeck.mjs` is split the same way, with its parts in `dist/esm/`.
- Class merging uses a small merger of our own instead of tailwind-merge (same results on every class jsondeck uses, checked by `scripts/check-merge.mjs`); buttons and inputs are plain elements instead of Base UI's.
- `version` comes from `package.json` at build time (it was a literal that a release would not have bumped).

### Removed

- The experimental Preact build.

## [0.1.0] - 2026-11-05

First release.

### Added

- `JsonDeck.mount(el, config)`: turns JSON (embedded in the page or passed as an object) plus an optional config into a dashboard. With no config, every named array becomes a table and column types, labels, filters and paging are guessed.
- Tables with our own engine (no table library): sort, filters with every operator, quick filters (range slider, chips, toggle, search), numbered pagination, saved views with pluggable storage, column show/hide, resize, drag-reorder and pinning, density, row grouping with totals, expandable detail rows, nested drill-down tables, master-detail, links between tables with a row drawer, facets, row selection, a right-click menu (copy as JSON, CSV, TSV, Markdown or text, filter by value, custom row actions) and CSV/JSON export.
- Charts and widgets drawn as SVG: bar, stacked, grouped, line, area, pie, donut, sparkline, stat tiles, key-value cards and safe Markdown with callouts and steps.
- Pages with sections, nested sections, tabs and a column grid; page navigation in the URL hash; a page-level filter bar; click a chart to filter; site search (⌘K); a drag-and-drop layout editor with Copy config.
- Config validation with a "did you mean" issues box, `describe()`, formats, labels for every UI string, custom detectors and column types.
- Theming: 41 `--jds-*` tokens with light and dark sets, 28 class-name slots, `className` per item, `rowClass` / `cellClass`, stable `data-jd` attributes, `palette` and `statusColors`.
- TypeScript: `defineConfig(data, config)` checks table and column names against the data.
- Builds: `dist/jsondeck.js` (script tag, React bundled), `dist/jsondeck.full.js` (one tag, CSS built in), `dist/jsondeck.mjs` (ES module, React 18+ as a peer dependency), `dist/jsondeck.css`, type definitions and source maps. Everything works from `file://` and makes no network calls.
- Distribution: tagged GitHub releases served by jsDelivr (`https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/...`); each tag carries the built `dist/`, which `main` does not. Releases are made with `task release` (patch bumps only).
