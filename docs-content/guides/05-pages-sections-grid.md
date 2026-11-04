# Pages, sections and the grid

Without `pages`, jsondeck shows one tab per table. With `pages`, you decide what goes where: each page has sections, each section has a grid of items (tables, charts, stat tiles, key-value cards, markdown, facets).

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsondeck@0.1.0/dist/jsondeck.css">
  <script src="https://cdn.jsdelivr.net/npm/jsondeck@0.1.0/dist/jsondeck.js"></script>
</head>
<body>
  <script type="application/json" id="data">{ "findings": [ { "id": "F-1", "severity": "high", "status": "open" } ] }</script>
  <div id="app"></div>
  <script>
    JsonDeck.mount('#app', {
      data: '#data',
      pages: [
        { id: 'overview', title: 'Overview', sections: [
          { title: 'Summary', columns: [2, 1], items: [
            { component: 'chart', table: 'findings', type: 'bar', groupBy: 'status', height: 180 },
            { component: 'stat', table: 'findings', label: 'Findings' }
          ] },
          { title: 'About', collapsible: true, items: [
            { component: 'markdown', text: 'Sections can be **collapsible**, nested, or shown as tabs.' }
          ] }
        ] },
        { id: 'details', title: 'Details', sections: [ { items: [ { component: 'table', table: 'findings' } ] } ] }
      ]
    })
  </script>
</body>
</html>
```

## Pages

- `title` is the nav label; `id` is the URL hash (`#/overview`), made from the title when left out.
- `nav: 'sidebar'` shows pages in a sidebar instead of tabs.
- `filters` adds a page filter bar (see [Filters](03-filters-and-quick-filters.md)).

## Sections

`title`, `description`, `collapsible`, `collapsed`, nested `sections`, and `tabs: true` to show child sections as tabs.

## The grid

`columns` is a count (`3`) or ratios (`[2, 1]`). The grid stacks on narrow screens. Each item can set `span` (grid columns) and `height`.

## Items

Every item has `component` and (except markdown) `table`, the dataset name. Optional for all: `id` (keys its state and saved views; master and targets refer to it), `title`, `span`, `height` and `code`.

A placed table takes any table setting (columns, include, pageSize, groupBy, …) just for that spot, plus `export`, `facets`, `master`, `via` and `whenEmpty`.

:::tip
`code: true` wraps an item in a Preview / Code box that shows its config. For a whole deck, `JsonDeck.example(el, { title, description, config })` does the same and generates a complete HTML page in the Code tab.
:::

## Editing the layout

With `pages` set, the layout is editable by default (`editable: false` turns it off). Press Edit layout to drag items, make them wider, narrower, taller or shorter, add or remove items, or reset; then Copy config puts the new `pages` on your clipboard.
