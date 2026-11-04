# TypeScript and defineConfig

The ES module build ships type definitions for every config type. `defineConfig(data, config)` checks table names against your data and column names against each table's row type, and gives row callbacks the real row type.

:::warning
The npm package is not published yet; the import paths below are the planned ones.
:::

```ts
import { defineConfig, mount } from 'jsondeck'
import 'jsondeck/jsondeck.css'

type Finding = { id: string; severity: 'critical' | 'high' | 'medium' | 'low'; cvss: number; status: string }
const findings: Finding[] = await fetch('/findings.json').then((r) => r.json())

const config = defineConfig({ findings }, {
  tables: {
    findings: {
      columnOrder: ['id', 'severity'],          // 'sevrity' would be a type error
      defaultSort: ['severity', '-cvss'],
      rowClass: (row) => (row.severity === 'critical' ? 'crit' : undefined),
      columns: { cvss: { format: 'number:1', sort: (a, b) => a - b } }
    }
  }
})
mount('#app', config)
```

## What is checked

- Table names in `tables`, and the `table` of every page item.
- Column names in `columns`, `columnOrder`, `include`, `exclude`, `defaultSort`, `defaultFilters` and `search.columns`.
- `row` in `rowClass`, `onRowClick`, `value`, `render`, `link`, `tooltip` and `format` has your row type.

:::tip
For a typed computed column, add the field to the rows before passing them in (`findings.map((f) => ({ ...f, risk: f.cvss * 2 }))`) so it is part of the row type. Row types declared as `type` aliases work as they are; an `interface` needs an index signature.
:::

## Types you can import

Every config type is exported, among them `JsonDeckConfig`, `TableConfig`, `ColumnConfig`, `PageConfig`, `SectionConfig`, `PageItem`, `RelationConfig`, plus `Config`, `RowOf`, `ColumnName` and `ColumnRef` for typed configs.

## describe()

`JsonDeck.describe(data, config)` returns the fully resolved config as plain JSON, in the same shape as the input: copy it, change only what is wrong, and pass it back.
