/**
 * Renders one placed component (table, chart, stat, kv card, markdown, facets)
 * from its resolved item. Reads only the resolved spec and the page context.
 */
import * as React from "react"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { buildAuto } from "../auto"
import type { Row } from "../core/config"
import type { ResolvedItem } from "../core/layout"
import { useClassNames } from "@/lib/classnames"
import { useNested } from "@/lib/nested"
import { toText } from "../core/query"
import type { ResolvedDeck } from "../core/resolve"
import { ClientDataTable, type TableApi } from "../sdt/ClientDataTable"
import type { FilterCondition } from "../sdt/types"
import type { RenderCtx } from "./cells"
import { ChartItemView, Facets, ItemCode, KeyValueCard, Markdown, OnDemand, StatTile, Toc } from "./lazy"

/** What the page shares with every component on it. */
export type PageCtx = {
	deck: ResolvedDeck
	/** The page this item is on (heading anchors are `#/<pageId>/<anchor>`). */
	pageId: string
	renderCtx: RenderCtx
	/** Page filter bar: field → chosen value. */
	pageFilters: Record<string, string>
	register: (id: string, api: TableApi) => () => void
	/** A chart bar / slice or facet value was clicked: filter the item's target tables. */
	select: (source: ResolvedItem, field: string, value: string) => void
	focusedId: string | null
	setFocused: (id: string) => void
	openRow: (table: string, row: Row) => void
	toolbarEnd?: React.ReactNode | undefined
	/** Master–detail: each table item's selected rows, and the table behind an item id. */
	selections: Record<string, Row[]>
	setSelection: (id: string, rows: Row[]) => void
	resetKeys: Record<string, number>
	clearSelection: (id: string) => void
	itemTable: (id: string) => string | undefined
	/** Item ids that some other item uses as its master. */
	masters: ReadonlySet<string>
}
export const PageContext = React.createContext<PageCtx | null>(null)

/** Rows of a dataset (computed columns included) after the page filter bar. */
export function pageRows(ctx: PageCtx, table: string): Row[] {
	const rows = ctx.deck.tables.find((t) => t.name === table)?.rows ?? ctx.deck.datasets[table] ?? []
	const entries = Object.entries(ctx.pageFilters).filter(([f]) => rows.some((r) => f in r))
	if (entries.length === 0) return rows
	return rows.filter((r) => entries.every(([f, v]) => toText(r[f]) === v))
}

/** Page filters as engine conditions for a table (only fields the table has). */
function pageConditions(ctx: PageCtx, columns: string[]): FilterCondition[] {
	return Object.entries(ctx.pageFilters)
		.filter(([f]) => columns.includes(f))
		.map(([f, v]) => ({ id: `page:${f}`, fieldId: f, operator: "eq", value: v }))
}

function TableItemView({ item, ctx }: { item: ResolvedItem; ctx: PageCtx }) {
	const placement = item.placement
	const auto = React.useMemo(() => (placement ? buildAuto(placement, ctx.renderCtx) : null), [placement, ctx.renderCtx])
	const conds = React.useMemo(() => (placement ? pageConditions(ctx, placement.columns.map((c) => c.id)) : []), [ctx, placement])
	const nested = useNested()
	const spec = item.spec
	const masterId = spec.component === "table" ? spec.master : undefined
	const via = spec.component === "table" ? spec.via : undefined
	const whenEmpty = spec.component === "table" ? spec.whenEmpty : undefined
	const masterRows = masterId ? ctx.selections[masterId] : undefined
	const masterTable = masterId ? ctx.itemTable(masterId) : undefined
	// Rows related to the master's selection (via one relation label, or any between the two tables).
	const restrict = React.useMemo<ReadonlySet<Row> | null>(() => {
		if (!masterId || !placement || !nested || !masterTable) return null
		if (!masterRows || masterRows.length === 0) return whenEmpty === "none" ? new Set() : null
		const out = new Set<Row>()
		for (const mr of masterRows)
			for (const g of nested.relIndex.lookup(masterTable, mr)) if (g.table === placement.name && (!via || g.label === via)) for (const r of g.rows) out.add(r)
		// lookup returns the dataset's rows; map them onto this placement's rows (computed columns may make copies).
		const key = placement.key
		if (!key) return new Set(placement.rows.filter((r) => out.has(r)))
		const keys = new Set([...out].map((r) => toText(r[key])))
		return new Set(placement.rows.filter((r) => keys.has(toText(r[key]))))
	}, [masterId, masterRows, masterTable, nested, placement, via, whenEmpty])
	if (!placement || !auto) return null
	const tableName = placement.name
	const masterTableSpec = masterTable ? ctx.deck.tables.find((t) => t.name === masterTable) : undefined
	const restrictLabel =
		masterRows && masterRows.length > 0 && masterTableSpec
			? masterRows
					.slice(0, 3)
					.map((r) => toText(r[masterTableSpec.key ?? masterTableSpec.columns[0]?.id ?? ""]))
					.join(", ") + (masterRows.length > 3 ? ` +${masterRows.length - 3}` : "")
			: undefined
	const isMaster = ctx.masters.has(item.id)
	const facets = spec.component === "table" ? (spec.facets ?? []) : []
	const view = (
		<ClientDataTable
			table={placement}
			auto={auto}
			instanceId={item.id}
			active={ctx.focusedId === item.id}
			pageFilters={conds}
			onRowOpen={(row) => ctx.openRow(tableName, row)}
			exportable={spec.component === "table" ? spec.export !== false : true}
			onFocus={() => ctx.setFocused(item.id)}
			register={ctx.register}
			toolbarEnd={ctx.toolbarEnd}
			restrictRows={restrict}
			restrictLabel={restrictLabel}
			onClearRestrict={masterId ? () => ctx.clearSelection(masterId) : undefined}
			selectOnClick={isMaster && !placement.selectable}
			onSelectionChange={isMaster || placement.selectable ? (rows) => ctx.setSelection(item.id, rows) : undefined}
			selectionResetKey={ctx.resetKeys[item.id]}
		/>
	)
	if (facets.length === 0) return view
	// `facets` on a placed table: a count-per-value sidebar that filters this table only.
	return (
		<div className="jd:flex jd:gap-3 jd:max-md:flex-col" data-jd="table-with-facets">
			<div className="jd:w-48 jd:shrink-0 jd:max-md:w-full">
				<OnDemand>
					<Facets item={item} ctx={ctx} fields={facets} />
				</OnDemand>
			</div>
			<div className="jd:min-w-0 jd:flex-1">{view}</div>
		</div>
	)
}

/** Placeholder height while the chart chunk loads (a default chart: 180px plot plus axis labels and legend), so the page barely moves when it arrives. */
const CHART_PENDING_HEIGHT = 221
const SPARK_PENDING_HEIGHT = 32
/** Same for a stat tile and a key-value card (a compact stat tile is 60px tall). */
const TILE_PENDING_HEIGHT = 60

/** An item, wrapped in a Preview / Code box when its spec sets `code`. */
export function ItemView({ item }: { item: ResolvedItem }) {
	const code = item.spec.code
	if (code === undefined || code === false) return <ItemBody item={item} />
	return (
		<OnDemand>
			<ItemCode spec={item.spec} preview={<ItemBody item={item} />} />
		</OnDemand>
	)
}

function ItemBody({ item }: { item: ResolvedItem }) {
	const cls_ = useClassNames()
	const ctx = React.useContext(PageContext)
	const L = useLabels()
	if (!ctx) return null
	const spec = item.spec
	switch (spec.component) {
		case "table":
			return <TableItemView item={item} ctx={ctx} />
		case "chart":
			return (
				<OnDemand height={item.height === undefined ? (spec.type === "sparkline" ? SPARK_PENDING_HEIGHT : CHART_PENDING_HEIGHT) : undefined}>
					<ChartItemView item={item} ctx={ctx} />
				</OnDemand>
			)
		case "stat": {
			const { component, table, id, span, height, title, label, ...stat } = spec
			return (
				<OnDemand height={TILE_PENDING_HEIGHT}>
					<StatTile rows={pageRows(ctx, table)} spec={{ ...stat, label: label ?? title ?? ctx.deck.tables.find((t) => t.name === table)?.label ?? table }} className={cls_.stat} />
				</OnDemand>
			)
		}
		case "kv": {
			const { component, table, id, span, height, title, key, ...kv } = spec
			const rows = pageRows(ctx, table)
			const t = ctx.deck.tables.find((x) => x.name === table)
			const keyCol = t?.key
			const row = key !== undefined && keyCol ? rows.find((r) => toText(r[keyCol]) === toText(key)) : rows[0]
			const columnSpecs = t?.columns.map((c) => ({ id: c.id, label: c.label, type: c.type, ...(typeof c.format === "string" ? { format: c.format } : {}) }))
			return (
				<OnDemand height={TILE_PENDING_HEIGHT}>
					<KeyValueCard spec={kv} row={row} rows={rows} columnSpecs={columnSpecs} className={cls_.kv} />
				</OnDemand>
			)
		}
		case "markdown":
			return (
				<OnDemand>
					<Markdown text={spec.text} className={cls_.markdown} anchorPage={ctx.pageId} />
				</OnDemand>
			)
		case "toc":
			return (
				<OnDemand>
					<Toc pageId={ctx.pageId} />
				</OnDemand>
			)
		case "facets":
			return (
				<OnDemand>
					<Facets item={item} ctx={ctx} fields={spec.fields} />
				</OnDemand>
			)
		default:
			return <div className={cn("jd:text-muted-foreground")}>{L.nothingToShow}</div>
	}
}
