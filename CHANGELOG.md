# Changelog

All notable changes to jsondeck are written down here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html), with patch-only bumps (`0.1.0` → `0.1.1`) unless a bigger bump is decided on.

## [Unreleased]

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
