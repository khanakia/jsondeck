/// <reference types="vite/client" />

/** package.json's version, put in at build time (vite.shared.ts DEFINE), so it never goes stale. */
declare const __JSONDECK_VERSION__: string
/**
 * Loader build only (vite.loader.config.ts): the chunks dist/chunks/index.js
 * imports statically, relative to dist/, fetched in parallel with it.
 */
declare const __JSONDECK_PRELOAD__: string[]
