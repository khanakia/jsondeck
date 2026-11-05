/// <reference types="vite/client" />

/** package.json's version, put in at build time (vite.shared.ts DEFINE), so it never goes stale. */
declare const __JSONDECK_VERSION__: string
/**
 * Loader build only (vite.loader.config.ts): the chunks dist/chunks/index.js
 * imports statically, relative to dist/, fetched in parallel with it.
 */
declare const __JSONDECK_PRELOAD__: string[]
/**
 * True only in the split build behind the <script> loader (vite.config.ts),
 * where every third-party library comes from the CDN through an import map;
 * false in the single offline file and the ES module (code behind it is removed there).
 */
declare const __JSONDECK_EXTERNALS__: boolean
