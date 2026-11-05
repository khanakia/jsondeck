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
import { toSource } from "../core/serialize"
import type { RenderCtx } from "./cells"
import { Chart, CodeView, KeyValueCard, Markdown, OnDemand, StatTile, Toc } from "./lazy"

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
				<Facets item={item} ctx={ctx} fields={facets} />
			</div>
			<div className="jd:min-w-0 jd:flex-1">{view}</div>
		</div>
	)
}

/** Count per value for each field; clicking a value filters the target tables. */
function Facets({ item, ctx, fields }: { item: ResolvedItem; ctx: PageCtx; fields: string[] }) {
	const rows = pageRows(ctx, item.table ?? "")
	const table = ctx.deck.tables.find((t) => t.name === item.table)
	const max = 12
	return (
		<div className="jd:flex jd:flex-col jd:gap-3" data-jd="facets">
			{fields.map((f) => {
				const counts = new Map<string, number>()
				for (const r of rows) {
					const v = toText(r[f]) || "(empty)"
					counts.set(v, (counts.get(v) ?? 0) + 1)
				}
				const list = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max)
				const top = list[0]?.[1] ?? 1
				const label = table?.columns.find((c) => c.id === f)?.label ?? f
				return (
					<div key={f}>
						<div className="jd:text-muted-foreground jd:mb-1 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">{label}</div>
						<div className="jd:flex jd:flex-col">
							{list.map(([v, n]) => (
								<button
									key={v}
									type="button"
									data-jd-facet={`${f}=${v}`}
									onClick={() => ctx.select(item, f, v)}
									className="jd:hover:bg-muted jd:relative jd:flex jd:h-6 jd:cursor-pointer jd:items-center jd:justify-between jd:gap-2 jd:rounded jd:px-1.5 jd:text-left jd:text-[12px]"
								>
									<span className="jd:bg-primary/10 jd:absolute jd:inset-y-0.5 jd:left-0 jd:rounded" style={{ width: `${(n / top) * 100}%` }} />
									<span className="jd:relative jd:truncate">{v}</span>
									<span className="jd:text-muted-foreground jd:relative jd:tabular-nums">{n}</span>
								</button>
							))}
						</div>
					</div>
				)
			})}
		</div>
	)
}

/** Stable colour order: the groupBy values of the UNFILTERED rows, so colours don't shift when filters change. */
function colorDomainFor(rows: Row[], field: string | undefined): string[] | undefined {
	if (!field) return undefined
	const seen = new Set<string>()
	for (const r of rows) seen.add(toText(r[field]) || "(empty)")
	return [...seen]
}

/** Most corrections the fit loop makes per size change (it converges in 1–2). */
const FIT_PASSES = 4
/** Smallest plot height a fitted chart gets. */
const MIN_PLOT = 60

/**
 * For a fixed-height item: the chart's plot height so the whole figure (title,
 * legend, axes) fits the box exactly, measured with ResizeObserver, never
 * overflowing by a few px. Returns undefined for auto-height items.
 */
function useFitHeight(box: React.RefObject<HTMLDivElement | null>, fixed: boolean): number | undefined {
	const [avail, setAvail] = React.useState<number | undefined>(undefined)
	const [extra, setExtra] = React.useState(0)
	const passes = React.useRef(0)
	React.useLayoutEffect(() => {
		const el = box.current
		if (!el || !fixed) return
		const measure = () => {
			passes.current = 0
			setAvail(el.clientHeight)
		}
		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [box, fixed])
	React.useLayoutEffect(() => {
		const fig = box.current?.firstElementChild
		// Nothing to fit while the chart chunk is still loading (the placeholder must not use up the passes).
		if (avail === undefined || !fig || fig.getAttribute("data-jd") === "pending" || passes.current >= FIT_PASSES) return
		const over = fig.getBoundingClientRect().height - avail
		if (over > 0.5 || over < -1) {
			passes.current += 1
			setExtra((e) => Math.max(0, e + over))
		}
	})
	return avail === undefined ? undefined : Math.max(MIN_PLOT, Math.floor(avail - extra))
}

function ChartItemView({ item, ctx }: { item: ResolvedItem; ctx: PageCtx }) {
	const [selected, setSelected] = React.useState<string | undefined>(undefined)
	const box = React.useRef<HTMLDivElement>(null)
	const cls_ = useClassNames()
	const fit = useFitHeight(box, item.height !== undefined)
	const spec = item.spec
	if (spec.component !== "chart") return null
	const { component, table, targets, id, span, height, title, ...chart } = spec
	const field = typeof chart.groupBy === "string" && !chart.bucket ? chart.groupBy : undefined
	const all = ctx.deck.tables.find((t) => t.name === table)?.rows ?? []
	const domain = colorDomainFor(all, typeof chart.series === "string" ? chart.series : field)
	// A groupBy column with a value order (config `order`, or a known one like severity) sorts the bars that way.
	const order = field && chart.sort === undefined ? ctx.deck.tables.find((t) => t.name === table)?.columns.find((c) => c.id === field)?.order : undefined
	// Palette: this chart's, else the global one, assigned in colour-domain order; explicit `colors` win.
	const palette = chart.palette ?? ctx.deck.palette
	const paletteColors = palette?.length && domain ? Object.fromEntries(domain.map((v, i) => [v, palette[i % palette.length] ?? ""])) : undefined
	const withColors = paletteColors ? { ...chart, colors: { ...paletteColors, ...(chart.colors ?? {}) } } : chart
	const sized = fit !== undefined ? { ...withColors, height: fit } : withColors
	return (
		<div ref={box} className={cn("jd:h-full jd:min-h-0 jd:overflow-hidden", cls_.chart)} data-jd="chart-box">
		<OnDemand height={item.height === undefined ? (chart.type === "sparkline" ? SPARK_PENDING_HEIGHT : CHART_PENDING_HEIGHT) : undefined}>
		<Chart
			rows={pageRows(ctx, table)}
			spec={order ? { ...sized, sort: order } : sized}
			{...(domain ? { colorDomain: domain } : {})}
			{...(selected ? { selected } : {})}
			onSelect={(value) => {
				if (!field) return
				setSelected(value)
				ctx.select(item, field, value)
			}}
		/>
		</OnDemand>
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
	const { code: _code, ...rest } = item.spec
	const src = typeof code === "string" ? code : toSource(rest)
	return (
		<OnDemand>
			<CodeView code={src} lang="js" preview={<ItemBody item={item} />} />
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
			return <ChartItemView item={item} ctx={ctx} />
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
			return <Facets item={item} ctx={ctx} fields={spec.fields} />
		default:
			return <div className={cn("jd:text-muted-foreground")}>{L.nothingToShow}</div>
	}
}
