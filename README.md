# jsondeck

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-informational.svg)](CHANGELOG.md)
[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/khanakia/jsondeck/badge)](https://www.jsdelivr.com/package/gh/khanakia/jsondeck)
[![TypeScript](https://img.shields.io/badge/types-TypeScript-3178c6.svg)](#typescript)

**jsondeck turns JSON into an interactive dashboard with one `<script>` tag.** Give it an array of objects and it builds a compact data table with search, filters, multi-column sort, pagination, grouping, saved views, column controls and copy/export. Add a small config and the same JSON also gives you charts, stat tiles, key-value cards, linked tables (master-detail, drill-down) and multi-page layouts with sections and grids. It is a JSON viewer, a data grid and a dashboard builder loaded from the jsDelivr CDN with one tag, with no build step, no server and no network calls beyond loading itself and its libraries. It loads only what a page uses: a plain table page downloads about 40 kB of jsondeck's own JavaScript plus React (about 70 kB) from a public CDN, and charts, menus or the date calendar, with the libraries they use, load the first time they are needed. For pages opened from disk (`file://`) there is a single offline file, `jsondeck.full.js`.

```html
<script src="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.js"></script>

<script type="application/json" id="data">{ "hosts": [ { "ip": "10.0.0.1", "status": "up" } ] }</script>
<div id="app"></div>
<script>
  JsonDeck.mount('#app', { data: '#data' })
</script>
```

With no config, column types, labels, filters and paging are guessed. Every part can be overridden through config, and TypeScript users get a typed `defineConfig(data, config)`.

## Contents

- [Why jsondeck?](#why-jsondeck)
- [Install](#install)
- [Files and sizes](#files-and-sizes)
- [Browser support](#browser-support)
- [TypeScript](#typescript)
- [Screenshots](#screenshots)
- [FAQ](#faq)
- [Development](#development)
- [How to release](#how-to-release)
- [Next tasks](#next-tasks)
- [Contributing, security and license](#contributing-security-and-license)

## Why jsondeck?

Most JSON that people want to look at (server lists, inventories, audit results, exports from an API) ends up in a hand-written HTML page or a spreadsheet. A hand-written page usually has no filters, breaks on the next data change and is rebuilt from scratch every time. Table libraries fix the table part, but you still write the page, the charts and the glue between them.

jsondeck is for the case where you have JSON and want a usable, good-looking view of it in minutes:

- **Zero config first.** Column types (numbers, dates, booleans, status values, IPs, URLs, tags) are guessed from the data, so `mount('#app', { data })` already gives a full table. Config only changes what the guess got wrong.
- **A dashboard, not only a grid.** Charts, stat tiles, cards and Markdown read the same data as the tables, and clicking a chart filters the page.
- **Power-user tables.** 28px rows, keyboard shortcuts, quick filters, saved views, grouping with totals, right-click copy as JSON, CSV, TSV or Markdown.
- **Small first load.** One script tag; the parts a page does not use are never downloaded. No telemetry, and a single offline file for `file://` pages.
- **Typed.** `defineConfig(data, config)` checks table and column names against your data, so a typo is a type error.

## Install

jsondeck is served from GitHub through jsDelivr. Always pin the version tag (`@v0.1.0`) so a later release never changes your page. It is not on npm; that may come later.

### Script tag (recommended)

```html
<script src="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.js"></script>
```

`jsondeck.js` is a small loader (3.3 kB gzipped) that sets the global `JsonDeck`. It fetches the core (the table) from next to itself, plus every other part only when the page uses it: charts and stat tiles when one is on the page, menus and popovers on the first hover or click, the date calendar when a date filter opens, the row drawer, the layout editor, the code view, site search, saved views, column resize, keyboard shortcuts and the config issue messages (see [Files and sizes](#files-and-sizes)). It also links `jsondeck.css` unless the page already links it; linking it yourself in `<head>` lets it start loading sooner:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.css">
```

#### How loading works

jsondeck's own files hold only jsondeck's code. Every library it uses comes from the public JSPM CDN (`ga.jspm.io`) at the exact version jsondeck was built and tested with, and only when it is needed:

| Library | Version | gzip | Loaded when |
|---|---|---|---|
| `react`, `react-dom`, `scheduler` | 19.3.1, 19.3.1, 0.28.0 | 68.7 kB | the first render (fetched in parallel with the core) |
| `clsx`, `class-variance-authority` | 2.1.1, 0.7.1 | 0.8 kB | the first render (button styles) |
| `@base-ui/react` with `@base-ui/utils`, `@floating-ui/*`, `use-sync-external-store`, `reselect` | 1.9.0, 0.5.0, ... | 110.5 kB in 97 files | the first menu, popover or dialog (hover, focus or click on a toolbar control) |
| `react-day-picker` with `date-fns`, `@date-fns/tz` | 10.0.2, 4.4.0, 1.5.0 | 32.5 kB in 65 files | a date filter is opened |

The loader adds an import map to the page before anything loads. It points each library name (`react`, `@base-ui/react/menu`, ...) at one pinned file, and the CDN files themselves import their dependencies by name, so every module on the page, jsondeck's and the libraries', gets the same single copy of React. The full list is `src/externals/map.gen.ts`, written by `node scripts/gen-externals.mjs` from the versions in `pnpm-lock.yaml`. `reselect` 5.3.0 comes from jsDelivr (`cdn.jsdelivr.net/npm/reselect@5.3.0/+esm`) because JSPM has not built that version; it has no dependencies of its own. Each part's library files are preloaded in parallel the moment the part starts loading, so a deep dependency tree still arrives in about one round trip.

Your page's own import map wins. If the page already maps `react`, `react-dom` (and their `/client` and `/jsx-runtime` entries), jsondeck uses that React and adds only the names the page does not map; map all four at one React 19 version. A page with its own import map needs a browser that accepts more than one import map (Chrome and Edge 133 or later), or must map every name in `src/externals/map.gen.ts` itself.

Base UI's published files check `process.env.NODE_ENV`, which browsers do not have. Before Base UI first loads, jsondeck defines `window.process = { env: { NODE_ENV: "production" } }` if the page has no `process` of its own.

Icons (lucide) stay inside jsondeck's files: they are SVG path data drawn by a few lines of jsondeck's own code, about 4 kB, and from a CDN each icon would be one more request. If a library fails to load, the error is in the browser console.

Calls made right after the tag work: `JsonDeck.mount` and `JsonDeck.example` wait for the core and return their handle at once (`issues` fills in and `handle.ready` resolves once rendered; with a config that has problems, once their messages have loaded too). `setTheme`, `pageTheme`, `defineConfig` and `version` work at once too. The rest of the API (`describe`, `htmlSnippet`, `toSource`, `THEME_TOKENS` and the other constants) is there after `await JsonDeck.ready`; before that it throws an error that says so. Reading `JsonDeck.ready` is what fetches that part, so a page that only mounts never downloads it (`handle.ready` alone does not load it).

### One file, for offline and `file://` pages

```html
<script src="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.full.js"></script>
```

Everything in one file, CSS included: it adds one `<style data-jsondeck>` to the page head (skipped when the page links `jsondeck.css`) and fetches nothing, so it works from a page opened with `file://`. Use it there: browsers block module loading on `file://` pages, so `jsondeck.js` cannot load its parts and shows a message pointing at this file instead. It has React and every library bundled in and never uses the network. It is bigger (238 kB gzipped), since nothing is left out.

### ES module (bring your own React)

`dist/jsondeck.mjs` leaves `react` and `react-dom` (18 or later) to your page or app, so React is not shipped twice. It splits the same way as the script: the core is `dist/esm/core.js` (39.6 kB gzipped without React; it also holds `describe`, the snippet writers and the constants, which ES module users import directly), and the other parts load from `dist/esm/` with plain `import()` when first used. With React from an ESM CDN through an import map (`?external=react` makes react-dom use the same React copy):

```html
<script type="importmap">
{ "imports": {
  "react": "https://esm.sh/react@19.2.0",
  "react/jsx-runtime": "https://esm.sh/react@19.2.0/jsx-runtime",
  "react-dom": "https://esm.sh/react-dom@19.2.0?external=react",
  "react-dom/client": "https://esm.sh/react-dom@19.2.0/client?external=react"
} }
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.css">
<div id="app"></div>
<script type="module">
  import { mount } from 'https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.mjs'
  mount('#app', { data: { hosts: [{ ip: '10.0.0.1', status: 'up' }] } })
</script>
```

Browsers do not run module scripts from `file://`, so the ES module needs a page served over http(s).

## Files and sizes

What a page downloads, measured from the browser's network log by `scripts/verify-cdn.mjs` (gzip level 9, JavaScript only; `jsondeck.css` adds 10.2 kB):

| Page | jsondeck's own files | From the CDN | Total |
|---|---|---|---|
| Plain zero-config table, `jsondeck.js` | 40.1 kB (loader, entry, core) | 69.5 kB (React, React DOM, scheduler, clsx, class-variance-authority) | 109.6 kB |
| The demo dashboard (stat tiles, charts, facets, a table), `jsondeck.js` | 62.5 kB (adds the chart, stat tile, facets, pinning, page filter and header button chunks, the API extras the demo page asks for with `JsonDeck.ready`, and the demo's own nav script) | 69.5 kB | 132.0 kB |
| Any page, `jsondeck.full.js` | 238 kB (everything, React and CSS included) | nothing | 238 kB |

Opening the first menu adds `popups.js` (12.7 kB) and Base UI from the CDN (110.5 kB); opening a date filter adds about 4 kB of calendar chunks and 32.5 kB of react-day-picker and date-fns. The CDN serves each library's whole published entry points, so these are bigger than when the same libraries were bundled and trimmed into jsondeck's own chunks (60.7 kB and 21.9 kB before); a browser that already has those exact CDN files cached from another site does not download them again.

The files:

| File | What it is | gzip |
|---|---|---|
| `dist/jsondeck.js` | the `<script>` loader (global `JsonDeck`) with the import map; fetches what follows from next to itself, and the libraries from the CDN | 3.3 kB |
| `dist/chunks/index.js` + `core.js` + `rolldown-runtime.js` | the core every page loads: the table, config resolution, toolbar (React comes from the CDN) | 37.0 kB |
| `dist/jsondeck.full.js` | the single offline file: everything, React and CSS included, nothing fetched (`file://` pages) | 237.8 kB |
| `dist/jsondeck.css` | the stylesheet (`jsondeck.js` links it unless the page does) | 10.1 kB |
| `dist/jsondeck.mjs` + `dist/esm/core.js` | ES module core, React from your app (Base UI and the calendar libraries are bundled in its on-demand chunks) | 40.1 kB |

The on-demand chunks in `dist/chunks/` (the same split exists in `dist/esm/` for the ES module, where Base UI and the calendar libraries are bundled into `popups.js` and the calendar chunks):

| Chunk | gzip | Loaded when |
|---|---|---|
| `popups.js` + `preload-popups.js` | 13.8 kB | first hover, focus or click on a toolbar control (filter, sort, columns, views, group by, more, export), a column header menu or rows-per-page; a filter pill; the shortcuts dialog. Holds those controls; Base UI (menus, popovers, dialogs) comes from the CDN, and `preload-popups.js` lists its files so they load in parallel |
| `shared-daterangecontrol-datecontrol.js` + `daterangecontrol.js` + `datecontrol.js` + `shared-popups-daterangecontrol.js` + `preload-calendar.js` | 4.5 kB | a date filter is opened (react-day-picker and date-fns come from the CDN) |
| `chartitem.js` + `shared-chartitem-stattile-chart.js` + `shared-chartitem-grouping-keyvaluecard-stattile-chart.js` | 9.5 kB | a chart is on the page (the chart and its page wiring); `stattile.js` (1.2 kB) and `keyvaluecard.js` (1.3 kB) for those widgets |
| `markdown.js` + `shared-codeview-markdown-itemcode.js` + `shared-searchdialog-markdown.js` | 7.5 kB | a Markdown item (callouts, steps, heading anchors, code fences) |
| `shared-codeview-markdown-itemcode.js` + `example.js` / `itemcode.js` | 3.0 kB | a Preview / Code box (`JsonDeck.example`, `code: true`): the code view, highlighter and snippet writer |
| `rowmenu.js` + `shared-copy-rows-rowmenu.js` | 4.1 kB | right-click on a row: the menu, its items and the copy helpers (the copy part also loads when rows are selected) |
| `extras.js` + `shared-extras-explain-issuesbox.js` + `shared-extras-example-itemcode.js` | 4.6 kB | `JsonDeck.ready` is read: `describe`, `htmlSnippet`, `toSource` and the constants (`THEME_TOKENS`, ...) |
| `shared-extras-explain-issuesbox.js` + `issuesbox.js` | 1.9 kB | the config has issues: the sentences with "did you mean", the issues box, mount's `issues` and console warning |
| `viewscontrol.js` | 1.6 kB | the Views button is pointed at or clicked; before the first render when a default view is stored (the table opens on it) |
| `searchdialog.js` | 2.0 kB | decks with site search, once the page is idle |
| `edittools.js` + `shared-edittools-layout-edit.js` | 2.7 kB | the layout editor is switched on |
| `rowfeatures.js` | 1.9 kB | a table with `quickFilters`, or rows get selected (selection bar) |
| `rowdrawer.js` | 1.6 kB | a row or a link to a related row is opened in the drawer |
| `rowdetail.js` | 1.4 kB | a row is expanded (detail fields, nested tables) |
| `grouping.js` | 1.4 kB | a table is grouped (grouping, totals and the group rows) |
| `toast.js` | 1.1 kB | the first toast (after a copy) |
| `toc.js` | 1.1 kB | an "On this page" outline |
| `relations.js` | 0.9 kB | right after the first render of a deck with `relations` |
| `sidebarnav.js` | 0.8 kB | before the first render of a deck with `nav: "sidebar"` |
| `deckbuttons.js` | 0.8 kB | before the first render of a deck with a theme toggle or the layout editor (every deck with `pages`) |
| `facets.js` | 0.8 kB | a facets item or a table's `facets` sidebar |
| `pagefilterbar.js` | 0.7 kB | before the first render of a deck with page `filters` |
| `emptystate.js` | 0.7 kB | a table shows no rows ("No rows" / "No matches") |
| `shortcuts.js` | 0.4 kB | the first key press, or the first click in a table ("/" focuses search even before it arrives) |
| `drag.js` | 0.4 kB | the pointer enters a table header, or the first press on a resize handle or drag of a column |
| `pinning.js` | 0.3 kB | before the first render of a table with pinned columns |
| `shared-*.js` (about a dozen files under 1 kB each) | | small pieces two of the parts above share |

Every file has a `.map` source map beside it, and `dist/types/` holds the type definitions. jsDelivr serves gzip or brotli (brotli is about 15% smaller). Measure with `node scripts/size.mjs`; see what is inside each chunk with `pnpm analyze` and `node scripts/chunk-report.mjs`. React DOM (about 63 kB gzipped) is the largest single download, and it comes from the CDN; jsondeck's own core is the table engine, config resolution and the toolbar.

## Browser support

Current Chrome, Edge, Firefox and Safari: Chrome and Edge 111+, Firefox 128+, Safari 16.4+ (the floor set by Tailwind CSS v4's CSS features and the build target). No Internet Explorer.

## TypeScript

`dist/types/` ships the `.d.ts` files for every public type. `defineConfig(data, config)` infers table and column names from your data, so unknown names fail type checking:

```ts
import { defineConfig, mount } from './jsondeck.mjs'

const hosts = [{ ip: '10.0.0.1', status: 'up', cpu: 12.5 }]
const config = defineConfig({ hosts }, {
  tables: { hosts: { columnOrder: ['ip', 'status', 'cpu'], columns: { cpu: { format: 'number:1' } } } },
})
mount('#app', config)
```

## Screenshots

All screenshots use fake demo data. Regenerate them with `node scripts/screenshots.mjs <preview-url>`.

| Dashboard (light) | Dashboard (dark) |
|---|---|
| ![Dashboard light](screenshots/dashboard-light.png) | ![Dashboard dark](screenshots/dashboard-dark.png) |

| Expanded row with nested drill-down | Right-click menu: copy as JSON / CSV / TSV / Markdown |
|---|---|
| ![Expanded row](screenshots/expanded-row-nested.png) | ![Context menu](screenshots/context-menu.png) |

| Master-detail | Grouped table with totals |
|---|---|
| ![Master-detail](screenshots/master-detail.png) | ![Grouped table](screenshots/grouped-table.png) |

| Quick filters | Layout editor |
|---|---|
| ![Quick filters](screenshots/quick-filters.png) | ![Edit layout](screenshots/edit-layout.png) |

| Charts (light) | Charts (dark) |
|---|---|
| ![Charts light](screenshots/charts-light.png) | ![Charts dark](screenshots/charts-dark.png) |

| Preview / Code examples | Theming: tokens and class names |
|---|---|
| ![Examples](screenshots/examples-preview-code.png) | ![Theming](screenshots/theming-example.png) |

| Docs guide | Features list |
|---|---|
| ![Docs guide](screenshots/docs-guide.png) | ![Features](screenshots/docs-features.png) |

| Mobile |
|---|
| ![Mobile](screenshots/mobile.png) |

## FAQ

**What is jsondeck?**
A JavaScript library that turns JSON data into an interactive dashboard: data tables with filters, sort and pagination, plus charts, stat tiles and linked tables, from one `<script>` tag.

**Do I need React, a bundler or a server?**
No. `jsondeck.js` loads React from a public CDN by itself, and `jsondeck.full.js` has React bundled in; both run on any page, and `jsondeck.full.js` also works on a page opened from disk with `file://` (with no network at all). Only the ES module expects you to provide React.

**Does it send my data anywhere?**
No. jsondeck makes no network calls. Data is read from a `<script type="application/json">` block or an object you pass in, and stays in the page.

**How do I show my JSON as a table with filters?**
Put the JSON in the page, add the script tag and call `JsonDeck.mount('#app', { data: '#data' })`. Every top-level array becomes a table with guessed column types, filters and paging.

**How much data can it handle?**
All rows are held in memory and the table shows one page at a time, so thousands to tens of thousands of rows are the comfortable range. There is no server-side data mode yet, and loading data from a URL is planned.

**Can I change the look?**
Yes: about 40 `--jds-*` color tokens with light and dark sets, 28 class-name slots, a `className` per item, row and cell classes and stable `data-jd` attributes. Dark mode follows `<html data-theme>`.

**Is it free for commercial use?**
Yes. jsondeck is MIT licensed, with no paid edition.

**Why not npm?**
For now jsondeck is published as tagged GitHub releases served by jsDelivr. An npm package may come later.

## Development

```sh
pnpm install
pnpm build        # dist/: jsondeck.js (loader) + chunks/, jsondeck.full.js, jsondeck.mjs + esm/, jsondeck.css, maps, types
pnpm typecheck    # strict TypeScript over src and the typed examples
task verify       # every headless browser check over http and file://
task size         # raw, gzip and brotli per file
```

`task --list` shows every command. The headless checks use Playwright's Chromium; if Chromium needs extra system libraries on your machine, set `LD_LIBRARY_PATH` in a git-ignored `.env.local`. Guides, the feature list and the config reference are in `docs/index.html`; live examples are in `demo/`. Changes per version are in `CHANGELOG.md`.

## How to release

```sh
task release:dry   # version, changelog, build, type check, every check, gitleaks, internal-info scan; nothing is committed
task release       # the same, then asks, commits, tags, pushes and creates the GitHub release
```

- Versions only ever go up by one patch number (`0.1.0`, `0.1.1`, `0.1.2`); `--bump minor` and `--bump major` are refused. The first release is `0.1.0` as written in `package.json`; after that, write the changes under `## [Unreleased]` in `CHANGELOG.md` and the script moves them under the new version.
- `main` never holds `dist/`. The script commits `release: vX.Y.Z` (version and changelog) on `main`, then makes one more commit on top of it, on no branch, that adds the built `dist/`, and points the tag `vX.Y.Z` at that commit. jsDelivr serves `https://cdn.jsdelivr.net/gh/khanakia/jsondeck@vX.Y.Z/dist/...` from the tag.
- The tag commit carries all of `dist/`, including `dist/chunks/` and `dist/esm/`, which `jsondeck.js` and `jsondeck.mjs` load from next to themselves; `task release:dry` lists every file going into the tag.
- It refuses a dirty tree or a branch other than `main`, and it is safe to run again: a tag made but not pushed is pushed, an existing GitHub release is left alone, and a released version is never released twice.
- The internal-info scan reads its patterns from `.git/info/release-denylist` or the `RELEASE_DENYLIST` environment variable.
- There is also a manual-only workflow, `.github/workflows/release.yml` (Actions → Release → Run workflow), which runs `node scripts/release.mjs --yes`.
- `--target cloudflare` (an R2 bucket through env vars) and `--target npm` are optional extra targets; `github` is the default.

## Next tasks

1. **Make it a proper docs site**:
   - a landing page with a live mini dashboard, a feature grid and a copyable install snippet
   - one shared header on every page: Docs · Components · Examples · Reference, ⌘K search, GitHub link, theme toggle, footer, and a hamburger menu on phones (today the navbar wraps onto three lines at phone width, see the mobile screenshot)
   - a Components section with one page per component (about 35), each with live Preview/Code examples, a generated options table, keyboard notes, related links and previous/next links
   - Examples and Reference (Features, Config reference, API) inside the same site
   - hash routes per page, a 404 page, per-page titles
   - `scripts/verify-site.mjs` that walks every route in light and dark
2. **First release:** make the GitHub repo public, run `task release` for `v0.1.0`, check the jsDelivr links, then mark the CDN and ESM features stable in `docs-content/features.json`.
3. **Page filter dropdowns:** restyle the page-level filter selects (Severity, Region…) to match the rest of the UI instead of plain browser selects.
4. **First-load size:** a plain table page downloads about 40 kB of jsondeck's own JavaScript plus about 70 kB of React from the CDN. What is left of our own code is what the first paint uses: config resolution and type guessing, the table, the toolbar, cells, pagination and the page shell. Further savings would come from a smaller calendar of our own (react-day-picker and date-fns are 32.5 kB from the CDN).
5. **Saved views by URL:** share a saved view as a link.
6. **Load data from a URL:** today data must be embedded in the page or passed as an object.

## Contributing, security and license

- Contributing: [CONTRIBUTING.md](CONTRIBUTING.md). Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
- Security issues: please report them privately, as described in [SECURITY.md](SECURITY.md).
- License: [MIT](LICENSE), © 2026 Aman Bansal.
