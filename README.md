# jsondeck

Turn JSON plus a small config into a compact, power-user dashboard: tables with search, filters, sort, grouping and saved views, charts and stat tiles from the same data, relations between tables, and pages with sections and grids. Load one script from a CDN and call `JsonDeck.mount`.

```html
<link rel="stylesheet" href="dist/jsondeck.css">
<script src="dist/jsondeck.js"></script>

<script type="application/json" id="data">{ "hosts": [ { "ip": "10.0.0.1", "status": "up" } ] }</script>
<div id="app"></div>
<script>
  JsonDeck.mount('#app', { data: '#data' })
</script>
```

With no config, column types, labels, filters and paging are guessed. Every part can be overridden through config, and TypeScript users get a typed `defineConfig(data, config)`.

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

## Status

Built and working, not yet published to npm. See `docs/index.html` for the guides, the feature list and the config reference, and `demo/` for live examples.

- Build: `pnpm install && pnpm build` (writes `dist/jsondeck.js`, `dist/jsondeck.mjs`, `dist/jsondeck.css` and types).
- Type check: `pnpm typecheck`.
- Checks: `scripts/verify*.mjs` (headless browser).

## Next tasks

1. **Make it a proper docs site**:
   - a landing page with a live mini dashboard, a feature grid and a copyable install snippet
   - one shared header on every page: Docs · Components · Examples · Reference, ⌘K search, GitHub link, theme toggle, footer, and a hamburger menu on phones (today the navbar wraps onto three lines at phone width, see the mobile screenshot)
   - a Components section with one page per component (about 35), each with live Preview/Code examples, a generated options table, keyboard notes, related links and previous/next links
   - Examples and Reference (Features, Config reference, API) inside the same site
   - hash routes per page, a 404 page, per-page titles
   - `scripts/verify-site.mjs` that walks every route in light and dark
2. **Publish:** make the GitHub repo public, publish to npm, and serve it from jsdelivr. Then mark the CDN and ESM features stable in `docs-content/features.json`.
3. **Page filter dropdowns:** restyle the page-level filter selects (Severity, Region…) to match the rest of the UI instead of plain browser selects.
4. **Bundle size:** the CDN script is about 226 kB gzipped with React 19 and Base UI bundled; look for ways to trim it.
5. **Saved views by URL:** share a saved view as a link.
6. **Load data from a URL:** today data must be embedded in the page or passed as an object.
