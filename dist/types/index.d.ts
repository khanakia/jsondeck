import type { CodeLang } from "./core/highlight";
import type { JsonDeckConfig } from "./core/config";
export type * from "./core/config";
export type { Labels } from "./core/labels";
export type { Issue } from "./core/validate";
export type { ResolvedColumn, ResolvedDeck, ResolvedTable } from "./core/resolve";
/** @deprecated name kept from milestone 1; use JsonDeckConfig. */
export type MountConfig = JsonDeckConfig;
/**
 * What mount / example return. `ready` resolves once it has rendered: at once
 * here; with the <script> loader (dist/jsondeck.js) when the library has
 * loaded, `issues` filling in at that moment.
 */
export type Mounted = {
    unmount: () => void;
    issues: string[];
    ready: Promise<void>;
};
/** Resolves when the whole API is usable: at once here; with the <script> loader, once the library has loaded. */
export declare const ready: Promise<void>;
import { version } from "./version";
export { version };
export declare function mount(el: Element | string, config: JsonDeckConfig): Mounted;
export type ExampleOptions = {
    title?: string | undefined;
    description?: string | undefined;
    /** Mounted in the Preview tab. Without it only the Code tab shows. */
    config?: JsonDeckConfig | undefined;
    /** Code tab text. Default: a complete HTML page (CDN tags, trimmed data, mount call) generated from `config`. */
    code?: string | undefined;
    lang?: CodeLang | undefined;
};
/**
 * A Preview / Code box: the config mounted in Preview, copyable code in Code.
 *
 *   JsonDeck.example("#ex1", { title: "Zero config", config: { data: { hosts } } })
 */
export declare function example(el: Element | string, opts: ExampleOptions): Mounted;
/**
 * The full resolved config as plain JSON (functions left out), in the same
 * shape as the input config: copy it, edit only what is wrong, pass it back.
 */
export declare function describe(data: JsonDeckConfig["data"], config?: Omit<Partial<JsonDeckConfig>, "data">): Record<string, unknown>;
export { BUILTIN_FORMATS } from "./core/formats";
export { DEFAULT_GUESS } from "./core/guess";
export { DEFAULT_ACRONYMS, DEFAULT_LABELS, humanize } from "./core/labels";
export { htmlSnippet, toSource } from "./core/serialize";
export { CLASS_SLOTS, THEME_TOKENS, TOKEN_NAMES, type ClassNames, type ClassSlot, type ThemeTokenName, type ThemeTokens } from "./core/theme-tokens";
export { pageTheme, setTheme, type PageTheme, type ThemeChoice } from "./lib/theme";
export type { CodeLang } from "./core/highlight";
export { defineConfig } from "./core/typed";
export type { AnyData, ColumnName, ColumnRef, Config, RowOf, TypedColumn, TypedItem, TypedPage, TypedSection, TypedTable, TypedTableSettings } from "./core/typed";
