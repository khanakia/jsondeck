/**
 * A row's right-click menu: copy cell / row / selection in every format,
 * filter by or exclude the value, expand, open, copy link, and the table's
 * own `rowActions`. An on-demand chunk (with the menu component), loaded on
 * the first right-click.
 */
import { ContextMenu, type MenuItem } from "../../components/ContextMenu"
import { fillTemplate } from "../../components/cells"
import { COPY_FORMATS, type CopyFormat } from "../../core/copy"
import { fill, type Labels } from "../../core/labels"
import { toText, type Row } from "../../core/query"
import type { ResolvedTable } from "../../core/resolve"
import type { FilterCondition, FilterFieldDef } from "../types"
import { copyCell, copyLink } from "./copy-rows"
import { formatLabel } from "./row-shared"

export type RowMenuProps = {
	x: number
	y: number
	row: Row
	/** The column under the pointer (none from the keyboard). */
	col?: string | undefined
	table: ResolvedTable
	labels: Labels
	selection: ReadonlySet<Row>
	filterFields: FilterFieldDef<unknown>[]
	addFilter: (f: FilterCondition) => void
	/** Inline expand is on: offer expand / collapse. */
	expandInline: boolean
	expanded: boolean
	toggleExpand: (row: Row) => void
	onRowOpen?: ((row: Row) => void) | undefined
	copyRows: (list: Row[], fmt: CopyFormat) => void
	onClose: () => void
}

/** Ids for the filters added from this menu. */
let seq = 0

function menuItems(p: RowMenuProps): MenuItem[] {
	const { row, col: colId, table, labels: L, selection } = p
	const items: MenuItem[] = []
	const spec = colId ? table.columns.find((c) => c.id === colId) : undefined
	if (spec) items.push({ label: L.copyCell, onSelect: () => void copyCell(row, spec, L) })
	items.push({ label: L.copyRowAs, submenu: COPY_FORMATS.map((f) => ({ label: formatLabel(L, f), onSelect: () => p.copyRows([row], f) })) })
	if (selection.size > 0) items.push({ label: fill(L.copySelectedAs, { n: selection.size }), submenu: COPY_FORMATS.map((f) => ({ label: formatLabel(L, f), onSelect: () => p.copyRows([...selection], f) })) })
	const ff = colId ? p.filterFields.find((f) => f.id === colId) : undefined
	if (spec && ff && row[spec.id] !== undefined && row[spec.id] !== null && row[spec.id] !== "") {
		const v = toText(row[spec.id])
		const multi = ff.type === "multi-select"
		const value = multi ? [v] : ff.type === "number" ? Number(v) : ff.type === "boolean" ? v === "true" : v
		items.push({ separator: true })
		items.push({ label: L.filterByValue, onSelect: () => { seq += 1; p.addFilter({ id: `cm${seq}`, fieldId: spec.id, operator: multi ? "in" : ff.type === "boolean" ? "is" : "eq", value }) } })
		items.push({ label: L.excludeValue, onSelect: () => { seq += 1; p.addFilter({ id: `cm${seq}`, fieldId: spec.id, operator: multi ? "notIn" : ff.type === "boolean" ? "isNot" : "neq", value }) } })
	}
	items.push({ separator: true })
	if (p.expandInline) items.push({ label: p.expanded ? L.collapseRow : L.expandRow, kbd: "Enter", onSelect: () => p.toggleExpand(row) })
	const open = p.onRowOpen
	if (open) items.push({ label: L.openDetail, onSelect: () => open(row) })
	if (spec && typeof spec.link === "string") {
		const href = fillTemplate(spec.link, row)
		items.push({ label: L.copyLink, onSelect: () => void copyLink(href, L) })
	}
	if (table.rowActions.length) {
		items.push({ separator: true })
		for (const a of table.rowActions) items.push({ label: a.label, onSelect: () => a.onSelect(row, selection.size ? [...selection] : [row]) })
	}
	return items
}

export function RowMenu(p: RowMenuProps) {
	return <ContextMenu x={p.x} y={p.y} items={menuItems(p)} onClose={p.onClose} label={p.table.label} />
}
