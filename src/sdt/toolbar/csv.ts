/**
 * CSV utilities used by TableExportButton.
 * Kept dependency-free so they're easy to swap or extend.
 */

export type CsvField<T> = readonly [
	header: string,
	get: (row: T) => string | number | boolean | null | undefined,
]

/** Properly quote a CSV cell — wraps in `"…"` and doubles internal quotes
 *  whenever the value contains `"`, `,`, `\r`, or `\n`. */
export function csvEscape(
	v: string | number | boolean | null | undefined,
): string {
	const s = v === null || v === undefined ? "" : String(v)
	return /["\r\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Serialize rows into a CSV string. Header row first. */
export function rowsToCsv<T>(
	rows: T[],
	fields: ReadonlyArray<CsvField<T>>,
): string {
	const header = fields.map((f) => csvEscape(f[0])).join(",")
	const body = rows
		.map((r) => fields.map(([, get]) => csvEscape(get(r))).join(","))
		.join("\n")
	return body ? `${header}\n${body}\n` : `${header}\n`
}

/** Trigger a browser download of the given CSV string. Safe in SSR (no-op). */
export function downloadCsvString(filename: string, csv: string): void {
	if (typeof document === "undefined") return
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

/** One-shot helper: serialize + download. */
export function downloadCsv<T>(
	filename: string,
	rows: T[],
	fields: ReadonlyArray<CsvField<T>>,
): void {
	downloadCsvString(filename, rowsToCsv(rows, fields))
}

/** Download rows as pretty JSON (the full filtered rows, every field). */
export function downloadJson(filename: string, rows: readonly unknown[]): void {
	const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	setTimeout(() => URL.revokeObjectURL(url), 0)
}
