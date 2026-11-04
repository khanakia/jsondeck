/**
 * Aggregation for charts and stat tiles. Pure: no React, no DOM.
 *
 *   rows ─ where ─ group (key × optional series) ─ measure ─ sort ─ top-N + "Other"
 *
 * Filtering reuses the table engine's operators (`matchCondition` from
 * query.ts), so a chart `where` and a table filter mean exactly the same thing.
 */
import type { FilterFieldType, FilterOperator } from "../sdt/types"
import { localDay, matchCondition, type Row, toText } from "./query"

export type { Row }

/** Label used for a missing / empty group value. */
export const EMPTY_KEY = "(empty)"
/** Label of the bucket that collects everything past top-N. */
export const OTHER_KEY = "Other"
/** Upper bound on generated time buckets, so a bad date (year 1) cannot allocate millions of keys. */
const MAX_TIME_BUCKETS = 5000

// ── where ────────────────────────────────────────────────────────────────

/**
 * One `where` entry. A scalar means "is", an array means "is any of",
 * an object picks an operator from query.ts (`gt`, `contains`, `between`, …).
 * `type` overrides the guessed comparison type (number / date / text).
 */
export type WhereClause = unknown | unknown[] | { op: FilterOperator; value?: unknown; type?: FilterFieldType }
/** Field (dot path allowed) → clause. All entries must match (AND). */
export type Where = Record<string, WhereClause>

const RE_DATEISH = /^\d{4}-\d{2}-\d{2}/

function isOpClause(c: unknown): c is { op: FilterOperator; value?: unknown; type?: FilterFieldType } {
	return c !== null && typeof c === "object" && !Array.isArray(c) && "op" in c && typeof c.op === "string"
}

/** Comparison type for an operator clause when the caller did not give one. */
function guessClauseType(value: unknown): FilterFieldType {
	const v = Array.isArray(value) ? value[0] : value
	if (typeof v === "number") return "number"
	if (typeof v === "string" && RE_DATEISH.test(v)) return "date"
	return "text"
}

/** Read a field by name, falling back to a dot path (`tags.env`) when no flat key matches. */
export function getField(row: Row, field: string): unknown {
	if (field in row) return row[field]
	if (!field.includes(".")) return undefined
	let cur: unknown = row
	for (const part of field.split(".")) {
		if (cur === null || typeof cur !== "object") return undefined
		const next: unknown = Reflect.get(cur, part)
		cur = next
	}
	return cur
}

/** Compile a `where` into a row predicate once (cheap to call per row). */
export function compileWhere(where: Where | undefined): (row: Row) => boolean {
	const entries = Object.entries(where ?? {})
	if (entries.length === 0) return () => true
	const tests = entries.map(([field, clause]) => {
		if (isOpClause(clause)) {
			const cond = { id: field, fieldId: field, operator: clause.op, value: clause.value }
			const type = clause.type ?? guessClauseType(clause.value)
			return (r: Row) => matchCondition(getField(r, field), cond, type)
		}
		if (Array.isArray(clause)) {
			const cond = { id: field, fieldId: field, operator: "in" as const, value: clause.map(String) }
			return (r: Row) => matchCondition(getField(r, field), cond, "select")
		}
		const cond = { id: field, fieldId: field, operator: "is" as const, value: clause === null ? null : String(clause) }
		if (clause === null) return (r: Row) => matchCondition(getField(r, field), { ...cond, operator: "isNull" }, "text")
		return (r: Row) => matchCondition(getField(r, field), cond, "text")
	})
	return (r) => tests.every((t) => t(r))
}

/** Rows matching a `where`. Returns the input array itself when there is nothing to filter. */
export function filterRows(rows: Row[], where?: Where): Row[] {
	if (!where || Object.keys(where).length === 0) return rows
	const ok = compileWhere(where)
	return rows.filter(ok)
}

// ── keys and buckets ────────────────────────────────────────────────────

export const TIME_BUCKETS = ["day", "week", "month", "year"] as const
export type TimeBucket = (typeof TIME_BUCKETS)[number]

/** A group key: a field name (dot path ok) or a function of the row. */
export type KeyFn = string | ((row: Row) => unknown)

const pad = (n: number) => String(n).padStart(2, "0")

/** ISO week label (`2026-W05`) of a local YYYY-MM-DD day. */
function isoWeek(ymd: string): string {
	const [y = 1970, m = 1, d = 1] = ymd.split("-").map(Number)
	const date = new Date(Date.UTC(y, m - 1, d))
	const dow = date.getUTCDay() || 7
	date.setUTCDate(date.getUTCDate() + 4 - dow) // Thursday of this week decides the year
	const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1)
	const week = Math.ceil(((date.getTime() - yearStart) / 864e5 + 1) / 7)
	return `${date.getUTCFullYear()}-W${pad(week)}`
}

/** Bucket label of a date-ish value; "" when the value is not a date. Local calendar, like the table filters. */
export function timeBucket(v: unknown, bucket: TimeBucket): string {
	const day = localDay(v)
	if (!day) return ""
	switch (bucket) {
		case "day": return day
		case "week": return isoWeek(day)
		case "month": return day.slice(0, 7)
		case "year": return day.slice(0, 4)
	}
}

/** Every bucket between the first and last key, so a line chart shows gaps as zero instead of joining across them. */
function fillTimeBuckets(keys: string[], bucket: TimeBucket): string[] {
	if (keys.length < 2) return keys
	const sorted = [...keys].sort()
	const first = sorted[0]
	const last = sorted[sorted.length - 1]
	if (first === undefined || last === undefined) return keys
	const out: string[] = []
	if (bucket === "year") {
		for (let y = Number(first); y <= Number(last) && out.length < MAX_TIME_BUCKETS; y++) out.push(String(y))
		return out
	}
	if (bucket === "month") {
		let [y = 1970, m = 1] = first.split("-").map(Number)
		const [ly = y, lm = m] = last.split("-").map(Number)
		while ((y < ly || (y === ly && m <= lm)) && out.length < MAX_TIME_BUCKETS) {
			out.push(`${y}-${pad(m)}`)
			m++
			if (m > 12) { m = 1; y++ }
		}
		return out
	}
	// day and week: walk days from the first bucket's start.
	const start = bucket === "day" ? first : null
	const set = new Set<string>()
	const d0 = start ? new Date(`${start}T00:00:00Z`) : weekStart(first)
	const endKey = last
	for (let i = 0; i < MAX_TIME_BUCKETS * 7; i++) {
		const d = new Date(d0.getTime() + i * 864e5)
		const day = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
		const k = bucket === "day" ? day : isoWeek(day)
		if (!set.has(k)) { set.add(k); out.push(k) }
		if (k === endKey || out.length >= MAX_TIME_BUCKETS) break
	}
	return out
}

/** Monday (UTC date) of an ISO week label. */
function weekStart(label: string): Date {
	const [y = 1970, w = 1] = label.split("-W").map(Number)
	const jan4 = new Date(Date.UTC(y, 0, 4))
	const dow = jan4.getUTCDay() || 7
	return new Date(jan4.getTime() + ((w - 1) * 7 - (dow - 1)) * 864e5)
}

function keyValues(row: Row, key: KeyFn, bucket?: TimeBucket): string[] {
	const raw = typeof key === "function" ? key(row) : getField(row, key)
	// Array values count once per element (a host with three tags is in three groups).
	const list = Array.isArray(raw) ? (raw.length ? raw : [null]) : [raw]
	return list.map((v) => {
		if (bucket) return timeBucket(v, bucket) || EMPTY_KEY
		const s = toText(v)
		return s === "" ? EMPTY_KEY : s
	})
}

/** Plain grouping: key → rows (array values put the row in every group they name). Insertion order. */
export function groupBy(rows: Row[], key: KeyFn, bucket?: TimeBucket): Map<string, Row[]> {
	const out = new Map<string, Row[]>()
	for (const r of rows) {
		for (const k of keyValues(r, key, bucket)) {
			const g = out.get(k)
			if (g) g.push(r)
			else out.set(k, [r])
		}
	}
	return out
}

// ── measures ────────────────────────────────────────────────────────────

export const MEASURE_OPS = ["count", "sum", "avg", "min", "max", "distinct"] as const
export type MeasureOp = (typeof MEASURE_OPS)[number]
/** `"count"`, `"sum:cost"`, or `{ op, field }`. `distinct` counts distinct values of `field`. */
export type Measure = "count" | `${MeasureOp}:${string}` | { op: MeasureOp; field?: string }

/** `seen` exists only for distinct counts. */
type Acc = { n: number; sum: number; min: number; max: number; seen: Set<string> | undefined }
const newAcc = (distinct: boolean): Acc => ({ n: 0, sum: 0, min: Infinity, max: -Infinity, seen: distinct ? new Set() : undefined })

/** Normalise the shorthand forms into `{ op, field }`. Unknown ops fall back to count. */
export function parseMeasure(m: Measure | undefined): { op: MeasureOp; field?: string } {
	if (!m || m === "count") return { op: "count" }
	if (typeof m === "object") return MEASURE_OPS.includes(m.op) ? m : { op: "count" }
	const i = m.indexOf(":")
	const name = m.slice(0, i)
	const op = MEASURE_OPS.find((o) => o === name)
	return op ? { op, field: m.slice(i + 1) } : { op: "count" }
}

function addToAcc(acc: Acc, row: Row, op: MeasureOp, field?: string) {
	if (op === "count") { acc.n++; return }
	const v = field ? getField(row, field) : undefined
	if (op === "distinct") {
		const vals = Array.isArray(v) ? v : [v]
		for (const x of vals) { const s = toText(x); if (s !== "") acc.seen?.add(s) }
		return
	}
	const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : Number.NaN
	if (Number.isNaN(n)) return // non-numbers are skipped, not counted as 0
	acc.n++
	acc.sum += n
	if (n < acc.min) acc.min = n
	if (n > acc.max) acc.max = n
}

function mergeAcc(into: Acc, from: Acc) {
	into.n += from.n
	into.sum += from.sum
	into.min = Math.min(into.min, from.min)
	into.max = Math.max(into.max, from.max)
	if (from.seen) for (const s of from.seen) into.seen?.add(s)
}

function accValue(acc: Acc, op: MeasureOp): number {
	switch (op) {
		case "count": return acc.n
		case "sum": return acc.sum
		case "avg": return acc.n ? acc.sum / acc.n : 0
		case "min": return acc.n ? acc.min : 0
		case "max": return acc.n ? acc.max : 0
		case "distinct": return acc.seen?.size ?? 0
	}
}

/** One measure over all rows (stat tiles). */
export function measure(rows: Row[], m?: Measure, where?: Where): number {
	const { op, field } = parseMeasure(m)
	const acc = newAcc(op === "distinct")
	for (const r of filterRows(rows, where)) addToAcc(acc, r, op, field)
	return accValue(acc, op)
}

// ── aggregate ───────────────────────────────────────────────────────────

/**
 * - `"value"` / `"-value"`: by total, ascending / descending (default for categories: descending);
 * - `"key"` / `"-key"`: by label (default for time buckets: ascending);
 * - a string array: that order first (e.g. severity), unknown values after, by total.
 */
export type SortSpec = "value" | "-value" | "key" | "-key" | string[]

export type AggregateSpec = {
	/** Category axis. Omit for a single "All" group. */
	groupBy?: KeyFn | undefined
	/** Bucket the groupBy values as dates. */
	bucket?: TimeBucket | undefined
	/** Second split (stacked / grouped bars, multi-line). */
	series?: KeyFn | undefined
	measure?: Measure | undefined
	where?: Where | undefined
	sort?: SortSpec | undefined
	/** Keep the first N keys after sorting and fold the rest into "Other". Ignored for time buckets. */
	top?: number | undefined
	/** Same for series. */
	topSeries?: number | undefined
	/** Fill missing time buckets with 0 (default true when `bucket` is set). */
	fill?: boolean | undefined
}

/** keys × series matrix: `cells[k][s]`. `series` is `["value"]` when there is no split. */
export type AggResult = { keys: string[]; series: string[]; cells: number[][]; totals: number[]; seriesTotals: number[] }

export const SINGLE_SERIES = "value"

function orderKeys(keys: string[], totals: Map<string, number>, sort: SortSpec | undefined, isTime: boolean): string[] {
	const byTotal = (a: string, b: string) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0)
	const byKey = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
	const s = sort ?? (isTime ? "key" : "-value")
	if (Array.isArray(s)) {
		const rank = new Map(s.map((k, i) => [k, i]))
		return [...keys].sort((a, b) => {
			const ra = rank.get(a) ?? Infinity
			const rb = rank.get(b) ?? Infinity
			return ra !== rb ? ra - rb : byTotal(a, b)
		})
	}
	switch (s) {
		case "value": return [...keys].sort((a, b) => -byTotal(a, b))
		case "-value": return [...keys].sort(byTotal)
		case "key": return [...keys].sort(byKey)
		case "-key": return [...keys].sort((a, b) => -byKey(a, b))
	}
	return keys
}

/** Group, measure, sort and fold. One pass over the rows; fine for 50k rows. */
export function aggregate(rows: Row[], spec: AggregateSpec = {}): AggResult {
	const { op, field } = parseMeasure(spec.measure)
	const distinct = op === "distinct"
	const src = filterRows(rows, spec.where)
	const cell = new Map<string, Map<string, Acc>>() // key → series → acc
	for (const r of src) {
		const ks = spec.groupBy === undefined ? ["All"] : keyValues(r, spec.groupBy, spec.bucket)
		const ss = spec.series === undefined ? [SINGLE_SERIES] : keyValues(r, spec.series)
		for (const k of ks) {
			let row = cell.get(k)
			if (!row) { row = new Map(); cell.set(k, row) }
			for (const s of ss) {
				let acc = row.get(s)
				if (!acc) { acc = newAcc(distinct); row.set(s, acc) }
				addToAcc(acc, r, op, field)
			}
		}
	}

	// Totals per key / series are measured from merged accumulators, so avg/min/max/distinct stay correct.
	const keyAcc = new Map<string, Acc>()
	const serAcc = new Map<string, Acc>()
	for (const [k, row] of cell) {
		const ka = newAcc(distinct)
		for (const [s, a] of row) {
			mergeAcc(ka, a)
			let sa = serAcc.get(s)
			if (!sa) { sa = newAcc(distinct); serAcc.set(s, sa) }
			mergeAcc(sa, a)
		}
		keyAcc.set(k, ka)
	}
	const keyTotal = new Map([...keyAcc].map(([k, a]) => [k, accValue(a, op)]))
	const serTotal = new Map([...serAcc].map(([s, a]) => [s, accValue(a, op)]))

	const isTime = !!spec.bucket
	let keys = [...cell.keys()]
	const hasEmpty = keys.includes(EMPTY_KEY)
	if (spec.bucket && spec.fill !== false) {
		keys = fillTimeBuckets(keys.filter((k) => k !== EMPTY_KEY), spec.bucket)
		if (hasEmpty) keys.push(EMPTY_KEY)
	}
	keys = orderKeys(keys, keyTotal, spec.sort, isTime)
	let series = orderKeys([...serAcc.keys()], serTotal, Array.isArray(spec.sort) ? spec.sort : "-value", false)

	// Fold keys past top-N into "Other" (accumulators merged, so the Other value is a true measure).
	const top = isTime ? undefined : spec.top
	const foldKeys = top !== undefined && keys.length > top
	const keptKeys = top !== undefined && foldKeys ? keys.slice(0, Math.max(0, top)) : keys
	const topSeries = spec.topSeries
	const foldSeries = topSeries !== undefined && series.length > topSeries
	const keptSeries = topSeries !== undefined && foldSeries ? series.slice(0, Math.max(0, topSeries)) : series
	const keptSeriesSet = new Set(keptSeries)

	const outKeys = foldKeys ? [...keptKeys, OTHER_KEY] : keptKeys
	series = foldSeries ? [...keptSeries, OTHER_KEY] : keptSeries
	const keptKeySet = new Set(keptKeys)
	const accFor = new Map<string, Map<string, Acc>>()
	const target = (k: string, s: string) => {
		let row = accFor.get(k)
		if (!row) { row = new Map(); accFor.set(k, row) }
		let a = row.get(s)
		if (!a) { a = newAcc(distinct); row.set(s, a) }
		return a
	}
	for (const [k, row] of cell) {
		const tk = keptKeySet.has(k) ? k : foldKeys ? OTHER_KEY : null
		if (tk === null) continue
		for (const [s, a] of row) {
			const ts = keptSeriesSet.has(s) ? s : foldSeries ? OTHER_KEY : null
			if (ts !== null) mergeAcc(target(tk, ts), a)
		}
	}
	const cells = outKeys.map((k) => series.map((s) => {
		const a = accFor.get(k)?.get(s)
		return a ? accValue(a, op) : 0
	}))
	const totalOf = (accs: Acc[]) => {
		const t = newAcc(distinct)
		for (const a of accs) mergeAcc(t, a)
		return accValue(t, op)
	}
	const totals = outKeys.map((k) => totalOf([...(accFor.get(k)?.values() ?? [])]))
	const seriesTotals = series.map((s) => totalOf(outKeys.map((k) => accFor.get(k)?.get(s)).filter((a): a is Acc => !!a)))
	return { keys: outKeys, series, cells, totals, seriesTotals }
}
