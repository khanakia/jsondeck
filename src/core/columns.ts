/**
 * Column order and visibility. Pure: no React. Same rules as
 * the table engine: a saved order wins, columns it does not name are
 * appended in their natural order, hidden ids are dropped.
 */

/** Columns sorted by a saved order; ids the order does not know go last. */
export function orderColumns<C extends { id: string }>(columns: C[], order: string[]): C[] {
	if (order.length === 0) return columns
	const known = new Set(order)
	const ordered = columns.filter((c) => known.has(c.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
	return [...ordered, ...columns.filter((c) => !known.has(c.id))]
}

/** Columns minus the hidden ids. */
export function visibleColumns<C extends { id: string }>(columns: C[], hidden: string[]): C[] {
	if (hidden.length === 0) return columns
	const h = new Set(hidden)
	return columns.filter((c) => !h.has(c.id))
}

/** The rows of one 1-based page, with the page clamped to the last page. */
export function pageSlice<R>(rows: R[], page: number, pageSize: number): { rows: R[]; page: number; pageCount: number } {
	const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
	const p = Math.min(Math.max(1, page), pageCount)
	return { rows: rows.slice((p - 1) * pageSize, p * pageSize), page: p, pageCount }
}
