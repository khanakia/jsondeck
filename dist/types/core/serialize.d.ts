/**
 * Config → source text for the Code tab. Pure. Functions are shown as their
 * own source (fn.toString()), so a copied snippet still runs. Also builds the
 * complete, copy-pasteable HTML page for an example.
 */
/** A JS object-literal rendering of a value (2-space indent, functions as source). */
export declare function toSource(value: unknown, indent?: number): string;
/** Keep the first `n` rows of every array in the data. */
export declare function trimData(data: unknown, n: number): unknown;
export type SnippetOptions = {
    /** Version on the CDN URLs, without the "v" (served from the GitHub tag v<version> through jsDelivr). */
    version: string;
    /** Rows kept per table in the embedded data. */
    rows?: number | undefined;
};
/** Rows per table in a generated snippet: enough to see the features, short enough to read. */
export declare const SNIPPET_ROWS = 8;
/** A complete HTML page: CDN tags, the data trimmed, and the mount call with the rest of the config. */
export declare function htmlSnippet(config: Record<string, unknown>, opts: SnippetOptions): string;
