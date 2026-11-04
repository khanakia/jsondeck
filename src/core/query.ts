/**
 * The in-memory query engine. Pure: no React. It replaces the server-paged
 * server layer (useServerQuery + buildWhere → GraphQL `where`): the same
 * FilterCondition / SortRule state is applied straight to the rows.
 *
 *   rows ─ search ─ filters (AND) ─ multi-sort ─ page slice
 */
import type { FilterCondition, FilterFieldType, SortRule } from "../sdt/types"
import type { Comparator, SortKind } from "./config"

export type Row = Record<string, unknown>

/** What the engine needs to know about a field: its filter type and sort order. */
export type FieldInfo = { id: string; type: FilterFieldType; sort?: SortKind | Comparator | undefined; order?: string[] | undefined }

const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)

/** Text a value is searched and compared by: objects as JSON, the rest as strings. */
export function toText(v: unknown): string {
	if (v === null || v === undefined) return ""
	if (typeof v === "object") return JSON.stringify(v)
	return String(v)
}

/** Local calendar day (YYYY-MM-DD) of a date-ish value; "" when not a date. */
export function localDay(v: unknown): string {
	if (isEmpty(v)) return ""
	const s = String(v)
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
	const d = new Date(s)
	if (Number.isNaN(d.getTime())) return ""
	const p = (n: number) => String(n).padStart(2, "0")
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Case-insensitive text test for the text operators. */
function textTest(op: string, cell: unknown, value: unknown): boolean {
	const a = toText(cell).toLowerCase()
	const b = toText(value).toLowerCase()
	switch (op) {
		case "contains": return a.includes(b)
		case "notContains": return !a.includes(b)
		case "eq": return a === b
		case "neq": return a !== b
		case "startsWith": return a.startsWith(b)
		case "endsWith": return a.endsWith(b)
		default: return true
	}
}

function cmp(op: string, a: number | string, b: number | string): boolean {
	switch (op) {
		case "eq": return a === b
		case "neq": return a !== b
		case "gt": return a > b
		case "gte": return a >= b
		case "lt": return a < b
		case "lte": return a <= b
		default: return true
	}
}

/**
 * One condition against one cell. An incomplete condition (no value yet)
 * matches everything, so a half-built filter pill never empties the table.
 */
export function matchCondition(cell: unknown, cond: FilterCondition, type: FilterFieldType): boolean {
	const { operator: op, value } = cond
	if (op === "isNull") return isEmpty(cell)
	if (op === "isNotNull") return !isEmpty(cell)
	if (op === "in" || op === "notIn") {
		const list = Array.isArray(value) ? value.map(String) : []
		if (list.length === 0) return true
		const hit = Array.isArray(cell) ? cell.some((c) => list.includes(toText(c))) : list.includes(toText(cell))
		return op === "in" ? hit : !hit
	}
	if (op === "is" || op === "isNot") {
		if (value === undefined || value === null) return true
		const hit = toText(cell) === String(value)
		return op === "is" ? hit : !hit
	}
	if (value === undefined || value === null || value === "") return true
	switch (type) {
		case "number": {
			const n = typeof cell === "number" ? cell : Number(cell)
			if (isEmpty(cell) || Number.isNaN(n)) return false
			// An empty side is an open range ("≥ min" or "≤ max").
			if (op === "between" && Array.isArray(value)) return (value[0] === "" || value[0] == null || n >= Number(value[0])) && (value[1] === "" || value[1] == null || n <= Number(value[1]))
			return cmp(op, n, Number(value))
		}
		case "date": {
			const d = localDay(cell)
			return d !== "" && cmp(op, d, localDay(value))
		}
		case "date-range": {
			const d = localDay(cell)
			if (!d) return false
			// Before / after one day (the date-range field's lt / gt operators).
			if (op === "lt" || op === "gt") return cmp(op, d, localDay(value))
			const r = value as { from?: string | null; to?: string | null }
			if (r.from && d < localDay(r.from)) return false
			if (r.to && d > localDay(r.to)) return false
			return true
		}
		case "select":
		case "relation":
			return op === "neq" ? toText(cell) !== String(value) : toText(cell) === String(value)
		default:
			return textTest(op, cell, value)
	}
}

/** Global search: any of the given fields contains the query (case-insensitive). */
export function matchSearch(row: Row, query: string, fieldIds: string[]): boolean {
	const q = query.trim().toLowerCase()
	if (!q) return true
	return fieldIds.some((id) => toText(row[id]).toLowerCase().includes(q))
}

/** Comparator for one field; empty values always sort last in either direction. */
function compareField(a: unknown, b: unknown, f: FieldInfo | undefined): number {
	if (typeof f?.sort === "function") return f.sort(a, b)
	if (f?.sort === "number") return Number(a) - Number(b)
	if (f?.sort === "order" && f.order) {
		const ra = f.order.indexOf(toText(a))
		const rb = f.order.indexOf(toText(b))
		return (ra < 0 ? f.order.length : ra) - (rb < 0 ? f.order.length : rb)
	}
	return toText(a).localeCompare(toText(b), undefined, { numeric: true, sensitivity: "base" })
}

/** Stable multi-sort by rules in priority order. */
export function sortRows(rows: Row[], rules: SortRule[], fields: Map<string, FieldInfo>): Row[] {
	if (rules.length === 0) return rows
	return rows
		.map((r, i) => ({ r, i }))
		.sort((x, y) => {
			for (const rule of rules) {
				const a = x.r[rule.fieldId]
				const b = y.r[rule.fieldId]
				const ea = isEmpty(a)
				const eb = isEmpty(b)
				if (ea || eb) {
					if (ea && eb) continue
					return ea ? 1 : -1
				}
				const c = compareField(a, b, fields.get(rule.fieldId))
				if (c !== 0) return rule.direction === "desc" ? -c : c
			}
			return x.i - y.i
		})
		.map((x) => x.r)
}

export type QueryInput = {
	search: string
	searchFields: string[]
	filters: FilterCondition[]
	sort: SortRule[]
	fields: FieldInfo[]
}

/** Search + filters (AND) + sort. Pagination is a slice done by the caller. */
export function applyQuery(rows: Row[], q: QueryInput): Row[] {
	const byId = new Map(q.fields.map((f) => [f.id, f]))
	const out = rows.filter(
		(r) =>
			matchSearch(r, q.search, q.searchFields) &&
			q.filters.every((c) => {
				const f = byId.get(c.fieldId)
				return f ? matchCondition(r[c.fieldId], c, f.type) : true
			}),
	)
	return sortRows(out, q.sort, byId)
}

/**
 * Page numbers to show with "…" gaps: first, last, and a window around the
 * current page. 1-based in and out (pagination is 1-based).
 */
export function pageList(current: number, count: number, siblings = 1): (number | "…")[] {
	if (count <= 0) return []
	const set = new Set<number>([1, count])
	for (let p = current - siblings; p <= current + siblings; p++) if (p >= 1 && p <= count) set.add(p)
	const sorted = [...set].sort((a, b) => a - b)
	const out: (number | "…")[] = []
	sorted.forEach((p, i) => {
		if (i > 0) {
			const gap = p - (sorted[i - 1] ?? p)
			if (gap === 2) out.push(p - 1)
			else if (gap > 2) out.push("…")
		}
		out.push(p)
	})
	return out
}
