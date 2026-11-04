/**
 * Turns a resolved table into the shapes the table engine
 * expects (DataTableColumn, FilterFieldDef, SortOption) plus the FieldInfo the
 * in-memory query engine needs. Reads only the resolved spec: no defaults here.
 */
import { type RenderCtx, renderCell, tooltipFor } from "./components/cells"
import type { FieldInfo, Row } from "./core/query"
import type { ResolvedColumn, ResolvedTable } from "./core/resolve"
import type { DataTableColumn, FilterFieldDef, SortOption } from "./sdt/types"

export type ColumnMetaX = { spec: ResolvedColumn; tooltip: (row: Row) => string | undefined }

export type AutoTable = {
	columns: DataTableColumn<Row>[]
	filterFields: FilterFieldDef<unknown>[]
	sortOptions: SortOption[]
	fields: FieldInfo[]
	searchFields: string[]
	/** Column specs by id, for pin/align/wrap/tooltip in the table. */
	specs: Map<string, ColumnMetaX>
}

function filterFieldFor(c: ResolvedColumn): FilterFieldDef<unknown> | null {
	if (!c.filter) return null
	const base = { id: c.id, label: c.label, operators: c.filter.operators }
	switch (c.filter.type) {
		case "select":
			return { ...base, type: "select", options: c.filter.options ?? [] }
		case "multi-select":
			return { ...base, type: "multi-select", options: c.filter.options ?? [] }
		case "date-range":
			return { ...base, type: "date-range", showPresets: true }
		default:
			return { ...base, type: c.filter.type }
	}
}

export function buildAuto(t: ResolvedTable, ctx: RenderCtx): AutoTable {
	const columns: DataTableColumn<Row>[] = t.columns.map((c) => ({
		id: c.id,
		header: c.label,
		size: c.width,
		minSize: c.minWidth,
		meta: { label: c.label, sortFieldId: c.sort === false ? undefined : c.id, filterFieldId: c.filter ? c.id : undefined, className: c.className },
		cell: (row) => renderCell(row[c.id], row, c, ctx),
	}))
	const filterFields = t.filters ? t.columns.map(filterFieldFor).filter((f): f is FilterFieldDef<unknown> => !!f) : []
	const sortOptions = t.columns.filter((c) => c.sort !== false).map((c) => ({ fieldId: c.id, label: c.label }))
	const fields: FieldInfo[] = t.columns.map((c) => ({
		id: c.id,
		type: c.filter ? c.filter.type : "text",
		sort: c.sort === false ? undefined : c.sort,
		order: c.order,
	}))
	const specs = new Map(t.columns.map((c) => [c.id, { spec: c, tooltip: (row: Row) => tooltipFor(row[c.id], row, c, ctx.formats) }]))
	return { columns, filterFields, sortOptions, fields, searchFields: t.search ? t.search.columns : [], specs }
}
