import { type Row } from "./field";
import type { CopyFormat } from "./copy";
export { COPY_FORMATS, type CopyFormat, copyText } from "./copy";
/**
 * The part of a column the copier needs. Structural, so the table's resolved
 * columns (core/resolve.ts ResolvedColumn) can be passed in as they are.
 * A string `format` is a named format from formats.ts ("number:2", "bytes").
 */
export type CopyColumn = {
    id: string;
    label?: string | undefined;
    format?: string | ((value: unknown, row: Row) => string) | undefined;
};
export type CopyOptions = {
    /** Header text: column labels (default) or raw ids. JSON keys always use ids unless this is "label". */
    headers?: "label" | "id" | undefined;
    /** Cell values: formatted text like the table shows (default for csv/tsv/markdown/text), or the raw data (default for json). */
    values?: "formatted" | "raw" | undefined;
    /** Only these column ids, in this order. Default: every column given. */
    columns?: string[] | undefined;
};
/** Raw value → plain text: empty for null/undefined, objects and arrays as compact JSON. */
export declare function plainText(v: unknown): string;
/** One cell as text, using the column's format when `formatted`. */
export declare function cellText(row: Row, col: CopyColumn, formatted?: boolean): string;
/** Pretty JSON array. Raw values by default (numbers stay numbers); keys are ids unless headers: "label". */
export declare function toJSON(rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string;
/** RFC 4180 field: quoted when it holds a comma, quote, CR or LF; quotes doubled. */
export declare function csvField(s: string): string;
/** CSV with a header row, CRLF line ends (RFC 4180). */
export declare function toCSV(rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string;
/**
 * TSV for pasting into Google Sheets / Excel. Tabs and line breaks inside a
 * cell would split it into new cells/rows, so they become spaces; a cell
 * starting with a quote is quoted so the sheet does not eat it.
 */
export declare function tsvField(s: string): string;
export declare function toTSV(rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string;
/** Markdown table cell: pipes escaped, line breaks as <br> (GitHub renders it), backslashes kept. */
export declare function mdField(s: string): string;
export declare function toMarkdown(rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string;
/** "Label: value" lines per row, rows separated by one blank line. Empty values show as "–". */
export declare function toKeyValueText(rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string;
/** One entry point for menus: serialize rows in the chosen format. */
export declare function serializeRows(format: CopyFormat, rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string;
