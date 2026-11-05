import type { CodeLang } from "./core/highlight";
import type { JsonDeckConfig } from "./core/config";
import { version } from "./version";
export { version };
/**
 * What mount / example return. `issues` lists the config's problems as
 * sentences; it fills in (and the console warning is printed) a moment after
 * the call, once the sentences have loaded, and `ready` resolves then, after
 * the first render. With a valid config `issues` stays empty.
 */
export type Mounted = {
    unmount: () => void;
    issues: string[];
    ready: Promise<void>;
};
/** Resolves when the whole API is usable: at once here; with the <script> loader, once the library has loaded. */
export declare const ready: Promise<void>;
/** Data may be inline or a selector of a <script type="application/json"> tag. */
export declare function resolveData(data: JsonDeckConfig["data"]): unknown;
/** Parsed JSON as config data: an object of arrays, a bare array, or nothing usable ({}). */
export declare function toData(v: unknown): JsonDeckConfig["data"];
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
