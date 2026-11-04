# Getting started

jsondeck turns JSON into a dashboard: tables with search, filters, sort and paging, plus charts and stat tiles. You load one script, point it at your data, and call `JsonDeck.mount`.

:::warning
jsondeck is served from GitHub release tags through jsDelivr; it is not on npm. The URLs below work once v0.1.0 is released; until then, use `dist/jsondeck.js` and `dist/jsondeck.css` from a local build.
:::

## The smallest page

:::steps
1. Add the stylesheet and the script.
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
`data` can be an object of named arrays, a single array (it becomes a table called `rows`), or the selector of a JSON script tag. The page works opened straight from disk (`file://`): jsondeck makes no network calls.
:::

## Mount returns issues

`mount` returns `{ unmount, issues }`. `issues` lists config problems (an unknown key, a bad value) with a suggestion; the deck also shows them above the tables and still renders everything that is valid.

```js
const deck = JsonDeck.mount('#app', { data: '#data', tables: { hosts: { pagesize: 10 } } })
console.log(deck.issues) // e.g. a "did you mean pageSize?" hint
```

## Next

Add column settings ([Columns and types](02-columns-and-types.md)) or lay out several components on a page ([Pages, sections and grid](05-pages-sections-grid.md)).
