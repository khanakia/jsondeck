# Selection and copy

## Selecting rows

`selectable: true` adds a checkbox column and a selection bar. Shift-click selects a range.

```js
tables: { findings: { selectable: true } }
```

## Copying

Selected rows can be copied as:

- JSON (raw values),
- CSV,
- TSV, which pastes cleanly into Google Sheets and Excel,
- a Markdown table,
- key: value text, one block per row.

A toast confirms the copy, or says it failed. Copying works on pages opened from disk too: when the browser refuses the clipboard API, jsondeck falls back to the older copy command.

## The right-click menu

Right-click a row or cell for more actions. The menu works with the keyboard: arrows, Enter, Esc, ← and → for submenus, and typing a letter jumps to an item.

## Your own actions

`rowActions` adds items to the right-click menu. `onSelect` gets the clicked row and the selected rows (or just that row).

```js
tables: { findings: {
  selectable: true,
  rowActions: [{ label: 'Alert the ids', onSelect: (row, rows) => alert(rows.map((r) => r.id).join(', ')) }]
} }
```

:::tip
For downloads instead of the clipboard, use the export menu in the toolbar (current page or all matching rows as CSV, all matching rows as JSON).
:::
