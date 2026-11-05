/**
 * The always-loaded part of copying: the list of copy formats (menus show it)
 * and `copyText`, which writes to the clipboard. The serializers that turn
 * rows into JSON / CSV / TSV / Markdown / text are in clipboard.ts, loaded on
 * demand.
 */
export declare const COPY_FORMATS: readonly ["json", "csv", "tsv", "markdown", "text"];
export type CopyFormat = (typeof COPY_FORMATS)[number];
/** Copy text. Resolves true only when the browser reports the copy worked. */
export declare function copyText(str: string): Promise<boolean>;
