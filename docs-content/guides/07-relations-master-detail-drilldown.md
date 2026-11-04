# Relations, master–detail and drill-down

## Relations

A relation says that a value in one table points at a row in another. Cells holding such a value become links, and the row drawer shows related rows in both directions. Arrays work on either side (many-to-many).

```js
JsonDeck.mount('#app', {
  data: '#data',
  relations: [{ from: 'findings.instance_id', to: 'ec2.instance_id', label: 'Instance', reverseLabel: 'Findings' }],
  tables: { ec2: { key: 'instance_id' } }
})
```

:::steps
1. `from` is `table.column` holding the pointer.
2. `to` is `table.column` being pointed at, usually the target table's `key`.
3. `label` names the forward link and `reverseLabel` the way back.
:::

## The row drawer

Clicking a row opens a drawer with every field of the row and its related rows.

## Expandable rows

Set `detail` and rows get a chevron (or press Enter on a row) that opens an inline detail panel. Without `fields`, the panel shows the columns hidden in the table.

```js
tables: { findings: {
  columns: { detail: { hidden: true }, fix_idea: { hidden: true } },
  detail: { columns: 3 }
} }
```

`expand` picks how a row opens: `'inline'` (the default when `detail` is set), `'drawer'`, `false`, or `{ relation }` to expand straight into the rows of one relation. `detail.render` draws the whole panel yourself.

## Nested drill-down

`detail.related: true` shows related rows as nested tables, which expand again (depth-limited).

```js
tables: { ec2: { key: 'instance_id', detail: { related: true, fields: [] } } }
```

## Master–detail

On a page, a table with `master` filters itself to the rows related to what is selected in another table item. A chip shows the filter and clears it.

```js
pages: [{ title: 'Master', sections: [{ columns: 2, items: [
  { id: 'hosts', component: 'table', table: 'ec2' },
  { id: 'issues', component: 'table', table: 'findings', master: 'hosts' }
] }] }]
```

`via` names the relation to use (its label) when there is more than one; `whenEmpty: 'none'` shows no rows until something is selected (default: all rows).
