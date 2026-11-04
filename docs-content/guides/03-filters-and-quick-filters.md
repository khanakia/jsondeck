# Filters and quick filters

Every table has a search box and a Filter button. Filters show as pills above the table; each pill can be edited or removed.

## The filter control per column

The control comes from the column type: text, number, boolean, select, multi-select, date or date-range. You can change it, limit its operators, give fixed options, or turn it off.

```js
columns: {
  status: { filter: { type: 'select', options: ['open', 'fixed', 'accepted'] } },
  cvss: { filter: { type: 'number', operators: ['gte', 'lte', 'between'] } },
  detail: { filter: false }
}
```

Operators by control:

| Control | Operators |
|---|---|
| text | contains, does not contain, is, is not, starts with, ends with, is empty, is not empty |
| number | =, ≠, >, ≥, <, ≤, between, is empty, is not empty |
| boolean | is |
| select | is, is not, is any of, is none of |
| multi-select | is any of, is none of |
| date | on, after, on or after, before, on or before |
| date-range | between, before, after |

Date filters offer presets: today, yesterday, month to date, quarter to date and year to date.

## Search

`search: false` removes the search box; `search: { columns: [...] }` searches only those columns. A column with `search: false` is skipped by the search.

## Default filters

```js
tables: { findings: { defaultFilters: [{ column: 'status', value: ['open'] }] } }
```

## Quick filters

A one-row strip above the table with chips, a min/max range with a slider, a toggle, or a search box. It stays in sync with the filter pills.

```js
tables: { findings: {
  quickFilters: [
    { column: 'severity', kind: 'chips' },
    { column: 'cvss', kind: 'range' },
    { column: 'exploitable', kind: 'toggle', label: 'Exploitable only' }
  ]
} }
```

## Page filters and click-to-filter

On a page, `filters: ['area']` adds a filter bar that applies to every component with that field. Clicking a bar or slice in a chart filters the tables of the same dataset on the page (set `targets` to pick other item ids).

```js
pages: [{ title: 'Filter', filters: ['area'], sections: [{ columns: [1, 2], items: [
  { id: 'by-sev', component: 'chart', table: 'findings', type: 'bar', groupBy: 'severity', horizontal: true },
  { id: 'list', component: 'table', table: 'findings', include: ['id', 'severity', 'area', 'title'] }
] }] }]
```

:::tip
Press `/` to focus the search and `F` to open the filter picker. `Esc` clears the search.
:::
