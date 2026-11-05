// Entry of the split build behind the <script> loader (dist/chunks/index.js):
// the stylesheet, the render path and `loadExtras`. The loader calls
// `loadExtras()` only when `JsonDeck.ready` is read, so a page that just
// mounts never downloads describe, the snippet writers or the constants.
import "./styles.css"

export { example, mount, version } from "./mount"
export { pageTheme, setTheme } from "./lib/theme"
export { defineConfig } from "./core/typed"

/** The rest of the public API (extras.ts), as its own chunk. */
export const loadExtras = () => import("./extras")
