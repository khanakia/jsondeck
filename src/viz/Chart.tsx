/**
 * Chart: hand-drawn SVG, no chart library. Props in, events out: it reads no
 * config and holds no global state. It aggregates `rows` with `spec`
 * (see core/aggregate.ts), then draws one of the CHART_TYPES.
 *
 * A click (or Enter) on a bar, slice or point calls `onSelect(key, series?)`
 * with the group value, so a table beside it can filter. "Other" is not
 * clickable (it is not one value).
 */
import { type KeyboardEvent, type ReactNode, useLayoutEffect, useMemo, useRef, useState } from "react"
import { type AggregateSpec, type AggResult, aggregate, OTHER_KEY, parseMeasure, type Row, SINGLE_SERIES } from "../core/aggregate"
import { humanize } from "../core/labels"
import { colorScale, cssColor, isSeverityDomain, SLOT_COUNT } from "./colors"
import { formatNumber, formatPercent, niceTicks } from "./format"
import "./viz.css"

export const CHART_TYPES = ["bar", "stacked", "grouped", "line", "area", "pie", "donut", "sparkline"] as const
export type ChartType = (typeof CHART_TYPES)[number]

export type ChartSpec = AggregateSpec & {
	type: ChartType
	title?: string | undefined
	/** bar / stacked / grouped: draw bars left-to-right with labels on the left (best for long labels). */
	horizontal?: boolean | undefined
	/** Plot height in px (horizontal bars grow with the number of rows instead). */
	height?: number | undefined
	/** Value or series → colour (hex or a token name: s1…s8, good, warning, serious, critical, other). */
	colors?: Record<string, string> | undefined
	/** Hide the legend even with several series. */
	legend?: boolean | undefined
}

export type ChartProps = {
	rows: Row[]
	spec: ChartSpec
	onSelect?: (value: string, series?: string) => void | undefined
	/** Highlight these keys and dim the rest (e.g. the table's current filter). */
	selected?: string | string[] | undefined
	/** Stable value order for colour slots (pass the values from the unfiltered rows). */
	colorDomain?: string[] | undefined
	className?: string | undefined
}

const DEFAULT_HEIGHT = 180
const SPARK_HEIGHT = 32
const MAX_BAR = 24 // px: bars never fill the slot, the leftover is air
const GAP = 2 // px surface gap between touching marks
const RADIUS = 4 // px rounded data end
const H_ROW = 22 // px per row in a horizontal bar chart
const CHAR_W = 6.2 // px: fallback width of one 11px character when text cannot be measured
const DEFAULT_TOP: Partial<Record<ChartType, number>> = { pie: 7, donut: 7, bar: 20, stacked: 20, grouped: 12 }

type Tip = { x: number; y: number; title: string; lines: { color: string; label: string; value: string }[] } | null

/** Axis/label font size in px; must match `axisText.fontSize`. */
const AXIS_FONT_PX = 11
let measureCtx: CanvasRenderingContext2D | null | undefined

/**
 * Text width in px for the chart's real font (read from the element's computed
 * font-family), measured on a shared offscreen canvas. Falls back to the
 * per-character estimate when canvas is unavailable (e.g. jsdom).
 */
export function makeMeasure(el: Element | null): (s: string) => number {
	if (measureCtx === undefined) measureCtx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null
	const ctx = measureCtx
	const family = el ? getComputedStyle(el).fontFamily : "sans-serif"
	if (!ctx) return (s) => s.length * CHAR_W
	const font = `${AXIS_FONT_PX}px ${family}`
	return (s) => {
		ctx.font = font
		return ctx.measureText(s).width
	}
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
	const ref = useRef<T>(null)
	const [w, setW] = useState(0)
	useLayoutEffect(() => {
		const el = ref.current
		if (!el) return
		setW(el.clientWidth)
		const ro = new ResizeObserver((entries) => {
			const e = entries[0]
			if (e) setW(Math.floor(e.contentRect.width))
		})
		ro.observe(el)
		return () => ro.disconnect()
	}, [])
	return [ref, w]
}

const trunc = (s: string, px: number) => {
	const max = Math.max(1, Math.floor(px / CHAR_W))
	return s.length > max ? `${s.slice(0, Math.max(1, max - 1))}…` : s
}

/** keys × series cell; 0 when out of range (the matrix is always full, so this is only a type guard). */
const cellAt = (d: AggResult, i: number, j: number) => d.cells[i]?.[j] ?? 0
const rowAt = (d: AggResult, i: number): number[] => d.cells[i] ?? []
const at = (a: readonly number[], i: number) => a[i] ?? 0
const keyAt = (d: AggResult, i: number) => d.keys[i] ?? ""
/** Bounding box of the svg holding a mark, for tooltip coordinates. */
const svgBox = (el: Element): DOMRect => (el.closest("svg") ?? el).getBoundingClientRect()

/** Rect with a rounded data end and a square baseline. `dir` is where the data end points. */
function barPath(x: number, y: number, w: number, h: number, dir: "up" | "right", round = true): string {
	if (w <= 0 || h <= 0) return ""
	const r = round ? Math.min(RADIUS, dir === "up" ? w / 2 : h / 2, dir === "up" ? h : w) : 0
	if (dir === "up")
		return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
	return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`
}

function describe(spec: ChartSpec): string {
	const m = parseMeasure(spec.measure)
	const what = m.op === "count" ? "count" : `${m.op} of ${m.field}`
	const by = typeof spec.groupBy === "string" ? ` by ${humanize(spec.groupBy)}` : ""
	const split = typeof spec.series === "string" ? ` and ${humanize(spec.series)}` : ""
	return `${humanize(spec.type)} chart: ${what}${by}${split}`
}

export function Chart({ rows, spec, onSelect, selected, colorDomain, className }: ChartProps) {
	const [ref, width] = useWidth<HTMLDivElement>()
	const [tip, setTip] = useState<Tip>(null)
	const [hover, setHover] = useState<number | null>(null)
	const multi = spec.type === "stacked" || spec.type === "grouped" || ((spec.type === "line" || spec.type === "area") && spec.series !== undefined)
	const data = useMemo(
		() =>
			aggregate(rows, {
				...spec,
				top: spec.top ?? DEFAULT_TOP[spec.type],
				// Never more series than colour slots: the rest folds into "Other".
				topSeries: spec.topSeries ?? (multi ? SLOT_COUNT - 1 : undefined),
			}),
		[rows, spec, multi],
	)
	const label = spec.title ?? describe(spec)
	const sel = selected === undefined ? null : new Set(Array.isArray(selected) ? selected : [selected])
	const empty = data.keys.length === 0 || data.totals.every((t) => t === 0)

	const clickable = !!onSelect
	const markProps = (key: string, series?: string) => {
		const can = clickable && key !== OTHER_KEY
		return {
			className: `jdv-mark${sel?.has(key) ? " jdv-on" : ""}`,
			style: { cursor: can ? "pointer" : undefined },
			tabIndex: can ? 0 : undefined,
			role: can ? "button" : undefined,
			"aria-label": can ? `${key}${series && series !== SINGLE_SERIES ? `, ${series}` : ""}` : undefined,
			"data-key": key,
			onClick: can ? () => onSelect?.(key, series === SINGLE_SERIES ? undefined : series) : undefined,
			onKeyDown: can
				? (e: KeyboardEvent) => {
						if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(key, series === SINGLE_SERIES ? undefined : series) }
					}
				: undefined,
		}
	}

	/** Invisible hit target (bigger than the mark): click selects, no focus stop (the mark itself has one). */
	const hitProps = (key: string) => ({
		style: { cursor: clickable && key !== OTHER_KEY ? "pointer" : undefined },
		onClick: clickable && key !== OTHER_KEY ? () => onSelect?.(key) : undefined,
	})

	let body: ReactNode = null
	let legend: { label: string; color: string; value?: string }[] = []
	if (!empty && width > 0) {
		const common: DrawArgs = { data, spec, width, setTip, markProps, hitProps, colorDomain, hover, setHover, measure: makeMeasure(ref.current) }
		const r =
			spec.type === "pie" || spec.type === "donut" ? drawPie(common)
			: spec.type === "line" || spec.type === "area" || spec.type === "sparkline" ? drawLine(common)
			: spec.horizontal ? drawHBars(common)
			: drawBars(common)
		body = r.svg
		legend = r.legend
	}
	const showLegend = spec.legend !== false && legend.length > 1 && spec.type !== "sparkline"

	return (
		<figure className={`jd:relative jd:min-w-0 ${className ?? ""}`} data-jd-chart={spec.type}>
			{spec.title && spec.type !== "sparkline" && <figcaption className="jd:mb-1 jd:text-xs jd:font-medium jd:text-foreground">{spec.title}</figcaption>}
			{showLegend && (
				<ul className="jd:mb-1 jd:flex jd:flex-wrap jd:gap-x-3 jd:gap-y-0.5 jd:text-[11px] jd:text-muted-foreground" data-jd="legend">
					{legend.map((l) => (
						<li key={l.label} className="jd:inline-flex jd:items-center jd:gap-1">
							<span className="jd:inline-block jd:size-2 jd:rounded-[2px]" style={{ background: l.color }} />
							<span>{l.label}</span>
							{l.value && <span className="jd:tabular-nums jd:text-foreground">{l.value}</span>}
						</li>
					))}
				</ul>
			)}
			<div ref={ref} className={`jd:relative jd:w-full${sel ? " jdv-dim" : ""}`} onMouseLeave={() => setTip(null)}>
				{empty ? (
					<div
						className="jd:flex jd:items-center jd:justify-center jd:rounded jd:border jd:border-dashed jd:text-xs jd:text-muted-foreground"
						style={{ height: spec.type === "sparkline" ? SPARK_HEIGHT : (spec.height ?? DEFAULT_HEIGHT) }}
						data-jd="chart-empty"
					>
						No data
					</div>
				) : (
					<div role="img" aria-label={label}>{body}</div>
				)}
				{tip && (
					<div
						className="jd:pointer-events-none jd:absolute jd:z-10 jd:min-w-28 jd:rounded jd:border jd:px-2 jd:py-1 jd:text-[11px] jd:shadow-sm"
						style={{
							left: Math.min(Math.max(0, tip.x + 10), Math.max(0, width - 160)),
							top: Math.max(0, tip.y - 8),
							background: "var(--jdv-tip-bg)",
							borderColor: "var(--jdv-tip-border)",
							color: "var(--jdv-ink)",
						}}
						data-jd="tooltip"
					>
						<div className="jd:mb-0.5 jd:font-medium">{tip.title}</div>
						{tip.lines.map((l) => (
							<div key={l.label} className="jd:flex jd:items-center jd:gap-1.5">
								<span className="jd:inline-block jd:size-2 jd:rounded-[2px]" style={{ background: l.color }} />
								<span style={{ color: "var(--jdv-ink-2)" }}>{l.label}</span>
								<span className="jd:ml-auto jd:pl-2 jd:tabular-nums">{l.value}</span>
							</div>
						))}
					</div>
				)}
			</div>
			{!empty && <DataTable data={data} caption={label} />}
		</figure>
	)
}

/** Screen-reader copy of the numbers (also the "table view" the palette relief rule asks for). */
function DataTable({ data, caption }: { data: AggResult; caption: string }) {
	const single = data.series.length === 1 && (data.series[0] ?? SINGLE_SERIES) === SINGLE_SERIES
	return (
		// A table cannot shrink below its content, so sr-only on the table itself still overflows
		// (a stray scrollbar in fixed-height cards); the 1px clipped box goes on a wrapper.
		<div className="jd:sr-only">
		<table>
			<caption>{caption}</caption>
			<thead>
				<tr>
					<th scope="col">Group</th>
					{single ? <th scope="col">Value</th> : data.series.map((s) => <th key={s} scope="col">{s}</th>)}
				</tr>
			</thead>
			<tbody>
				{data.keys.map((k, i) => (
					<tr key={k}>
						<th scope="row">{k}</th>
						{rowAt(data, i).map((v, j) => <td key={data.series[j]}>{formatNumber(v, false)}</td>)}
					</tr>
				))}
			</tbody>
		</table>
		</div>
	)
}

// ── drawing ─────────────────────────────────────────────────────────────

type MarkProps = (key: string, series?: string) => Record<string, unknown>
type DrawArgs = {
	data: AggResult
	spec: ChartSpec
	width: number
	setTip: (t: Tip) => void
	markProps: MarkProps
	colorDomain?: string[] | undefined
	/** Width in px of a string in the axis font. */
	measure: (s: string) => number
	hitProps: (key: string) => Record<string, unknown>
	hover: number | null
	setHover: (i: number | null) => void
}
type Drawn = { svg: ReactNode; legend: { label: string; color: string; value?: string }[] }

const axisText = { fill: "var(--jdv-muted)", fontSize: 11, fontVariantNumeric: "tabular-nums" } as const

/** Colour per bar: by key when the spec names colours or the keys are severities, else one hue per series. */
function barColors(a: DrawArgs) {
	const single = a.data.series.length === 1
	const keyColor = colorScale(a.data.keys, a.colorDomain, a.spec.colors)
	const serColor = colorScale(a.data.series, single ? undefined : a.colorDomain, a.spec.colors)
	const byKey = single && (a.spec.colors !== undefined || isSeverityDomain(a.data.keys))
	return { color: (key: string, s: string) => (single ? (byKey ? keyColor(key) : cssColor("s1")) : serColor(s)), serColor }
}

function seriesLegend(a: DrawArgs, color: (s: string) => string) {
	return a.data.series.length > 1 ? a.data.series.map((s) => ({ label: s, color: color(s) })) : []
}

function tipLines(a: DrawArgs, i: number, color: (k: string, s: string) => string) {
	const key = keyAt(a.data, i)
	const single = a.data.series.length === 1
	const lines = a.data.series.map((s, j) => ({ color: color(key, s), label: single ? humanize(measureLabel(a.spec)) : s, value: formatNumber(cellAt(a.data, i, j), false) }))
	if (!single) lines.push({ color: "transparent", label: "Total", value: formatNumber(at(a.data.totals, i), false) })
	return lines
}

function measureLabel(spec: ChartSpec) {
	const m = parseMeasure(spec.measure)
	return m.op === "count" ? "count" : `${m.op} ${m.field}`
}

function drawBars(a: DrawArgs): Drawn {
	const { data, spec, width, setTip, markProps } = a
	const height = spec.height ?? DEFAULT_HEIGHT
	const stacked = spec.type === "stacked"
	const grouped = spec.type === "grouped"
	const maxV = stacked ? Math.max(...data.totals) : Math.max(...data.cells.flat())
	const minV = Math.min(0, ...data.cells.flat())
	const ticks = niceTicks(minV, maxV, 4)
	const yMax = ticks[ticks.length - 1] ?? 0
	const yMin = ticks[0] ?? 0
	const left = Math.max(...ticks.map((t) => formatNumber(t).length)) * CHAR_W + 8
	const m = { top: 6, right: 4, bottom: 18, left }
	const iw = Math.max(10, width - m.left - m.right)
	const ih = height - m.top - m.bottom
	const y = (v: number) => m.top + ih - ((v - yMin) / (yMax - yMin || 1)) * ih
	const band = iw / data.keys.length
	const ns = data.series.length
	const groupW = grouped ? Math.min(band * 0.8, ns * MAX_BAR + (ns - 1) * GAP) : Math.min(MAX_BAR, band * 0.7)
	const barW = grouped ? (groupW - (ns - 1) * GAP) / ns : groupW
	const { color, serColor } = barColors(a)
	// Show every k-th label so they do not collide.
	const maxLabel = Math.max(...data.keys.map((k) => k.length)) * CHAR_W
	const every = Math.max(1, Math.ceil((Math.min(maxLabel, 90) + 6) / band))
	const marks: ReactNode[] = []
	const hits: ReactNode[] = []
	data.keys.forEach((key, i) => {
		const cx = m.left + band * i + band / 2
		const x0 = cx - groupW / 2
		const show = (ev: { clientX: number; clientY: number; currentTarget: Element }) => {
			const box = svgBox(ev.currentTarget)
			setTip({ x: ev.clientX - box.left, y: ev.clientY - box.top, title: key, lines: tipLines(a, i, color) })
		}
		if (stacked) {
			let acc = 0
			const last = rowAt(data, i).reduce((li, v, j) => (v > 0 ? j : li), -1)
			data.series.forEach((s, j) => {
				const v = cellAt(data, i, j)
				if (v <= 0) return
				const yTop = y(acc + v)
				const yBot = y(acc)
				const gap = acc > 0 ? GAP : 0
				marks.push(<path key={`${key}\0${s}`} d={barPath(x0, yTop, barW, Math.max(0, yBot - yTop - gap), "up", j === last)} fill={color(key, s)} {...markProps(key, s)} onMouseMove={show} />)
				acc += v
			})
		} else {
			data.series.forEach((s, j) => {
				const v = cellAt(data, i, j)
				const bx = x0 + j * (barW + GAP)
				const yTop = y(Math.max(0, v))
				const h = Math.abs(y(v) - y(0))
				marks.push(<path key={`${key}\0${s}`} d={barPath(bx, yTop, barW, h, "up")} fill={color(key, s)} {...markProps(key, s)} onMouseMove={show} />)
			})
		}
		// Invisible hit target over the whole band (bigger than the mark).
		hits.push(<rect key={`${key}\0hit`} x={m.left + band * i} y={m.top} width={band} height={ih} fill="transparent" onMouseMove={show} {...a.hitProps(key)} />)
	})
	const svg = (
		<svg width={width} height={height} aria-hidden="true">
			{ticks.map((t) => (
				<g key={t}>
					<line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--jdv-axis)" : "var(--jdv-grid)"} strokeWidth={1} shapeRendering="crispEdges" />
					<text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" style={axisText}>{formatNumber(t)}</text>
				</g>
			))}
			{hits}
			{marks}
			{data.keys.map((key, i) =>
				i % every === 0 ? (
					<text key={key} x={m.left + band * i + band / 2} y={height - 4} textAnchor="middle" style={axisText}>{trunc(key, band * every - 4)}</text>
				) : null,
			)}
		</svg>
	)
	return { svg, legend: seriesLegend(a, serColor) }
}

function drawHBars(a: DrawArgs): Drawn {
	const { data, spec, width, setTip, markProps } = a
	const stacked = spec.type === "stacked"
	const grouped = spec.type === "grouped"
	const ns = data.series.length
	const rowH = grouped ? Math.max(H_ROW, ns * 10 + 8) : H_ROW
	const maxV = stacked ? Math.max(...data.totals) : Math.max(...data.cells.flat())
	const ticks = niceTicks(0, maxV, 4)
	const xMax = ticks[ticks.length - 1] ?? 0
	const labelW = Math.min(160, Math.max(...data.keys.map(a.measure)) + 12)
	const valueW = Math.max(...data.totals.map((t) => formatNumber(t).length)) * CHAR_W + 8
	const m = { top: 4, right: valueW, bottom: 18, left: labelW }
	const iw = Math.max(10, width - m.left - m.right)
	const height = m.top + m.bottom + data.keys.length * rowH
	const x = (v: number) => m.left + (v / (xMax || 1)) * iw
	const thick = grouped ? (Math.min(rowH - 6, ns * 12) - (ns - 1) * GAP) / ns : Math.min(14, rowH - 8)
	const { color, serColor } = barColors(a)
	const marks: ReactNode[] = []
	const hits: ReactNode[] = []
	data.keys.forEach((key, i) => {
		const y0 = m.top + i * rowH
		const show = (ev: { clientX: number; clientY: number; currentTarget: Element }) => {
			const box = svgBox(ev.currentTarget)
			setTip({ x: ev.clientX - box.left, y: ev.clientY - box.top, title: key, lines: tipLines(a, i, color) })
		}
		const groupH = grouped ? ns * thick + (ns - 1) * GAP : thick
		const top = y0 + (rowH - groupH) / 2
		if (stacked) {
			let acc = 0
			const last = rowAt(data, i).reduce((li, v, j) => (v > 0 ? j : li), -1)
			data.series.forEach((s, j) => {
				const v = cellAt(data, i, j)
				if (v <= 0) return
				const gap = acc > 0 ? GAP : 0
				marks.push(<path key={`${key}\0${s}`} d={barPath(x(acc) + gap, top, Math.max(0, x(acc + v) - x(acc) - gap), thick, "right", j === last)} fill={color(key, s)} {...markProps(key, s)} onMouseMove={show} />)
				acc += v
			})
		} else {
			data.series.forEach((s, j) => {
				const v = cellAt(data, i, j)
				marks.push(<path key={`${key}\0${s}`} d={barPath(m.left, top + j * (thick + GAP), x(v) - m.left, thick, "right")} fill={color(key, s)} {...markProps(key, s)} onMouseMove={show} />)
			})
		}
		hits.push(<rect key={`${key}\0hit`} x={0} y={y0} width={width} height={rowH} fill="transparent" onMouseMove={show} {...a.hitProps(key)} />)
	})
	const svg = (
		<svg width={width} height={height} aria-hidden="true">
			{ticks.map((t) => (
				<g key={t}>
					<line x1={x(t)} x2={x(t)} y1={m.top} y2={height - m.bottom} stroke={t === 0 ? "var(--jdv-axis)" : "var(--jdv-grid)"} strokeWidth={1} shapeRendering="crispEdges" />
					<text x={x(t)} y={height - 4} textAnchor="middle" style={axisText}>{formatNumber(t)}</text>
				</g>
			))}
			{hits}
			{marks}
			{data.keys.map((key, i) => (
				<g key={key}>
					<text x={m.left - 6} y={m.top + i * rowH + rowH / 2} dy="0.32em" textAnchor="end" style={{ ...axisText, fill: "var(--jdv-ink-2)" }}>{a.measure(key) <= labelW - 8 ? key : trunc(key, labelW - 8)}</text>
					<text x={x(stacked || ns === 1 ? at(data.totals, i) : Math.max(...rowAt(data, i))) + 4} y={m.top + i * rowH + rowH / 2} dy="0.32em" style={{ ...axisText, fill: "var(--jdv-ink)" }}>{formatNumber(at(data.totals, i))}</text>
				</g>
			))}
		</svg>
	)
	return { svg, legend: seriesLegend(a, serColor) }
}

function drawLine(a: DrawArgs): Drawn {
	const { data, spec, width, setTip } = a
	const spark = spec.type === "sparkline"
	const area = spec.type === "area"
	const height = spark ? (spec.height ?? SPARK_HEIGHT) : (spec.height ?? DEFAULT_HEIGHT)
	const all = data.cells.flat()
	const ticks = spark ? [Math.min(0, ...all), Math.max(...all)] : niceTicks(Math.min(0, ...all), Math.max(...all), 4)
	const yMin = ticks[0] ?? 0
	const yMax = ticks[ticks.length - 1] ?? 0
	// Edge x labels are centred on their point, so leave half a label of room on each side.
	// Edge x labels are centred on their point: reserve half the measured first/last label so neither is clipped.
	const labelW = data.keys.map(a.measure)
	const tickW = Math.max(...ticks.map((t) => a.measure(formatNumber(t)))) + 8
	const left = spark ? 2 : Math.max(tickW, (labelW[0] ?? 0) / 2 + 2)
	const m = spark ? { top: 5, right: 5, bottom: 5, left } : { top: 8, right: Math.max(12, (labelW[labelW.length - 1] ?? 0) / 2 + 2), bottom: 18, left }
	const iw = Math.max(10, width - m.left - m.right)
	const ih = height - m.top - m.bottom
	const n = data.keys.length
	const x = (i: number) => m.left + (n === 1 ? iw / 2 : (i / (n - 1)) * iw)
	const y = (v: number) => m.top + ih - ((v - yMin) / (yMax - yMin || 1)) * ih
	const color = colorScale(data.series, data.series.length > 1 ? a.colorDomain : undefined, spec.colors)
	const single = data.series.length === 1
	const lineColor = (s: string) => (single ? (spec.colors?.[s] ? color(s) : cssColor(spark ? "muted" : "s1")) : color(s))
	const { hover, setHover } = a
	const pathFor = (j: number) => data.keys.map((_, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(cellAt(data, i, j)).toFixed(1)}`).join("")
	const maxLabel = Math.max(...labelW) + 12
	const every = Math.max(1, Math.ceil(maxLabel / (iw / Math.max(1, n - 1))))
	// Clamp a label's centre so its measured box stays inside the svg.
	const labelX = (i: number) => Math.min(Math.max(x(i), at(labelW, i) / 2 + 1), width - at(labelW, i) / 2 - 1)
	const onMove = (ev: React.MouseEvent<SVGRectElement>) => {
		const box = svgBox(ev.currentTarget)
		const px = ev.clientX - box.left
		const i = Math.max(0, Math.min(n - 1, Math.round(((px - m.left) / iw) * (n - 1))))
		setHover(i)
		setTip({ x: x(i), y: spark ? 0 : m.top, title: keyAt(data, i), lines: tipLines(a, i, (_k, s) => lineColor(s)) })
	}
	const svg = (
		<svg width={width} height={height} aria-hidden="true" onMouseLeave={() => setHover(null)}>
			{!spark &&
				ticks.map((t) => (
					<g key={t}>
						<line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? "var(--jdv-axis)" : "var(--jdv-grid)"} strokeWidth={1} shapeRendering="crispEdges" />
						<text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" style={axisText}>{formatNumber(t)}</text>
					</g>
				))}
			{data.series.map((s, j) => (
				<g key={s}>
					{area && <path d={`${pathFor(j)}L${x(n - 1)},${y(Math.max(0, yMin))}L${x(0)},${y(Math.max(0, yMin))}Z`} fill={lineColor(s)} fillOpacity={0.1} />}
					<path d={pathFor(j)} fill="none" stroke={lineColor(s)} strokeWidth={spark ? 1.5 : 2} strokeLinejoin="round" strokeLinecap="round" data-jd="line" />
				</g>
			))}
			{/* End dot on the single series: where the reader's eye goes first. */}
			{single && n > 0 && (
				<circle cx={x(n - 1)} cy={y(cellAt(data, n - 1, 0))} r={spark ? 2.5 : 4} fill={spark ? cssColor("s1") : lineColor((data.series[0] ?? SINGLE_SERIES))} stroke="var(--jdv-surface)" strokeWidth={2} />
			)}
			{hover !== null && (
				<g>
					{!spark && <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + ih} stroke="var(--jdv-axis)" strokeWidth={1} />}
					{data.series.map((s, j) => (
						<circle key={s} cx={x(hover)} cy={y(cellAt(data, hover, j))} r={4} fill={lineColor(s)} stroke="var(--jdv-surface)" strokeWidth={2} />
					))}
				</g>
			)}
			{!spark &&
				data.keys.map((k, i) =>
					i % every === 0 ? (
						<text key={k} x={labelX(i)} y={height - 4} textAnchor="middle" style={axisText}>{k}</text>
					) : null,
				)}
			<rect x={m.left} y={0} width={iw} height={height} fill="transparent" onMouseMove={onMove} {...(hover !== null ? a.hitProps(keyAt(data, hover)) : {})} data-jd="line-hit" />
		</svg>
	)
	return { svg, legend: single ? [] : data.series.map((s) => ({ label: s, color: lineColor(s) })) }
}

function drawPie(a: DrawArgs): Drawn {
	const { data, spec, width, setTip, markProps } = a
	const height = spec.height ?? DEFAULT_HEIGHT
	const size = Math.min(height, width)
	const r = size / 2 - 2
	const inner = spec.type === "donut" ? r * 0.62 : 0
	const cx = size / 2
	const cy = height / 2
	const total = data.totals.reduce((s, v) => s + v, 0)
	const color = colorScale(data.keys, a.colorDomain, spec.colors)
	let ang = -Math.PI / 2
	const slices = data.keys.map((key, i) => {
		const v = at(data.totals, i)
		const a0 = ang
		const a1 = ang + (v / (total || 1)) * Math.PI * 2
		ang = a1
		return { key, i, v, a0, a1 }
	})
	const pt = (rad: number, t: number) => `${(cx + rad * Math.cos(t)).toFixed(2)},${(cy + rad * Math.sin(t)).toFixed(2)}`
	const arc = (a0: number, a1: number) => {
		if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4 // full circle
		const big = a1 - a0 > Math.PI ? 1 : 0
		if (inner === 0) return `M${cx},${cy}L${pt(r, a0)}A${r},${r} 0 ${big} 1 ${pt(r, a1)}Z`
		return `M${pt(r, a0)}A${r},${r} 0 ${big} 1 ${pt(r, a1)}L${pt(inner, a1)}A${inner},${inner} 0 ${big} 0 ${pt(inner, a0)}Z`
	}
	const svg = (
		<svg width={size} height={height} aria-hidden="true">
			{slices.filter((s) => s.v > 0).map((s) => (
				<path
					key={s.key}
					d={arc(s.a0, s.a1)}
					fill={color(s.key)}
					stroke="var(--jdv-surface)"
					strokeWidth={GAP}
					strokeLinejoin="round"
					{...markProps(s.key)}
					onMouseMove={(ev: React.MouseEvent<SVGPathElement>) => {
						const box = svgBox(ev.currentTarget)
						setTip({ x: ev.clientX - box.left, y: ev.clientY - box.top, title: s.key, lines: [{ color: color(s.key), label: humanize(measureLabel(spec)), value: `${formatNumber(s.v, false)} (${formatPercent((s.v / (total || 1)) * 100)})` }] })
					}}
				/>
			))}
			{inner > 0 && (
				<g>
					<text x={cx} y={cy - 2} textAnchor="middle" style={{ fill: "var(--jdv-ink)", fontSize: 16, fontWeight: 600 }}>{formatNumber(total)}</text>
					<text x={cx} y={cy + 13} textAnchor="middle" style={axisText}>total</text>
				</g>
			)}
		</svg>
	)
	// Pie legend sits beside the plot and carries values, so identity is never colour alone.
	const wrapped = (
		<div className="jd:flex jd:flex-wrap jd:items-center jd:justify-center jd:gap-x-5 jd:gap-y-2">
			{svg}
			<ul className="jd:grid jd:max-w-64 jd:grid-cols-[auto_minmax(0,auto)_auto_auto] jd:items-center jd:gap-x-2 jd:gap-y-0.5 jd:text-[11px]" data-jd="legend">
				{slices.map((s) => (
					<li key={s.key} className="jd:contents">
						<span className="jd:inline-block jd:size-2 jd:shrink-0 jd:rounded-[2px]" style={{ background: color(s.key) }} />
						<span className="jd:truncate jd:text-muted-foreground" title={s.key}>{s.key}</span>
						<span className="jd:text-right jd:tabular-nums jd:text-foreground">{formatNumber(s.v)}</span>
						<span className="jd:text-right jd:tabular-nums jd:text-muted-foreground">{formatPercent((s.v / (total || 1)) * 100)}</span>
					</li>
				))}
			</ul>
		</div>
	)
	return { svg: wrapped, legend: [] }
}

/** Bare sparkline from a list of numbers (stat tiles). */
export function Sparkline({ values, height = SPARK_HEIGHT, label }: { values: number[]; height?: number; label?: string }) {
	const rows = values.map((v, i) => ({ i: String(i).padStart(4, "0"), v }))
	return <Chart rows={rows} spec={{ type: "sparkline", groupBy: "i", measure: "sum:v", sort: "key", height, title: label }} />
}
