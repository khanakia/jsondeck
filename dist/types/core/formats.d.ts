/**
 * Built-in named formats. Pure. `format: "currency:EUR"` → formats.currency(v, "EUR", row).
 * `config.formats` adds or replaces entries.
 */
import type { FormatFn } from "./config";
export declare const BUILTIN_FORMATS: Record<string, FormatFn>;
/** Split "currency:EUR" into name + argument. */
export declare function parseFormat(spec: string): {
    name: string;
    arg?: string;
};
