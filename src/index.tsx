/**
 * The public API, as the ES module, the single offline file and the type
 * definitions publish it: the render path (mount.tsx) plus everything else
 * (extras.ts). The split build behind the <script> loader uses split.ts
 * instead, which fetches extras.ts only when asked.
 */
import type { JsonDeckConfig } from "./core/config"

export type * from "./core/config"
export type { Labels } from "./core/labels"
export type { Issue } from "./core/validate"
export type { ResolvedColumn, ResolvedDeck, ResolvedTable } from "./core/resolve"
/** @deprecated name kept from milestone 1; use JsonDeckConfig. */
export type MountConfig = JsonDeckConfig

export { example, type ExampleOptions, mount, type Mounted, ready, version } from "./mount"
export { BUILTIN_FORMATS, CLASS_SLOTS, DEFAULT_ACRONYMS, DEFAULT_GUESS, DEFAULT_LABELS, describe, htmlSnippet, humanize, THEME_TOKENS, TOKEN_NAMES, toSource } from "./extras"
export type { ClassNames, ClassSlot, ThemeTokenName, ThemeTokens } from "./core/theme-tokens"
export { pageTheme, setTheme, type PageTheme, type ThemeChoice } from "./lib/theme"
export type { CodeLang } from "./core/highlight"

export { defineConfig } from "./core/typed"
export type { AnyData, ColumnName, ColumnRef, Config, RowOf, TypedColumn, TypedItem, TypedPage, TypedSection, TypedTable, TypedTableSettings } from "./core/typed"
