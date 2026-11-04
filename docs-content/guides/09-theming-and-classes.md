# Theming and classes

## Light and dark

Every deck follows the page theme: `<html data-theme="dark">` (or `class="dark"`), otherwise the OS setting. `JsonDeck.setTheme('light' | 'dark' | 'auto')` switches every deck on the page and remembers the choice; `JsonDeck.pageTheme()` reads the current one.

```js
JsonDeck.setTheme('dark')
JsonDeck.mount('#app', { data: '#data', themeToggle: true })
```

- `theme` on one deck: `inherit` (default, follows the page), `auto` (follows the OS), `light` or `dark` (pinned).
- `themeToggle: true` shows a light/dark switch in that deck.

## Density and toolbar

`density: 'comfortable'` makes rows 36px instead of 28px (globally or per table). `toolbarLabels: true` shows text next to the toolbar icons.

## Your own classes

- `tables.<table>.rowClass(row)` adds a class to a row.
- `tables.<table>.columns.<column>.className` adds a class to a column's cells.

```js
tables: { findings: {
  rowClass: (row) => (row.severity === 'critical' ? 'is-critical' : undefined),
  columns: { title: { className: 'wide-title' } }
} }
```

:::warning
jsondeck's own utility classes are prefixed and marked important, so a plain host rule like `.is-critical td { padding: 20px }` may not win against them. Style colours and backgrounds rather than layout, or use a more specific selector.
:::

## UI text

`labels` replaces any UI string, for translation or wording. Templates use `{from}`, `{to}`, `{total}`, `{n}`, `{shown}` and `{table}`.

```js
labels: { search: 'Rechercher dans {table}…', range: '{from}–{to} sur {total}', noResults: 'Aucun résultat' }
```

## Colour tokens

Colours, radius, font size and row heights are CSS variables on `.jd-root`, named `--jds-<token>`; `JsonDeck.THEME_TOKENS` lists every token with its light and dark default. Set them per mode in config, or override them in your stylesheet:

```js
theme: { mode: 'inherit', light: { primary: '#2563eb', card: '#fffbf5', radius: '10px' }, dark: { primary: '#60a5fa' } }
```

```css
.jd-root { --jds-primary: #2563eb; }
.jd-root.jd-dark { --jds-primary: #60a5fa; }
```

Main tokens: `page`, `card`, `card-border`, `card-shadow` (none by default), `border` (inner dividers), `foreground`, `muted-foreground`, `primary`, `chart-1` to `chart-8`, `good`, `warning`, `serious`, `critical`, `radius`, `font-size`, `row-height` and `sticky-top`.

:::tip
`classNames` adds your classes to named parts (root, card, table, tr, td, badge, …) globally, per table or per item; `cellClass(row, column)` styles single cells; stable `data-jd` attributes such as `[data-jd="card-title"]` let plain CSS target any part. `palette` and `statusColors` set chart and badge colours.
:::
