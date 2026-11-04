# Sorting, grouping and views

## Sorting

Each header's menu sorts ascending or descending, and the Sort menu (shortcut S) stacks several rules. Set the starting order with `defaultSort`: `"col"` is ascending, `"-col"` descending, or `{ column, direction }`.

```js
tables: { findings: { defaultSort: ['severity', '-cvss'] } }
```

Enum columns sort by their `order` (severity and p0–p4 orders are known). `sort: false` makes a column unsortable, and `sort: (a, b) => number` compares raw values your way.

## Grouping

`groupBy` groups rows into collapsible group rows, by one column or several. `groupAggregates` shows a subtotal per column in each group row: `count`, `sum`, `avg`, `min` or `max`. Users can change the grouping from the Group by button.

```js
tables: { findings: {
  groupBy: 'severity',
  groupAggregates: { est_cost: 'sum', cvss: 'avg' },
  columns: { est_cost: { format: 'currency:USD' }, cvss: { format: 'number:1' } }
} }
```

## Saved views

A view stores the current filters, sort and columns under a name. Save one from the views menu (shortcut V); views can be favorited, pinned, set as default, updated and deleted. They are stored in this browser (localStorage).

```js
JsonDeck.mount('#app', { data: '#data', views: {} })        // on (the default)
JsonDeck.mount('#app', { data: '#data', views: false })     // off everywhere
JsonDeck.mount('#app', { data: '#data', tables: { logs: { views: false } } }) // off for one table
```

:::tip
`views.storage` plugs in your own store. It must implement list, get, save, delete, setDefault and setFavorite; jsondeck's default is the localStorage one.
:::
