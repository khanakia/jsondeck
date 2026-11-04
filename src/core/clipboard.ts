/**
 * Copy rows out of a table. The serializers are pure (no DOM); only
 * `copyText` touches the browser.
 *
 *   rows + columns ─ pick columns ─ header (label | id) ─ cell (formatted | raw) ─ JSON / CSV / TSV / Markdown / text
 */
import { BUILTIN_FORMATS, parseFormat } from "./formats"
import { humanize } from "./labels"
import { getField, type Row } from "./aggregate"

export const COPY_FORMATS = ["json", "csv", "tsv", "markdown", "text"] as const
export type CopyFormat = (typeof COPY_FORMATS)[number]

/**
 * The part of a column the copier needs. Structural, so the table's resolved
 * columns (core/resolve.ts ResolvedColumn) can be passed in as they are.
 * A string `format` is a named format from formats.ts ("number:2", "bytes").
 */
export type CopyColumn = {
	id: string
	label?: string | undefined
	format?: string | ((value: unknown, row: Row) => string) | undefined
}

export type CopyOptions = {
	/** Header text: column labels (default) or raw ids. JSON keys always use ids unless this is "label". */
	headers?: "label" | "id" | undefined
	/** Cell values: formatted text like the table shows (default for csv/tsv/markdown/text), or the raw data (default for json). */
	values?: "formatted" | "raw" | undefined
	/** Only these column ids, in this order. Default: every column given. */
	columns?: string[] | undefined
}

// ── cells ───────────────────────────────────────────────────────────────

/** Raw value → plain text: empty for null/undefined, objects and arrays as compact JSON. */
export function plainText(v: unknown): string {
	if (v === null || v === undefined) return ""
	if (typeof v === "object") return JSON.stringify(v)
	return String(v)
}

/** One cell as text, using the column's format when `formatted`. */
export function cellText(row: Row, col: CopyColumn, formatted = true): string {
	const v = getField(row, col.id)
	if (!formatted || col.format === undefined) return plainText(v)
	if (typeof col.format === "function") return col.format(v, row)
	const { name, arg } = parseFormat(col.format)
	const fn = BUILTIN_FORMATS[name]
	return fn ? fn(v, arg, row) : plainText(v)
}

function pickColumns(columns: CopyColumn[], only?: string[]): CopyColumn[] {
	if (!only) return columns
	const byId = new Map(columns.map((c) => [c.id, c]))
	// An id that is not a known column is still copied, raw, so a subset never silently drops data.
	return only.map((id) => byId.get(id) ?? { id })
}

const headerOf = (c: CopyColumn, mode: "label" | "id") => (mode === "id" ? c.id : (c.label ?? humanize(c.id)))

// ── serializers ─────────────────────────────────────────────────────────

/** Pretty JSON array. Raw values by default (numbers stay numbers); keys are ids unless headers: "label". */
export function toJSON(rows: Row[], columns: CopyColumn[], opts: CopyOptions = {}): string {
	const cols = pickColumns(columns, opts.columns)
	const formatted = opts.values === "formatted"
	const keyMode = opts.headers === "label" ? "label" : "id"
	return JSON.stringify(
		rows.map((r) => Object.fromEntries(cols.map((c) => [headerOf(c, keyMode), formatted ? cellText(r, c, true) : (getField(r, c.id) ?? null)]))),
		null,
		2,
	)
}

/** RFC 4180 field: quoted when it holds a comma, quote, CR or LF; quotes doubled. */
export function csvField(s: string): string {
	return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV with a header row, CRLF line ends (RFC 4180). */
export function toCSV(rows: Row[], columns: CopyColumn[], opts: CopyOptions = {}): string {
	const cols = pickColumns(columns, opts.columns)
	const formatted = opts.values !== "raw"
	const lines = [cols.map((c) => csvField(headerOf(c, opts.headers ?? "label"))).join(",")]
	for (const r of rows) lines.push(cols.map((c) => csvField(cellText(r, c, formatted))).join(","))
	return lines.join("\r\n")
}

/**
 * TSV for pasting into Google Sheets / Excel. Tabs and line breaks inside a
 * cell would split it into new cells/rows, so they become spaces; a cell
 * starting with a quote is quoted so the sheet does not eat it.
 */
export function tsvField(s: string): string {
	const flat = s.replace(/[\t\r\n]+/g, " ")
	return flat.startsWith('"') ? `"${flat.replace(/"/g, '""')}"` : flat
}

export function toTSV(rows: Row[], columns: CopyColumn[], opts: CopyOptions = {}): string {
	const cols = pickColumns(columns, opts.columns)
	const formatted = opts.values !== "raw"
	const lines = [cols.map((c) => tsvField(headerOf(c, opts.headers ?? "label"))).join("\t")]
	for (const r of rows) lines.push(cols.map((c) => tsvField(cellText(r, c, formatted))).join("\t"))
	return lines.join("\n")
}

/** Markdown table cell: pipes escaped, line breaks as <br> (GitHub renders it), backslashes kept. */
export function mdField(s: string): string {
	return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>")
}

export function toMarkdown(rows: Row[], columns: CopyColumn[], opts: CopyOptions = {}): string {
	const cols = pickColumns(columns, opts.columns)
	const formatted = opts.values !== "raw"
	const row = (cells: string[]) => `| ${cells.join(" | ")} |`
	const lines = [row(cols.map((c) => mdField(headerOf(c, opts.headers ?? "label")))), row(cols.map(() => "---"))]
	for (const r of rows) lines.push(row(cols.map((c) => mdField(cellText(r, c, formatted)))))
	return lines.join("\n")
}

/** "Label: value" lines per row, rows separated by one blank line. Empty values show as "–". */
export function toKeyValueText(rows: Row[], columns: CopyColumn[], opts: CopyOptions = {}): string {
	const cols = pickColumns(columns, opts.columns)
	const formatted = opts.values !== "raw"
	return rows
		.map((r) =>
			cols
				.map((c) => {
					const t = cellText(r, c, formatted)
					return `${headerOf(c, opts.headers ?? "label")}: ${t === "" ? "–" : t}`
				})
				.join("\n"),
		)
		.join("\n\n")
}

const SERIALIZERS: Record<CopyFormat, (rows: Row[], columns: CopyColumn[], opts?: CopyOptions) => string> = {
	json: toJSON,
	csv: toCSV,
	tsv: toTSV,
	markdown: toMarkdown,
	text: toKeyValueText,
}

/** One entry point for menus: serialize rows in the chosen format. */
export function serializeRows(format: CopyFormat, rows: Row[], columns: CopyColumn[], opts?: CopyOptions): string {
	return SERIALIZERS[format](rows, columns, opts)
}

// ── clipboard ───────────────────────────────────────────────────────────

/** Old path for pages where the async API is missing or refused (file://, older browsers, no focus). */
function legacyCopy(str: string): boolean {
	if (typeof document === "undefined") return false
	const t = document.createElement("textarea")
	t.value = str
	t.setAttribute("readonly", "")
	t.style.position = "fixed"
	t.style.top = "0"
	t.style.left = "0"
	t.style.opacity = "0"
	document.body.appendChild(t)
	const prev = document.activeElement
	try {
		t.select()
		// execCommand is deprecated but is the only synchronous fallback that works from file:// pages.
		return document.execCommand("copy")
	} catch {
		return false
	} finally {
		t.remove()
		if (prev instanceof HTMLElement) prev.focus()
	}
}

/** Copy text. Resolves true only when the browser reports the copy worked. */
export async function copyText(str: string): Promise<boolean> {
	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(str)
			return true
		} catch {
			// Refused (permissions, no focus, insecure context): try the old way below.
		}
	}
	return legacyCopy(str)
}
