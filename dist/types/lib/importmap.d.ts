/**
 * The <script> build loads every third-party library (React, Base UI,
 * react-day-picker, ...) from a public CDN through an import map (see
 * src/externals/ and the loader). These helpers are shared by the loader and
 * by the on-demand parts that preload their CDN files.
 *
 * A host page may define its own import map (for example to use its own
 * React). Its entries always win: the loader only adds the specifiers the
 * page does not map, and nothing here preloads a file of a package the page
 * maps itself, so the page never downloads a second, unused copy.
 */
/** Marks the import map and preload links jsondeck adds, so they are never taken for the page's own. */
export declare const OWN_ATTR = "data-jsondeck";
/** npm package of a bare specifier ("@base-ui/react/menu" -> "@base-ui/react", "react/jsx-runtime" -> "react"). */
export declare function packageOfSpecifier(spec: string): string;
/** npm package of a CDN file URL (".../npm:@base-ui/react@1.9.0/x.mjs" or ".../npm/reselect@5.3.0/+esm"), or null. */
export declare function packageOfUrl(url: string): string | null;
/** Top-level "imports" keys of the import maps the host page defined itself (never jsondeck's own). */
export declare function pageMappedSpecifiers(): Set<string>;
/**
 * Start fetching CDN module files in parallel (`<link rel="modulepreload">`),
 * so a part's whole dependency tree arrives in one round trip instead of one
 * per import level. Skips files of packages the host page maps itself, and
 * files already preloaded.
 */
export declare function preloadExternals(urls: readonly string[]): void;
/**
 * Base UI's ES module files (served as published by the CDN) guard their
 * development-only code with `process.env.NODE_ENV`, which does not exist in a
 * browser, so loading them throws "process is not defined". Bundlers replace
 * that expression at build time; from a CDN nothing does. So, just before
 * Base UI first loads, define a minimal `process` holding only
 * `env.NODE_ENV = "production"`, and only when the page has no `process` of
 * its own (a page that defines one keeps it). React itself only checks
 * `typeof process.emit`, which stays undefined.
 */
export declare function ensureProcessEnv(): void;
