/**
 * CSV utilities used by TableExportButton.
 * Kept dependency-free so they're easy to swap or extend.
 */
export type CsvField<T> = readonly [
    header: string,
    get: (row: T) => string | number | boolean | null | undefined
];
/** Properly quote a CSV cell — wraps in `"…"` and doubles internal quotes
 *  whenever the value contains `"`, `,`, `\r`, or `\n`. */
export declare function csvEscape(v: string | number | boolean | null | undefined): string;
/** Serialize rows into a CSV string. Header row first. */
export declare function rowsToCsv<T>(rows: T[], fields: ReadonlyArray<CsvField<T>>): string;
/** Trigger a browser download of the given CSV string. Safe in SSR (no-op). */
export declare function downloadCsvString(filename: string, csv: string): void;
/** One-shot helper: serialize + download. */
export declare function downloadCsv<T>(filename: string, rows: T[], fields: ReadonlyArray<CsvField<T>>): void;
/** Download rows as pretty JSON (the full filtered rows, every field). */
export declare function downloadJson(filename: string, rows: readonly unknown[]): void;
