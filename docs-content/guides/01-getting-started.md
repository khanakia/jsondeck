# Getting started

jsondeck turns JSON into a dashboard: tables with search, filters, sort and paging, plus charts and stat tiles. You load one script, point it at your data, and call `JsonDeck.mount`.

:::warning
jsondeck is served from GitHub release tags through jsDelivr; it is not on npm. The URLs below work once v0.1.0 is released; until then, use `dist/jsondeck.js` and `dist/jsondeck.css` from a local build.
:::

## The smallest page

:::steps
1. Add the script (it links the stylesheet itself; linking it yourself, as below, lets it start loading sooner).
2. Put your data in a `<script type="application/json">` tag (or pass an object).
3. Call `JsonDeck.mount` with the element and the data.
:::

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.css">
  <script src="https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v0.1.0/dist/jsondeck.js"></script>
</head>
<body>
  <script type="application/json" id="data">
    { "hosts": [ { "ip": "10.0.0.1", "status": "up", "last_seen": "2026-10-30" },
                 { "ip": "10.0.0.2", "status": "down", "last_seen": "2026-10-12" } ] }
  </script>
  <div id="app"></div>
  <script>
    JsonDeck.mount('#app', { data: '#data' })
  </script>
</body>
</html>
```

## What zero config gives you

Every named array in `data` becomes a table, one tab each. Column types are guessed from the values (number, date, datetime, URL, IP, email, boolean, enum, JSON, long text, text), labels are made from the keys, and every table gets search, filters, multi-sort, pagination, saved views and CSV/JSON export.

:::tip
`data` can be an object of named arrays, a single array (it becomes a table called `rows`), or the selector of a JSON script tag. jsondeck never sends your data anywhere.
:::

## What loads, and when

`jsondeck.js` is a small loader. It fetches the core (React and the table, about 113 kB gzipped) from next to itself, and every other part only when a page uses it: charts and stat tiles when one is on the page, menus and popovers on the first hover or click, the date calendar when a date filter opens, the row drawer, the layout editor, the code view, site search. A plain table page downloads about 115 kB of JavaScript in total.

`JsonDeck.mount` and `JsonDeck.example` can be called right after the script tag: the call waits for the core and returns its handle at once (`handle.ready` resolves once it has rendered). `setTheme`, `pageTheme`, `defineConfig` and `version` work at once too; the rest of the API (`describe`, `htmlSnippet`, `THEME_TOKENS`, ...) is there after `await JsonDeck.ready`.

:::warning
Pages opened straight from disk (`file://`) cannot use `jsondeck.js`: browsers block the module loading it relies on, and it shows a message saying so. Use `jsondeck.full.js` there, the single file with everything (CSS included) that fetches nothing.
:::

## Mount returns issues

`mount` returns `{ unmount, issues }`. `issues` lists config problems (an unknown key, a bad value) with a suggestion; the deck also shows them above the tables and still renders everything that is valid.

```js
const deck = JsonDeck.mount('#app', { data: '#data', tables: { hosts: { pagesize: 10 } } })
console.log(deck.issues) // e.g. a "did you mean pageSize?" hint
```

## Next

Add column settings ([Columns and types](02-columns-and-types.md)) or lay out several components on a page ([Pages, sections and grid](05-pages-sections-grid.md)).
