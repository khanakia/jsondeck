/**
 * A chart item on a page (data from the page's rows, click-to-filter, palette,
 * fitting a fixed-height box), with the chart itself: one on-demand chunk,
 * loaded when a page shows a chart.
 */
import * as React from "react"
import { useClassNames } from "@/lib/classnames"
import { cn } from "@/lib/utils"
import type { Row } from "../core/config"
import type { ResolvedItem } from "../core/layout"
import { toText } from "../core/query"
import { type PageCtx, pageRows } from "./Items"
import { Chart } from "../viz/Chart"

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

export function ChartItemView({ item, ctx }: { item: ResolvedItem; ctx: PageCtx }) {
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
		</div>
	)
}

