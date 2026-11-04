/**
 * Links between tables. Pure: no React.
 *
 * A relation `{ from: "findings.affected", to: "ec2.private_ip" }` says: the
 * value in findings.affected names the ec2 row whose private_ip equals it.
 * Either side may hold an array (many-to-many). The field part may be a dot
 * path into nested objects (`ec2.tags.owner`).
 *
 * The index is built once (O(total rows)); each lookup is a few Map reads,
 * so a detail drawer can ask on every row click even at ~50k rows.
 */
import { getField, type Row } from "./aggregate"
import { toText } from "./query"

export type Relation = {
	/** `table.field` holding the pointer. */
	from: string
	/** `table.field` being pointed at (usually the target table's key). */
	to: string
	/** Optional display name for the forward link (default: target table name). */
	label?: string
	/** Optional display name for the reverse link (default: source table name). */
	reverseLabel?: string
}

/** forward = rows this row points at; reverse = rows that point at this row. */
export type Direction = "forward" | "reverse"

export type RelatedGroup = {
	relation: Relation
	direction: Direction
	/** The other table. */
	table: string
	/** The field in the other table that matched. */
	field: string
	label: string
	rows: Row[]
}

export type RelationIndex = {
	/** Related rows in every direction, one group per relation side that applies to this table. Empty groups are kept (count 0). */
	lookup(table: string, row: Row): RelatedGroup[]
	/** Same as lookup but counts only (no row arrays kept by the caller). */
	counts(table: string, row: Row): { label: string; table: string; direction: Direction; count: number }[]
	/** Rows of `table` whose `field` holds `value` (for rendering a cell value as a link). */
	find(table: string, field: string, value: unknown): Row[]
	/** Does this `table.field` point somewhere? Returns the forward relations that start at it. */
	linksFrom(table: string, field: string): Relation[]
	/** Relations whose `from` or `to` names a table that is not in the data (config typos). */
	invalid: { relation: Relation; reason: string }[]
}

type Side = { table: string; field: string }

/** Split `table.field.path` at the first dot. */
export function parseSide(s: string): Side | null {
	const i = s.indexOf(".")
	if (i <= 0 || i === s.length - 1) return null
	return { table: s.slice(0, i), field: s.slice(i + 1) }
}

/** The lookup keys a cell contributes: one per array element, empty values dropped. */
function cellKeys(v: unknown): string[] {
	const list = Array.isArray(v) ? v : [v]
	const out: string[] = []
	for (const x of list) {
		const s = toText(x)
		if (s !== "") out.push(s)
	}
	return out
}

function buildFieldIndex(rows: Row[], field: string): Map<string, Row[]> {
	const idx = new Map<string, Row[]>()
	for (const r of rows) {
		for (const k of cellKeys(getField(r, field))) {
			const g = idx.get(k)
			if (g) {
				if (g[g.length - 1] !== r) g.push(r) // same row twice in one array cell counts once
			} else idx.set(k, [r])
		}
	}
	return idx
}

/** Union of the index hits for every key in a cell, deduplicated, in first-seen order. */
function hits(idx: Map<string, Row[]> | undefined, keys: string[]): Row[] {
	if (!idx || keys.length === 0) return []
	const only = keys.length === 1 ? keys[0] : undefined
	if (only !== undefined) return idx.get(only) ?? []
	const seen = new Set<Row>()
	for (const k of keys) for (const r of idx.get(k) ?? []) seen.add(r)
	return [...seen]
}

export function buildRelations(tables: Record<string, Row[]>, relations: Relation[] = []): RelationIndex {
	const fieldIdx = new Map<string, Map<string, Row[]>>() // "table\0field" → value → rows
	const indexOf = (table: string, field: string) => {
		const id = `${table}\0${field}`
		let idx = fieldIdx.get(id)
		if (!idx) {
			idx = buildFieldIndex(tables[table] ?? [], field)
			fieldIdx.set(id, idx)
		}
		return idx
	}

	const invalid: RelationIndex["invalid"] = []
	const valid: { rel: Relation; from: Side; to: Side }[] = []
	for (const rel of relations) {
		const from = parseSide(rel.from)
		const to = parseSide(rel.to)
		if (!from || !to) { invalid.push({ relation: rel, reason: "write each side as table.field" }); continue }
		if (!(from.table in tables)) { invalid.push({ relation: rel, reason: `no table named ${from.table}` }); continue }
		if (!(to.table in tables)) { invalid.push({ relation: rel, reason: `no table named ${to.table}` }); continue }
		valid.push({ rel, from, to })
		// Build both indexes now, so the first click is as fast as the rest.
		indexOf(from.table, from.field)
		indexOf(to.table, to.field)
	}

	const lookup = (table: string, row: Row): RelatedGroup[] => {
		const out: RelatedGroup[] = []
		for (const { rel, from, to } of valid) {
			if (from.table === table) {
				out.push({
					relation: rel, direction: "forward", table: to.table, field: to.field,
					label: rel.label ?? to.table,
					rows: hits(indexOf(to.table, to.field), cellKeys(getField(row, from.field))),
				})
			}
			if (to.table === table) {
				// A self-relation (from and to in the same table) yields both directions.
				out.push({
					relation: rel, direction: "reverse", table: from.table, field: from.field,
					label: rel.reverseLabel ?? from.table,
					rows: hits(indexOf(from.table, from.field), cellKeys(getField(row, to.field))),
				})
			}
		}
		return out
	}

	return {
		lookup,
		counts: (table, row) => lookup(table, row).map((g) => ({ label: g.label, table: g.table, direction: g.direction, count: g.rows.length })),
		find: (table, field, value) => hits(indexOf(table, field), cellKeys(value)),
		linksFrom: (table, field) => valid.filter((v) => v.from.table === table && v.from.field === field).map((v) => v.rel),
		invalid,
	}
}
