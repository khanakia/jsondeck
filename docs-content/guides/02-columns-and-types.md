# Columns and types

Column settings live under `tables.<table>.columns.<column>`. Every key is optional; anything you leave out keeps the guessed value.

## Types

Types are guessed, and you can set one yourself. The built-in types are `text`, `longtext`, `number`, `date`, `datetime`, `url`, `ip`, `email`, `boolean`, `enum`, `json` and `mono`. The aliases `badge` (enum), `object` (json) and `string` (text) also work. A plain string is a shorthand for `{ type }`.

```js
JsonDeck.mount('#app', {
  data: '#data',
  tables: {
    findings: {
      key: 'id',
      columnOrder: ['id', 'severity', 'status', 'title'],
      columns: {
        id: { type: 'mono', pin: 'left', link: 'https://tracker.example.test/finding/{id}' },
        severity: { colors: { critical: 'red', high: 'orange', medium: 'amber', low: '#64748b' } },
        status: 'badge',
        detail: { filter: false, tooltip: true, wrap: true }
      }
    }
  }
})
```

## Which columns, in which order

- `columnOrder` puts some columns first; the rest follow in data order.
- `include` keeps only the listed columns; `exclude` drops some.
- `hidden: true` hides a column; users can show it again from the Columns menu (shortcut C).

## Look and feel

- `label`: header text. The default is the key humanized, with words like ID, IP and URL in capitals (change that list with `acronyms`).
- `width`, `minWidth`, `pin` (`left` or `right`), `align` (`left`, `center`, `right`), `wrap`, `className`.
- `tooltip: true` shows the full cell text on hover; a function returns your own text.
- Enum columns render as badges. `colors` maps a value to a tone (`red`, `orange`, `amber`, `green`, `blue`, `violet`, `cyan`, `pink`, `slate`) or any CSS colour. `order` sets the order values sort and list in.
- `link` is a URL template filled from the row (`https://x/{id}`), or a function of the row.

## Formats

`format` takes a named format with an optional argument: `number:2`, `currency:EUR`, `percent`, `bytes`, `relative`, `date`, `datetime`, `json`, `upper`, `lower`. A function `(value, row) => string` also works. Add your own names with the global `formats` key.

```js
columns: {
  cvss: { label: 'CVSS', format: 'number:1' },
  est_cost: { label: 'Est. cost', format: 'currency:USD' },
  first_seen: { label: 'First seen', format: 'relative' }
}
```

## Computed columns

A column name that is not in the data, plus `value(row)`, makes a new column. `tables.<table>.computed` does the same as a separate map.

```js
columns: {
  risk: { label: 'Risk', type: 'number', format: 'number:1',
          value: (row) => ({ critical: 4, high: 3, medium: 2, low: 1 }[row.severity] * row.cvss) }
}
```

## Custom renderers

`render(value, row)` returns text, a DOM node or (with the ES module build) a React element. A DOM node is inserted as is, so you own its safety. `renderers.<type>` replaces the renderer for every column of a type.

## Your own types

A detector claims a column when its test passes on the sample values; a registered type says how to render, filter, sort, align and size it.

```js
JsonDeck.mount('#app', {
  data: '#data',
  guess: { detectors: [{ type: 'instance-id', test: (values) => values.every((v) => /^i-[0-9a-f]{8,}$/.test(String(v))) }] },
  types: {
    'instance-id': {
      render: (v) => { const el = document.createElement('code'); el.textContent = v; return el },
      filter: 'text',
      width: 170
    }
  }
})
```

:::tip
The guesser can be tuned with `guess.enumMaxDistinct`, `guess.enumMaxRatio`, `guess.enumMaxLen`, `guess.longTextLen`, `guess.sampleSize` and `guess.knownOrders` (value sets with a natural order, such as critical…none).
:::
