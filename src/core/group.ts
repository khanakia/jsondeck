/**
 * Row grouping for the table (multi-level, with subtotals). Pure.
 * Built on aggregate.ts: the same keys (`groupBy`, "(empty)" for missing,
 * arrays put a row in every group they name) and the same measures.
 */
import { EMPTY_KEY, getField, groupBy, type MeasureOp, measure, type Row } from "./aggregate"

export type GroupAggregates = Record<string, MeasureOp>

export type GroupOptions = {
	/** Per grouping column: the value order to use (e.g. severity). Values not listed come after, by value. */
	order?: Record<string, string[]> | undefined
	/** Column → measure, computed for every group (count needs no column; use any key). */
	aggregates?: GroupAggregates | undefined
}

export type GroupNode = {
	/** The grouping column at this level. */
	field: string
	/** Group label as text ("(empty)" for missing values). */
	key: string
	/** The first raw value seen for this group (undefined for "(empty)"). */
	value: unknown
	/** Rows under this group, all levels. */
	count: number
	/** Column → measured value for the rows in this group. */
	aggregates: Record<string, number>
	/** 0 for the top level. */
	depth: number
	/** Sub-groups when there is a next level … */
	children?: GroupNode[]
	/** … else the rows themselves. */
	rows?: Row[]
}

/** Stable comparator: listed order first, then natural by value; "(empty)" always last. */
function keyComparator(order: string[] | undefined): (a: string, b: string) => number {
	const rank = new Map((order ?? []).map((k, i) => [k, i]))
	return (a, b) => {
		if (a === EMPTY_KEY || b === EMPTY_KEY) return a === b ? 0 : a === EMPTY_KEY ? 1 : -1
		const ra = rank.get(a) ?? Infinity
		const rb = rank.get(b) ?? Infinity
		if (ra !== rb) return ra - rb
		return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
	}
}

function measureAll(rows: Row[], aggregates: GroupAggregates | undefined): Record<string, number> {
	const out: Record<string, number> = {}
	for (const [col, op] of Object.entries(aggregates ?? {})) out[col] = measure(rows, op === "count" ? "count" : { op, field: col })
	return out
}

function firstValue(rows: Row[], field: string): unknown {
	for (const r of rows) {
		const v = getField(r, field)
		if (Array.isArray(v)) return v[0]
		if (v !== null && v !== undefined && v !== "") return v
	}
	return undefined
}

function build(rows: Row[], by: string[], depth: number, opts: GroupOptions): GroupNode[] {
	const field = by[depth]
	if (field === undefined) return []
	const groups = groupBy(rows, field)
	const cmp = keyComparator(opts.order?.[field])
	const last = depth === by.length - 1
	return [...groups.keys()].sort(cmp).map((key) => {
		const members = groups.get(key) ?? []
		const node: GroupNode = {
			field,
			key,
			value: key === EMPTY_KEY ? undefined : firstValue(members, field),
			count: members.length,
			aggregates: measureAll(members, opts.aggregates),
			depth,
		}
		if (last) node.rows = members
		else node.children = build(members, by, depth + 1, opts)
		return node
	})
}

/**
 * Group rows by one or more columns. `by: []` returns no groups.
 * Rows inside a leaf keep their input order (sort the rows first to sort within groups).
 */
export function groupRows(rows: Row[], by: string[], opts: GroupOptions = {}): GroupNode[] {
	return build(rows, by, 0, opts)
}

/** Depth-first list of nodes, skipping the children of collapsed group paths ("sev\0high"). For rendering flat rows. */
export function flattenGroups(nodes: GroupNode[], collapsed: ReadonlySet<string> = new Set(), parent = ""): { node: GroupNode; path: string }[] {
	const out: { node: GroupNode; path: string }[] = []
	for (const node of nodes) {
		const path = parent ? `${parent}\0${node.key}` : node.key
		out.push({ node, path })
		if (node.children && !collapsed.has(path)) out.push(...flattenGroups(node.children, collapsed, path))
	}
	return out
}
