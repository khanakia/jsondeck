# Embedding on your site

## Your CSS and jsondeck's do not clash

jsondeck's classes are prefixed, its reset applies only inside the deck, and its utilities are marked important. A host rule such as `table td { padding: 20px }` or `button { background: hotpink }` does not reach the deck, and jsondeck's styles do not leak into your page.

## Works from disk

A page with its data embedded works opened straight from disk (`file://`): no fetch, no dynamic imports, no network calls. Data never leaves the page.

```html
<script type="application/json" id="data">{ "servers": [ { "name": "web-1", "state": "running" } ] }</script>
<div id="app"></div>
<script src="jsondeck.js"></script>
<script>JsonDeck.mount('#app', { data: '#data' })</script>
```

:::tip
Escape `<` in embedded JSON (`<`) so a value containing `</script>` cannot end the tag early.
:::

## Theme sync

Decks follow your site's theme: set `data-theme="dark"` (or `class="dark"`) on `<html>` and every deck switches, because jsondeck watches that attribute. If your site has its own toggle, keep it as the one switch and leave `themeToggle` off; or call `JsonDeck.setTheme('dark' | 'light' | 'auto')`, which writes the attribute and remembers the choice in localStorage (`jsondeck:theme`).

## Several decks on one page

Call `mount` once per element. Each deck keeps its own state; give placed items an `id` so their saved views stay apart.

```js
const a = JsonDeck.mount('#inventory', { data: '#inventory-data' })
const b = JsonDeck.mount('#audit', { data: '#audit-data' })
// later
a.unmount()
```

## Overlays

Menus, tooltips, dialogs and toasts render above everything else on the page (z-index 2147483000 and up), so they are not cut off by your containers.
