# Charts and widgets

Charts, stat tiles and key-value cards are page items that read a dataset by name. They are drawn as plain SVG (no chart library), work in light and dark, and use a colour-blind-safe palette.

## Charts

`type` is `bar`, `stacked`, `grouped`, `line`, `area`, `pie`, `donut` or `sparkline`.

```js
items: [
  { component: 'chart', table: 'findings', type: 'bar', groupBy: 'severity', title: 'By severity' },
  { component: 'chart', table: 'findings', type: 'stacked', groupBy: 'area', series: 'status' },
  { component: 'chart', table: 'findings', type: 'line', groupBy: 'first_seen', bucket: 'month' },
  { component: 'chart', table: 'ec2', type: 'donut', groupBy: 'state' }
]
```

- `groupBy`: the category axis (a column, or a function of the row). `bucket` (`day`, `week`, `month`, `year`) turns a date column into time buckets; missing buckets show as zero.
- `series`: a second split, for stacked or grouped bars and one line per value.
- `measure`: `count` (default), `sum:col`, `avg:col`, `min:col`, `max:col`, `distinct:col`, or `{ op, field }`.
- `where`: only rows that match, e.g. `{ status: 'open' }`, `{ severity: ['critical', 'high'] }` or `{ cvss: { op: 'gte', value: 7 } }`.
- `horizontal: true` draws bars left to right, which suits long labels.
- `top` keeps the first N values and folds the rest into Other; `topSeries` does the same for series.
- `sort`: `-value` (default for categories), `value`, `key`, `-key`, or a list of values in order.
- `colors` sets a colour per value (hex or a token name such as `s3` or `critical`); `legend: false` hides the legend.

:::tip
Values like critical, high, medium and low get the status colours automatically, and severity order is used for sorting. Clicking a bar or slice filters the tables of the same dataset on the page.
:::

## Stat tiles

```js
{ component: 'stat', table: 'findings', label: 'Open findings', where: { status: 'open' },
  compare: { status: 'fixed' }, compareLabel: 'vs fixed', upIsGood: false,
  trend: { field: 'first_seen', bucket: 'month' } }
```

`compare` shows the change against a second `where`; `upIsGood` decides whether a rise is green or red. `trend` adds a sparkline. `hint` adds a line of text under the value.

## Key-value cards

A card shows one row as label/value pairs (pick it with `key`, matched against the table's key column; without `key` it shows the first row), plus any aggregates over the table. Use `fields: []` for a card with aggregates only.

```js
{ component: 'kv', table: 'ec2', key: 'i-0abc123', fields: ['name', 'state', 'region'] }
{ component: 'kv', table: 'findings', fields: [], aggregates: [
    { label: 'Total', measure: 'count' },
    { label: 'Average CVSS', measure: 'avg:cvss' } ] }
```

## Markdown

```js
{ component: 'markdown', text: '## Notes\nThis page is **fake data**.' }
```

Headings, bold, italic, code, links, lists, quotes, fenced code and simple tables are supported. Raw HTML is shown as text, and only http, https, mailto, `#` and relative links are kept.

## Facets

A facets item lists the count per value of some columns; clicking a value filters `targets` (default: the tables of the same dataset on the page).

```js
{ component: 'facets', table: 'findings', fields: ['severity', 'area', 'status'] }
```
