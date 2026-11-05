/**
 * Reading a field from a row, with dotted paths into nested objects
 * ("owner.name"). Its own tiny module so the relations index (always loaded)
 * does not pull in aggregate.ts (charts, stat tiles, group totals), which
 * loads on demand.
 */
export type Row = Record<string, unknown>

/** A field's value; "a.b.c" walks nested objects when the row has no "a.b.c" key. */
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
