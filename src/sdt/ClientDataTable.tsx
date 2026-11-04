import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { AutoTable } from "../auto"
import { fill, plural } from "../core/labels"
import type { ResolvedTable } from "../core/resolve"
import { orderColumns, pageSlice, visibleColumns as dropHidden } from "../core/columns"
import { applyQuery, type Row } from "../core/query"
import { ColumnHeaderMenu } from "./columns/ColumnHeaderMenu"
import { ColumnVisibilityMenu } from "./columns/ColumnVisibilityMenu"
import { useColumnResize } from "./columns/useColumnResize"
import { FilterBar } from "./filters/FilterBar"
import { ShortcutsHelp } from "./keyboard/ShortcutsHelp"
import { useShortcuts } from "./keyboard/useShortcuts"
import { NumberedPaginationBar } from "./pagination/NumberedPaginationBar"
import { PageSizeSelect } from "./pagination/PageSizeSelect"
import { SortDropdown } from "./sort/SortDropdown"
import { initialTableState } from "./state/reducer"
import { useTableState } from "./state/useTableState"
import { EmptyState } from "./table/EmptyState"
import { TableExportButton } from "./toolbar/TableExportButton"
import type { CsvField } from "./toolbar/csv"
import { ChevronRight } from "lucide-react"
import { mergeClassNames, useClassNames } from "@/lib/classnames"
import { useNested } from "@/lib/nested"
import { fillTemplate, formatValue } from "../components/cells"
import { ContextMenu, type MenuItem } from "../components/ContextMenu"
import { toast } from "../components/Toast"
import { cellText, COPY_FORMATS, type CopyFormat, copyText, serializeRows } from "../core/clipboard"
import { flattenGroups, type GroupNode, groupRows } from "../core/group"
import { toText } from "../core/query"
import { formatLabel, GroupByMenu, MAX_DEPTH, MoreMenu, QuickFilters, RowDetail, SelectionBar } from "./rows/RowFeatures"
import type { DataTableColumn, FilterCondition, SortRule, ToolbarCtx } from "./types"

/**
 * Row density. Compact (default) is the power-user grid: 28px rows and header
 * (13px text, py-1, leading-5); comfortable is 36px. Every cell, header and
 * group row reads these so nothing (chevron, checkbox, badge) can grow a row.
 */
const DENSITY = {
	compact: { cell: "jd:h-(--jds-row-height) jd:py-1 jd:leading-5", head: "jd:h-(--jds-row-height)" },
	comfortable: { cell: "jd:h-(--jds-row-height-comfortable) jd:py-1.5 jd:leading-5", head: "jd:h-(--jds-row-height-comfortable)" },
} as const

/** Width of the chevron and checkbox columns. */
const SPECIAL_W = 32
/** One line of the table body: a group header or a data row. */
type Entry = { kind: "group"; node: GroupNode; path: string; open: boolean } | { kind: "row"; row: Row }

/** A frozen column's edge: a border on the side facing the scrolling columns (no shadow: blocks separate by border only). */
function pinEdge(pin: "left" | "right" | undefined): string | undefined {
	if (pin === "left") return "jd:border-r"
	if (pin === "right") return "jd:border-l"
	return undefined
}

/** A cell as a CSV value: objects as JSON, the rest as is. */
function csvValue(v: unknown): string | number | boolean | null | undefined {
	if (v === null || v === undefined || typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v
	return JSON.stringify(v)
}

/** Ids for filters added from the page (charts, facets). */
let filterSeq = 0
import type { ViewStorage } from "./views/storage/ViewStorage"
import { useSavedViews } from "./views/useSavedViews"
import { ViewSelector } from "./views/ViewSelector"

const DEFAULT_COL_SIZE = 160

export type ClientDataTableProps = {
	/** The resolved table (rows, column specs, defaults). */
	table: ResolvedTable
	/** Engine shapes built from it (columns, filter fields, sort options, field info). */
	auto: AutoTable
	/** Only the visible table listens to keyboard shortcuts. */
	active?: boolean | undefined
	toolbarEnd?: React.ReactNode | undefined
	className?: string | undefined
	/** Instance id: keys saved views and page wiring (one dataset may be placed twice). Default: the table name. */
	instanceId?: string | undefined
	/** Extra AND conditions from the page filter bar (not shown as pills). */
	pageFilters?: FilterCondition[] | undefined
	/** Row click when the table config has no onRowClick (opens the row drawer). */
	onRowOpen?: ((row: Row) => void) | undefined
	/** Show the CSV / JSON export menu for the filtered rows. */
	exportable?: boolean | undefined
	/** Called on pointer-down inside the table (the page uses it to pick the keyboard target). */
	onFocus?: (() => void) | undefined
	/** Page wiring: lets charts and facets add filters to this instance. */
	register?: ((id: string, api: TableApi) => () => void) | undefined
	/** Nesting depth (0 = top level); nested related tables stop at MAX_DEPTH. */
	depth?: number | undefined
	/** Compact nested look (no views, smaller chrome). */
	compact?: boolean | undefined
	/** Selection changes (master–detail and the selection bar). */
	onSelectionChange?: ((rows: Row[]) => void) | undefined
	/** A master's selection restricts this table to these rows (null = no restriction). */
	restrictRows?: ReadonlySet<Row> | null | undefined
	/** Chip text for the restriction ("F-024") and how to clear it. */
	restrictLabel?: string | undefined
	onClearRestrict?: (() => void) | undefined
	/** A plain row click selects that one row (used by master tables without checkboxes). */
	selectOnClick?: boolean | undefined
	/** Bumping this clears the selection (the master chip's ✕ on a detail table). */
	selectionResetKey?: number | undefined
}

/** What the page can do to a placed table: add a filter on a field. */
export type TableApi = { table: string; addFilter: (field: string, value: string) => void }

/**
 * ClientDataTable
 * ─────────────────────────────────────────────────────────────────────
 * the table component, working on data held in the browser.
 * Same state (reducer), toolbar (FilterBar + SortDropdown + columns + views),
 * header menus, resize/reorder and grid look. What changed:
 *   • useServerQuery + buildWhere → `applyQuery` (pure, core/query.ts) runs the
 *     same FilterCondition/SortRule state over the rows in memory
 *   • cursor paging → numbered pages (page is 1-based in state.pagination)
 *   • URL state, row actions/context menu, refetch and fetchAll are dropped
 *   • header click sorts (shift-click adds a sort), on top of the header menu
 */
export function ClientDataTable(props: ClientDataTableProps) {
	const { table, auto, active = true, toolbarEnd, className, pageFilters, onRowOpen, exportable, onFocus, register, depth = 0, compact, onSelectionChange, restrictRows, restrictLabel, onClearRestrict, selectOnClick, selectionResetKey } = props
	const { rows } = table
	const scope = props.instanceId ?? table.name
	const { columns: userColumns, filterFields, sortOptions, fields, searchFields, specs } = auto
	const pageSizeOptions = table.pageSizes
	const viewsConfig = table.views === false ? false : { storage: table.views.storage as ViewStorage | undefined }
	const L = useLabels()
	// Class slots: global/item (context) plus this table's own.
	const cls_ = mergeClassNames(useClassNames(), table.classNames)
	const renderCtx = useNested()?.renderCtx ?? { types: {}, renderers: {}, formats: {} }

	const { state, actions } = useTableState({
		defaultSort: table.defaultSort,
		// Columns with `hidden: true` start hidden (and so become the expanded row's detail by default).
		initial: { pageSize: table.pageSize, filters: table.defaultFilters, groupBy: table.groupBy, hiddenColumns: table.columns.filter((c) => c.hidden).map((c) => c.id) },
	})
	const rootRef = React.useRef<HTMLDivElement>(null)

	// ── Saved views ──────────────────────────────────────────────────────
	const enableViews = viewsConfig !== false && !compact
	const {
		views,
		save: saveView,
		remove: removeView,
		setDefault: setDefaultView,
		setFavorite: setViewFavorite,
	} = useSavedViews({ scope: `jsondeck:${scope}`, storage: enableViews ? viewsConfig.storage : undefined })

	// Apply the default view once, when storage has loaded.
	const didApplyDefaultRef = React.useRef(false)
	React.useEffect(() => {
		if (didApplyDefaultRef.current) return
		const def = views.find((v) => v.isDefault)
		if (def) {
			didApplyDefaultRef.current = true
			actions.replaceState(
				initialTableState({
					search: def.state.search,
					filters: def.state.filters,
					sort: def.state.sort,
					hiddenColumns: def.state.hiddenColumns ?? [],
					columnOrder: def.state.columnOrder ?? [],
					columnSizes: def.state.columnSizes ?? {},
					groupBy: def.state.groupBy ?? table.groupBy,
					detailColumns: def.state.detailColumns ?? null,
					pageSize: state.pageSize,
					viewId: def.id,
				}),
			)
		} else if (views.length > 0) didApplyDefaultRef.current = true
	}, [views, actions, state.pageSize])

	// ── The in-memory query: search + filters + multi-sort ───────────────
	// A master's selection narrows the rows before search and filters.
	const baseRows = React.useMemo(() => (restrictRows ? rows.filter((r) => restrictRows.has(r)) : rows), [rows, restrictRows])
	const filtered = React.useMemo(
		() => applyQuery(baseRows, { search: state.search, searchFields, filters: pageFilters?.length ? [...state.filters, ...pageFilters] : state.filters, sort: state.sort, fields }),
		[baseRows, state.search, state.filters, pageFilters, state.sort, searchFields, fields],
	)
	const totalCount = filtered.length
	// Grouping: group header entries interleaved with rows (collapsed groups hide their rows); paged as one list.
	const [collapsed, setCollapsed] = React.useState<ReadonlySet<string>>(new Set())
	const entries = React.useMemo<Entry[]>(() => {
		if (state.groupBy.length === 0) return filtered.map((row) => ({ kind: "row", row }))
		const order: Record<string, string[]> = {}
		for (const g of state.groupBy) {
			const o = table.columns.find((c) => c.id === g)?.order
			if (o) order[g] = o
		}
		const nodesG = groupRows(filtered, state.groupBy, { order, aggregates: table.groupAggregates })
		const out: Entry[] = []
		for (const { node, path } of flattenGroups(nodesG, collapsed)) {
			out.push({ kind: "group", node, path, open: !collapsed.has(path) })
			if (node.rows && !collapsed.has(path)) for (const row of node.rows) out.push({ kind: "row", row })
		}
		return out
	}, [filtered, state.groupBy, collapsed, table.columns, table.groupAggregates])
	const { rows: pageEntries, page, pageCount } = React.useMemo(
		() => pageSlice(entries, state.pagination.page, state.pageSize),
		[entries, state.pagination.page, state.pageSize],
	)
	const nodes = React.useMemo(() => pageEntries.flatMap((e) => (e.kind === "row" ? [e.row] : [])), [pageEntries])

	// Expanded rows and the selection, keyed by row object (rows are stable).
	const [expanded, setExpanded] = React.useState<ReadonlySet<Row>>(new Set())
	const toggleExpand = (row: Row) =>
		setExpanded((prev) => {
			const next = new Set(prev)
			if (next.has(row)) next.delete(row)
			else next.add(row)
			return next
		})
	const [selection, setSelectionState] = React.useState<ReadonlySet<Row>>(new Set())
	const anchor = React.useRef<number | null>(null)
	React.useEffect(() => {
		if (selectionResetKey) setSelectionState(new Set())
	}, [selectionResetKey])
	const setSelection = (next: ReadonlySet<Row>) => {
		setSelectionState(next)
		onSelectionChange?.([...next])
	}
	const selectRow = (row: Row, e: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }, toggleOnly = false) => {
		const idx = nodes.indexOf(row)
		const next = new Set(selection)
		if (e.shiftKey && anchor.current !== null) {
			const [a, b] = [Math.min(anchor.current, idx), Math.max(anchor.current, idx)]
			for (const r of nodes.slice(a, b + 1)) next.add(r)
		} else if (toggleOnly || e.metaKey || e.ctrlKey) {
			if (next.has(row)) next.delete(row)
			else next.add(row)
			anchor.current = idx
		} else {
			next.clear()
			next.add(row)
			anchor.current = idx
		}
		setSelection(next)
	}
	const D = DENSITY[table.density]
	const expandInline = table.expand === "inline" && depth < MAX_DEPTH
	const checkboxes = table.selectable
	const specialCols = (expandInline ? 1 : 0) + (checkboxes ? 1 : 0)

	// Which columns the expanded row shows: the user's choice, then config, then the hidden columns (else all).
	const detailIds = React.useMemo(() => {
		if (state.detailColumns) return state.detailColumns
		if (table.detail?.fields) return table.detail.fields
		const hidden = table.columns.filter((c) => state.hiddenColumns.includes(c.id)).map((c) => c.id)
		return hidden.length ? hidden : table.columns.map((c) => c.id)
	}, [state.detailColumns, state.hiddenColumns, table.columns, table.detail])
	const detailFields = React.useMemo(() => detailIds.flatMap((id) => table.columns.filter((c) => c.id === id)), [detailIds, table.columns])

	// Copy (context menu / selection bar), with a toast on every copy.
	const copyRows = async (list: Row[], fmt: CopyFormat) => {
		const ok = await copyText(serializeRows(fmt, list, table.columns))
		toast(ok ? fill(plural(L, list.length, "copiedRows", "copiedRowsOne"), { n: list.length, fmt: formatLabel(L, fmt) }) : L.copyFailed, { kind: ok ? "success" : "error" })
	}
	const [menu, setMenu] = React.useState<{ x: number; y: number; row: Row; col?: string | undefined } | null>(null)
	const menuItems = (row: Row, colId: string | undefined): MenuItem[] => {
		const items: MenuItem[] = []
		const spec = colId ? table.columns.find((c) => c.id === colId) : undefined
		if (spec) {
			items.push({ label: L.copyCell, onSelect: async () => {
				const ok = await copyText(cellText(row, spec))
				toast(ok ? L.copiedCell : L.copyFailed, { kind: ok ? "success" : "error" })
			} })
		}
		items.push({ label: L.copyRowAs, submenu: COPY_FORMATS.map((f) => ({ label: formatLabel(L, f), onSelect: () => void copyRows([row], f) })) })
		if (selection.size > 0) items.push({ label: fill(L.copySelectedAs, { n: selection.size }), submenu: COPY_FORMATS.map((f) => ({ label: formatLabel(L, f), onSelect: () => void copyRows([...selection], f) })) })
		const ff = colId ? filterFields.find((f) => f.id === colId) : undefined
		if (spec && ff && row[spec.id] !== undefined && row[spec.id] !== null && row[spec.id] !== "") {
			const v = toText(row[spec.id])
			const multi = ff.type === "multi-select"
			items.push({ separator: true })
			items.push({ label: L.filterByValue, onSelect: () => { filterSeq += 1; actions.addFilter({ id: `cm${filterSeq}`, fieldId: spec.id, operator: multi ? "in" : ff.type === "number" ? "eq" : ff.type === "boolean" ? "is" : "eq", value: multi ? [v] : ff.type === "number" ? Number(v) : ff.type === "boolean" ? v === "true" : v }) } })
			items.push({ label: L.excludeValue, onSelect: () => { filterSeq += 1; actions.addFilter({ id: `cm${filterSeq}`, fieldId: spec.id, operator: multi ? "notIn" : ff.type === "boolean" ? "isNot" : "neq", value: multi ? [v] : ff.type === "number" ? Number(v) : ff.type === "boolean" ? v === "true" : v }) } })
		}
		items.push({ separator: true })
		if (expandInline) items.push({ label: expanded.has(row) ? L.collapseRow : L.expandRow, kbd: "Enter", onSelect: () => toggleExpand(row) })
		if (onRowOpen) items.push({ label: L.openDetail, onSelect: () => onRowOpen(row) })
		if (spec && typeof spec.link === "string") {
			const href = fillTemplate(spec.link, row)
			items.push({ label: L.copyLink, onSelect: async () => {
				const ok = await copyText(href)
				toast(ok ? L.copiedLink : L.copyFailed, { kind: ok ? "success" : "error" })
			} })
		}
		if (table.rowActions.length) {
			items.push({ separator: true })
			for (const a of table.rowActions) items.push({ label: a.label, onSelect: () => a.onSelect(row, selection.size ? [...selection] : [row]) })
		}
		return items
	}

	// ── Column order / visibility / widths (unchanged from the original) ─
	const effectiveOrder = React.useMemo(() => orderColumns(userColumns, state.columnOrder), [userColumns, state.columnOrder])
	const visibleColumns = React.useMemo(() => dropHidden(effectiveOrder, state.hiddenColumns), [effectiveOrder, state.hiddenColumns])
	const widthFor = React.useCallback(
		(col: DataTableColumn<Row>) => state.columnSizes[col.id] ?? col.size ?? DEFAULT_COL_SIZE,
		[state.columnSizes],
	)
	const totalWidth = React.useMemo(() => visibleColumns.reduce((sum, c) => sum + widthFor(c), 0), [visibleColumns, widthFor])
	// Pinned columns: sticky with cumulative offsets from their edge.
	const pinOffsets = React.useMemo(() => {
		const out = new Map<string, React.CSSProperties>()
		let left = 0
		for (const c of visibleColumns) {
			if (specs.get(c.id)?.spec.pin !== "left") continue
			out.set(c.id, { position: "sticky", left, zIndex: 2 })
			left += widthFor(c)
		}
		let right = 0
		for (const c of [...visibleColumns].reverse()) {
			if (specs.get(c.id)?.spec.pin !== "right") continue
			out.set(c.id, { position: "sticky", right, zIndex: 2 })
			right += widthFor(c)
		}
		return out
	}, [visibleColumns, specs, widthFor])
	const alignClass = (id: string) => {
		const a = specs.get(id)?.spec.align
		return a === "right" ? "jd:text-right" : a === "center" ? "jd:text-center" : undefined
	}
	const { startResize } = useColumnResize({
		sizes: state.columnSizes,
		onSizesChange: actions.setColumnSizes,
		defaultSize: DEFAULT_COL_SIZE,
	})

	const sortFieldIds = React.useMemo(() => new Set(sortOptions.map((s) => s.fieldId)), [sortOptions])
	const filterFieldIds = React.useMemo(() => new Set(filterFields.map((f) => f.id)), [filterFields])

	// ── Filter picker imperative open (header "Filter…" item and `f`) ────
	const [pickerOpen, setPickerOpen] = React.useState(false)
	const [pickerInitialField, setPickerInitialField] = React.useState<string | null>(null)
	const handleColumnFilter = React.useCallback((filterFieldId: string) => {
		setPickerInitialField(filterFieldId)
		setPickerOpen(true)
	}, [])

	/** Header click: cycle asc → desc → off; shift-click adds/cycles a secondary sort. */
	const handleHeaderSort = React.useCallback(
		(fieldId: string, multi: boolean) => {
			const cur = state.sort.find((s) => s.fieldId === fieldId)
			const next: SortRule | null = !cur ? { fieldId, direction: "asc" } : cur.direction === "asc" ? { fieldId, direction: "desc" } : null
			if (!multi) return actions.setSort(next ? [next] : [])
			const rest = state.sort.filter((s) => s.fieldId !== fieldId)
			actions.setSort(next ? (cur ? state.sort.map((s) => (s.fieldId === fieldId ? next : s)) : [...rest, next]) : rest)
		},
		[state.sort, actions],
	)

	// ── Keyboard shortcuts, scoped to this table's root ──────────────────
	const searchInputRef = React.useRef<HTMLInputElement | null>(null)
	const [shortcutsOpen, setShortcutsOpen] = React.useState(false)
	const clickInRoot = (attr: string) => (rootRef.current?.querySelector(`[${attr}="true"]`) as HTMLElement | null)?.click()
	useShortcuts({
		enabled: active,
		onSlash: () => searchInputRef.current?.focus(),
		onF: () => setPickerOpen(true),
		onV: () => clickInRoot("data-jd-views-trigger"),
		onC: () => clickInRoot("data-jd-columns-trigger"),
		onS: () => clickInRoot("data-jd-sort-trigger"),
		onQuestion: () => setShortcutsOpen(true),
		onArrowLeft: () => page > 1 && actions.setPage(page - 1),
		onArrowRight: () => page < pageCount && actions.setPage(page + 1),
		onEscape: () => actions.setSearch(""),
	})

	const colCount = visibleColumns.length
	const isFiltered = state.filters.length > 0 || state.search.length > 0
	const clearAll = () => {
		actions.clearFilters()
		actions.setSearch("")
	}

	const handleSelectView = React.useCallback(
		(v: {
			id: string
			state: {
				search: string
				filters: typeof state.filters
				sort: typeof state.sort
				hiddenColumns?: string[] | undefined
				columnOrder?: string[] | undefined
				columnSizes?: Record<string, number> | undefined
				groupBy?: string[] | undefined
				detailColumns?: string[] | null | undefined
			}
		}) => {
			actions.replaceState(
				initialTableState({
					search: v.state.search,
					filters: v.state.filters,
					sort: v.state.sort,
					hiddenColumns: v.state.hiddenColumns ?? [],
					columnOrder: v.state.columnOrder ?? [],
					columnSizes: v.state.columnSizes ?? {},
					groupBy: v.state.groupBy ?? table.groupBy,
					detailColumns: v.state.detailColumns ?? null,
					pageSize: state.pageSize,
					viewId: v.id || null,
				}),
			)
		},
		[actions, state.pageSize],
	)

	// Page wiring: charts / facets add a filter on a field of this instance.
	const filterFieldsRef = React.useRef(filterFields)
	filterFieldsRef.current = filterFields
	React.useEffect(() => {
		if (!register) return
		return register(scope, {
			table: table.name,
			addFilter: (field, value) => {
				const f = filterFieldsRef.current.find((x) => x.id === field)
				if (!f) return
				filterSeq += 1
				const multi = f.type === "multi-select" || f.type === "relation-multi"
				const operator = multi ? "in" : f.type === "boolean" ? "is" : f.type === "text" ? "eq" : "eq"
				const v: unknown = multi ? [value] : f.type === "boolean" ? value === "true" : f.type === "number" ? Number(value) : value
				actions.addFilter({ id: `pf${filterSeq}`, fieldId: field, operator, value: v })
			},
		})
	}, [register, scope, table.name, actions])

	// Export: CSV of the visible columns, or JSON of the full filtered rows.
	const exportFields = React.useMemo<CsvField<Row>[]>(() => visibleColumns.map((c) => [typeof c.header === "string" ? c.header : c.id, (r: Row) => csvValue(r[c.id])] as const), [visibleColumns])
	const exportCtx = React.useMemo<ToolbarCtx<Row>>(
		() => ({
			nodes,
			totalCount,
			where: undefined,
			orderBy: [],
			state,
			refetch: () => {},
			fetchAll: async () => filtered,
			isFetching: false,
		}),
		[nodes, totalCount, state, filtered],
	)

	return (
		<div
			ref={rootRef}
			onPointerDown={onFocus}
			data-jd-instance={scope}
			data-jd-compact={compact ? "" : undefined}
			data-jd-density={table.density}
			// Nested tables: a slimmer toolbar (h-6 search and icon buttons).
			className={cn("jd:flex jd:flex-col jd:gap-2", compact && "jd:gap-1.5 jd:[&_[data-jd=search]]:h-6 jd:[&_.jd-toolbar-btn]:h-6 jd:[&_.jd-toolbar-btn]:w-6", className)}
		>
			<div className={cls_.toolbar} data-jd="toolbar">
			<FilterBar<unknown>
				fields={compact ? [] : filterFields}
				conditions={state.filters}
				search={table.search ? { placeholder: fill(L.search, { table: table.label.toLowerCase() }) } : undefined}
				searchValue={state.search}
				onSearchChange={actions.setSearch}
				onAddFilter={actions.addFilter}
				onUpdateFilter={actions.updateFilter}
				onRemoveFilter={actions.removeFilter}
				onClearFilters={actions.clearFilters}
				pickerOpen={pickerOpen}
				onPickerOpenChange={setPickerOpen}
				pickerInitialField={pickerInitialField}
				onPickerInitialFieldConsumed={() => setPickerInitialField(null)}
				searchInputRef={searchInputRef}
				rightSlot={
					<div className="jd:flex jd:items-center jd:gap-2">
						{!compact && sortOptions.length > 0 && <SortDropdown options={sortOptions} value={state.sort} onChange={actions.setSort} />}
						{!compact && <GroupByMenu columns={table.columns} value={state.groupBy} onChange={(g) => { setCollapsed(new Set()); actions.setGroupBy(g) }} />}
						<ColumnVisibilityMenu
							columns={effectiveOrder}
							hiddenColumns={state.hiddenColumns}
							onToggle={actions.toggleColumn}
							onShowAll={() => actions.setHiddenColumns([])}
							{...(expandInline
								? {
										detailColumns: detailIds,
										onToggleDetail: (id: string) => actions.setDetailColumns(detailIds.includes(id) ? detailIds.filter((x) => x !== id) : [...detailIds, id]),
									}
								: {})}
						/>
						{enableViews && (
							<ViewSelector
								views={views}
								activeViewId={state.viewId}
								state={state}
								onSelectView={handleSelectView}
								onCreateView={async (name) => {
									const v = await saveView({
										id: makeViewId(),
										name,
										state: {
											search: state.search,
											filters: state.filters,
											sort: state.sort,
											hiddenColumns: state.hiddenColumns,
											columnOrder: state.columnOrder,
											columnSizes: state.columnSizes,
											groupBy: state.groupBy,
											detailColumns: state.detailColumns,
										},
										createdAt: new Date().toISOString(),
										updatedAt: new Date().toISOString(),
									})
									actions.setViewId(v.id)
									return v
								}}
								onUpdateView={async (v) => saveView(v)}
								onDeleteView={async (id) => {
									await removeView(id)
									if (state.viewId === id) actions.setViewId(null)
								}}
								onSetDefault={setDefaultView}
								onSetFavorite={setViewFavorite}
							/>
						)}
						<MoreMenu
							items={[
								...(expandInline
									? [
											{ id: "expand-all", label: L.expandAll, onSelect: () => setExpanded(new Set(nodes)) },
											{ id: "collapse-all", label: L.collapseAll, onSelect: () => setExpanded(new Set()) },
										]
									: []),
								...(checkboxes ? [{ id: "select-all", label: fill(L.selectAllMatches, { n: totalCount }), onSelect: () => setSelection(new Set(filtered)) }] : []),
								...(state.groupBy.length ? [{ id: "no-group", label: L.noGrouping, onSelect: () => actions.setGroupBy([]) }] : []),
							]}
						/>
						{exportable && !compact && <TableExportButton ctx={exportCtx} fields={exportFields} filename={`${table.name}.csv`} label={L.export} />}
						{toolbarEnd}
					</div>
				}
			/>
			</div>

			{/* Table: scrolls inside its own box (both axes), never the page. */}
			<QuickFilters
				table={table}
				conditions={state.filters}
				onSet={(column, cond) => {
					const existing = state.filters.find((f) => f.fieldId === column)
					if (!cond) {
						if (existing) actions.removeFilter(existing.id)
						return
					}
					if (existing) actions.updateFilter({ ...cond, id: existing.id })
					else actions.addFilter({ ...cond, id: `qf:${column}` })
				}}
			/>
			{restrictLabel && onClearRestrict && (
				<div className="jd:flex jd:items-center">
					<span className="jd:border-card-border jd:bg-muted/60 jd:inline-flex jd:h-6 jd:items-center jd:gap-1 jd:rounded-md jd:border jd:px-2 jd:text-[12px]" data-jd="master-chip">
						{fill(L.filteredBy, { what: restrictLabel })}
						<button type="button" aria-label={L.clear} onClick={onClearRestrict} className="jd:text-muted-foreground jd:hover:text-foreground jd:cursor-pointer jd:px-0.5">
							✕
						</button>
					</span>
				</div>
			)}
			<SelectionBar count={checkboxes ? selection.size : 0} total={totalCount} onSelectAll={() => setSelection(new Set(filtered))} onCopy={(f) => void copyRows([...selection], f)} onClear={() => setSelection(new Set())} />
			<div data-jd="table-scroll" className={cn("jd:@container jd:bg-background jd:rounded-md jd:border", compact ? "jd:overflow-x-auto jd:overflow-y-hidden" : "jd:max-h-[70vh] jd:overflow-auto")}>
				<Table
					data-jd="table"
					style={{ tableLayout: "fixed", width: totalWidth }}
					className={cn(
						"jd:[&_tr]:border-b jd:[&_tr]:border-border",
						"jd:[&_th:not(:last-child)]:border-r jd:[&_td:not(:last-child)]:border-r",
						"jd:[&_th]:border-border jd:[&_td]:border-border",
						cls_.table,
					)}
				>
					<TableHeader data-jd="thead" className={cn("jd:bg-background jd:border-b", !compact && "jd:sticky jd:top-0 jd:z-10", cls_.thead)}>
						<TableRow className="jd:hover:bg-transparent">
							{expandInline && <TableHead className={cn("jd:bg-muted jd:w-7 jd:px-0 jd:py-0", D.head)} style={{ width: SPECIAL_W }} aria-label={L.expandRow} />}
							{checkboxes && (
								<TableHead className={cn("jd:bg-muted jd:w-8 jd:px-0 jd:py-0 jd:text-center", D.head)} style={{ width: SPECIAL_W }}>
									<input
										type="checkbox"
										aria-label={L.selectPage}
										data-jd="select-page"
										checked={nodes.length > 0 && nodes.every((r) => selection.has(r))}
										onChange={(e) => {
											const next = new Set(selection)
											for (const r of nodes) e.target.checked ? next.add(r) : next.delete(r)
											setSelection(next)
										}}
										className="jd:accent-[var(--jds-primary)]"
									/>
								</TableHead>
							)}
							{visibleColumns.map((col) => {
								const sortId = col.meta?.sortFieldId ?? col.id
								const sortable = sortFieldIds.has(sortId)
								const pin = pinOffsets.get(col.id)
								const align = specs.get(col.id)?.spec.align
								const sortIdx = state.sort.findIndex((s) => s.fieldId === sortId)
								return (
									<TableHead
										key={col.id}
										style={{ width: widthFor(col), ...pin, ...(pin ? { zIndex: 12 } : {}) }}
										data-col-id={col.id}
										data-jd-pin={specs.get(col.id)?.spec.pin}
										className={cn(
											"jd:group/header jd:bg-muted jd:text-muted-foreground jd:py-0 jd:px-3 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider",
											D.head,
											cls_.th,
											// Utilities are !important, so a pinned header must not also get 'relative'.
											pin ? "jd:sticky" : "jd:relative",
											pinEdge(specs.get(col.id)?.spec.pin),
										)}
										onDragOver={(e: React.DragEvent) => {
											e.preventDefault()
											e.dataTransfer.dropEffect = "move"
										}}
										onDrop={(e: React.DragEvent) => {
											e.preventDefault()
											const dragged = e.dataTransfer.getData("text/plain")
											if (!dragged || dragged === col.id) return
											const ids = effectiveOrder.map((c) => c.id)
											const from = ids.indexOf(dragged)
											const to = ids.indexOf(col.id)
											if (from < 0 || to < 0) return
											const next = [...ids]
											next.splice(from, 1)
											next.splice(to, 0, dragged)
											actions.setColumnOrder(next)
										}}
									>
										<div className="jd:flex jd:items-center jd:gap-1">
											{/* Label = drag handle + sort toggle (click / shift-click). */}
											<button
												type="button"
												draggable
												onDragStart={(e: React.DragEvent) => {
													e.dataTransfer.setData("text/plain", col.id)
													e.dataTransfer.effectAllowed = "move"
												}}
												onClick={(e) => sortable && handleHeaderSort(sortId, e.shiftKey)}
												title="Click to sort, shift-click to add a sort, drag to reorder"
												data-jd-sort={col.id}
												className={cn(
													"jd:flex jd:min-w-0 jd:flex-1 jd:items-center jd:gap-1 jd:text-left jd:uppercase jd:hover:text-foreground",
													sortable ? "jd:cursor-pointer" : "jd:cursor-default",
													align === "right" && "jd:flex-row-reverse jd:text-right",
													align === "center" && "jd:justify-center",
													sortIdx >= 0 && "jd:text-foreground",
												)}
											>
												<span className="jd:truncate">{typeof col.header === "function" ? col.header() : col.header}</span>
												{sortIdx >= 0 && state.sort.length > 1 && (
													<span className="jd:text-[9px] jd:tabular-nums">{sortIdx + 1}</span>
												)}
											</button>
											<ColumnHeaderMenu
												column={col}
												sortFieldIds={sortFieldIds}
												filterFieldIds={filterFieldIds}
												hideable={col.meta?.hideable !== false}
												currentSort={state.sort}
												onSort={(rule) => actions.setSort(rule ? [rule] : [])}
												onFilter={handleColumnFilter}
												onHide={() => actions.toggleColumn(col.id)}
											/>
										</div>
										<button
											type="button"
											onMouseDown={(e) => startResize(col.id, e)}
											onTouchStart={(e) => startResize(col.id, e)}
											onClick={(e) => e.stopPropagation()}
											className="jd:absolute jd:right-0 jd:top-0 jd:h-full jd:w-1 jd:cursor-col-resize jd:select-none jd:bg-transparent jd:hover:bg-primary/40 jd:active:bg-primary"
											aria-label="Resize column"
										/>
									</TableHead>
								)
							})}
						</TableRow>
					</TableHeader>
					<TableBody data-jd="tbody" className={cls_.tbody}>
						{nodes.length === 0 ? (
							<TableRow className="jd:hover:bg-transparent">
								<TableCell colSpan={colCount + specialCols || 1} className="jd:p-0">
									<div className="jd:sticky jd:left-0 jd:w-[100cqw] jd:whitespace-normal">
										<EmptyState filtered={isFiltered} onClearFilters={isFiltered ? clearAll : undefined} />
									</div>
								</TableCell>
							</TableRow>
						) : (
							pageEntries.map((entry, i) => {
								if (entry.kind === "group") {
									const g = entry.node
									const col = table.columns.find((c) => c.id === g.field)
									return (
										<TableRow key={`g:${entry.path}`} data-jd-group={entry.path} className={cn("jd:bg-muted/50 jd:hover:bg-muted/70 jd:border-b", cls_.groupRow)}>
											<TableCell colSpan={specialCols + 1} className={cn("jd:px-2 jd:text-[12px]", D.cell)} style={{ paddingLeft: 8 + g.depth * 16 }}>
												<button
													type="button"
													aria-expanded={entry.open}
													data-jd="group-toggle"
													onClick={() =>
														setCollapsed((prev) => {
															const next = new Set(prev)
															if (next.has(entry.path)) next.delete(entry.path)
															else next.add(entry.path)
															return next
														})
													}
													className="jd:flex jd:cursor-pointer jd:items-center jd:gap-1.5 jd:whitespace-nowrap"
												>
													<ChevronRight className={cn("jd:h-3.5 jd:w-3.5 jd:transition-transform", entry.open && "jd:rotate-90")} />
													<span className="jd:text-muted-foreground">{col?.label ?? g.field}:</span>
													<span className="jd:font-medium">{g.key}</span>
													<span className="jd:bg-tab-badge jd:inline-flex jd:h-4 jd:min-w-4 jd:items-center jd:justify-center jd:rounded-full jd:px-1 jd:text-[10px] jd:tabular-nums" data-jd="group-count">
														{g.count}
													</span>
												</button>
											</TableCell>
											{visibleColumns.slice(1).map((c) => {
												const agg = g.aggregates[c.id]
												const spec = specs.get(c.id)?.spec
												return (
													<TableCell key={c.id} className={cn("jd:px-3 jd:text-[12px] jd:font-medium jd:tabular-nums", D.cell, alignClass(c.id))} data-jd-agg={agg === undefined ? undefined : c.id}>
														{agg === undefined || !spec ? null : (formatValue(agg, {}, spec, renderCtx.formats) ?? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(agg))}
													</TableCell>
												)
											})}
										</TableRow>
									)
								}
								const row = entry.row
								const open = expandInline && expanded.has(row)
								return (
									<React.Fragment key={table.key ? `r:${String(row[table.key])}` : `r:${page}-${i}`}>
										<TableRow
										tabIndex={0}
										data-jd-row=""
										aria-selected={checkboxes || selectOnClick ? selection.has(row) : undefined}
										aria-expanded={expandInline ? open : undefined}
										onClick={(e) => {
											// Focus the row first so the drawer / menus can hand focus back to it.
											e.currentTarget.focus()
											if ((checkboxes && (e.metaKey || e.ctrlKey || e.shiftKey)) || selectOnClick) return selectRow(row, e)
											if (table.onRowClick) return table.onRowClick(row)
											if (onRowOpen) onRowOpen(row)
										}}
										onKeyDown={(e) => {
											if (e.target !== e.currentTarget) return
											if ((e.key === "Enter" || e.key === " ") && expandInline) {
												e.preventDefault()
												toggleExpand(row)
											} else if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
												e.preventDefault()
												const r = e.currentTarget.getBoundingClientRect()
												setMenu({ x: r.left + 24, y: r.top + r.height, row })
											}
										}}
										onContextMenu={(e) => {
											e.preventDefault()
											const cell = (e.target as HTMLElement).closest("[data-col-id]")
											setMenu({ x: e.clientX, y: e.clientY, row, col: cell?.getAttribute("data-col-id") ?? undefined })
										}}
										className={cn(
											"jd:border-border jd:hover:bg-muted/40 jd:border-b jd:last:border-b-0",
											(table.onRowClick || onRowOpen || selectOnClick) && "jd:cursor-pointer",
											selection.has(row) && "jd:bg-primary/5",
											"jd:outline-none jd:focus-visible:ring-2 jd:focus-visible:ring-inset jd:focus-visible:ring-ring",
											table.rowClass?.(row),
										cls_.tr,
										)}
									>
										{expandInline && (
											<TableCell className="jd:w-7 jd:px-0 jd:py-0 jd:text-center jd:align-middle" style={{ width: SPECIAL_W }}>
												<button
													type="button"
													tabIndex={-1}
													aria-label={open ? L.collapseRow : L.expandRow}
													data-jd="expand"
													onClick={(e) => {
														e.stopPropagation()
														toggleExpand(row)
													}}
													className="jd:text-muted-foreground jd:hover:text-foreground jd:inline-flex jd:h-5 jd:w-5 jd:cursor-pointer jd:items-center jd:justify-center jd:rounded jd:p-0 jd:align-middle"
												>
													<ChevronRight className={cn("jd:h-4 jd:w-4 jd:transition-transform", open && "jd:rotate-90")} />
												</button>
											</TableCell>
										)}
										{checkboxes && (
											<TableCell className="jd:w-8 jd:px-0 jd:py-0 jd:text-center jd:align-middle" style={{ width: SPECIAL_W }}>
												<input
													type="checkbox"
													aria-label={L.selectRow}
													data-jd="select-row"
													checked={selection.has(row)}
													onClick={(e) => {
														e.stopPropagation()
														selectRow(row, e, true)
													}}
													onChange={() => {}}
													className="jd:accent-[var(--jds-primary)]"
												/>
											</TableCell>
										)}
										{visibleColumns.map((col) => {
											const meta = specs.get(col.id)
											const pin = pinOffsets.get(col.id)
											return (
												<TableCell
													key={col.id}
													data-col-id={col.id}
													data-jd-wrap={meta?.spec.wrap ? "" : undefined}
													title={meta?.tooltip(row)}
													style={{ width: widthFor(col), ...pin }}
													className={cn(
														"jd:text-[13px] jd:overflow-hidden jd:px-3 jd:align-middle",
													D.cell,
														meta?.spec.wrap ? "jd:whitespace-normal jd:break-words" : "jd:whitespace-nowrap",
														alignClass(col.id),
														cls_.td,
														table.cellClass?.(row, col.id),
														pin && "jd:bg-background",
														pinEdge(meta?.spec.pin),
														col.meta?.className,
													)}
												>
													<div className={cn("jd:flex jd:min-w-0 jd:items-center", meta?.spec.align === "right" && "jd:justify-end", meta?.spec.align === "center" && "jd:justify-center")}>
														{col.cell(row, i)}
													</div>
												</TableCell>
											)
										})}
									</TableRow>
										{open && (
											<TableRow className="jd:hover:bg-transparent jd:border-b" data-jd="detail-row">
												<TableCell colSpan={specialCols + visibleColumns.length} className="jd:p-0">
													<div className="jd:sticky jd:left-0 jd:w-[100cqw] jd:max-w-full">
														<RowDetail row={row} table={table} fields={detailFields} depth={depth} parentId={scope} onlyRelation={table.expandRelation} className={cls_.detailPanel} />
													</div>
												</TableCell>
											</TableRow>
										)}
									</React.Fragment>
								)
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Status bar: counts left, page size + pagination right. Nested tables show it only when they page. */}
			{(!compact || totalCount > state.pageSize) && (
			<div data-jd="status-bar" className={cn("jd:flex jd:flex-wrap jd:items-center jd:justify-between jd:gap-2 jd:px-1", cls_.pagination)}>
				<div className="jd:text-muted-foreground jd:flex jd:items-center jd:gap-2 jd:text-[11px] jd:tabular-nums" data-jd="count">
					<span>{totalCount === rows.length ? fill(plural(L, rows.length, "rows", "rowsOne"), { n: rows.length }) : fill(plural(L, rows.length, "rowsFiltered", "rowsFilteredOne"), { shown: totalCount, total: rows.length })}</span>
					{state.sort.length > 0 && (
						<>
							<span className="jd:text-border">·</span>
							<span>{L.sortedBy} {state.sort.map((s) => `${s.fieldId} ${s.direction === "desc" ? "↓" : "↑"}`).join(", ")}</span>
						</>
					)}
					<span className="jd:text-border">·</span>
					<button
						type="button"
						onClick={() => setShortcutsOpen(true)}
						className="jd:text-muted-foreground jd:hover:text-foreground jd:inline-flex jd:h-4 jd:min-w-4 jd:cursor-pointer jd:items-center jd:justify-center jd:rounded jd:font-mono jd:text-[10px]"
						title="Keyboard shortcuts (?)"
						aria-label="Show keyboard shortcuts"
					>
						?
					</button>
				</div>
				<div className="jd:flex jd:items-center jd:gap-2">
					<PageSizeSelect value={state.pageSize} options={pageSizeOptions} onChange={actions.setPageSize} />
					<NumberedPaginationBar page={page} pageCount={pageCount} pageSize={state.pageSize} total={totalCount} onPage={actions.setPage} />
				</div>
			</div>
			)}

			<ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
			{menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems(menu.row, menu.col)} onClose={() => setMenu(null)} label={table.label} />}
		</div>
	)
}

/** Generate a stable id for a newly-saved view. */
function makeViewId(): string {
	return `v_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}
