/**
 * Cell rendering. The chain, first match wins:
 *   column.render → types[type].render → renderers[type] → column.format → built-in renderer
 * then `link` wraps the result. Renderers may return text, a DOM Node or a React element.
 */
import * as React from "react"
import { cn } from "@/lib/utils"
import { type FormatFn, type RenderFn, type Row, TONES, type Tone, type TypeDef } from "../core/config"
import { BUILTIN_FORMATS, parseFormat } from "../core/formats"
import { toText } from "../core/query"
import type { ResolvedColumn } from "../core/resolve"

export type RenderCtx = {
	types: Record<string, TypeDef>
	renderers: Record<string, RenderFn>
	formats: Record<string, FormatFn>
	/** Open the row a relation value points at (the row drawer). */
	onRelation?: ((table: string, field: string, value: unknown) => void) | undefined
	/** Global status colour overrides (value → tone or CSS colour) and the badge class slot. */
	statusColors?: Record<string, string> | undefined
	badgeClass?: string | undefined
}

/**
 * Well-known words keep their meaning colours; every other value gets a calm
 * neutral (no hashed rainbow). `column.colors` overrides any of them.
 */
const KNOWN_TONES: Record<string, Tone> = {
	critical: "red",
	high: "orange",
	medium: "amber",
	low: "blue",
	open: "red",
	fixed: "green",
	running: "green",
	pending: "amber",
	true: "green",
}
const NEUTRAL: Tone = "slate"
/** Full class strings so the Tailwind compiler sees each one literally. */
const TONE_CLASS: Record<Tone, string> = {
	red: "jd:bg-red-100 jd:text-red-800 jd:dark:bg-red-950 jd:dark:text-red-300",
	orange: "jd:bg-orange-100 jd:text-orange-800 jd:dark:bg-orange-950 jd:dark:text-orange-300",
	amber: "jd:bg-amber-100 jd:text-amber-800 jd:dark:bg-amber-950 jd:dark:text-amber-300",
	green: "jd:bg-emerald-100 jd:text-emerald-800 jd:dark:bg-emerald-950 jd:dark:text-emerald-300",
	blue: "jd:bg-blue-100 jd:text-blue-800 jd:dark:bg-blue-950 jd:dark:text-blue-300",
	violet: "jd:bg-violet-100 jd:text-violet-800 jd:dark:bg-violet-950 jd:dark:text-violet-300",
	cyan: "jd:bg-cyan-100 jd:text-cyan-800 jd:dark:bg-cyan-950 jd:dark:text-cyan-300",
	pink: "jd:bg-pink-100 jd:text-pink-800 jd:dark:bg-pink-950 jd:dark:text-pink-300",
	/** Neutral: a neutral secondary badge. */
	slate: "jd:bg-secondary jd:text-secondary-foreground",
}
const BADGE = "jd:inline-flex jd:h-4 jd:py-0 jd:leading-4 jd:items-center jd:rounded jd:px-1.5 jd:text-[11px] jd:font-medium jd:whitespace-nowrap"

export function Badge({ v, colors, className }: { v: string; colors?: Record<string, string> | undefined; className?: string | undefined }) {
	const c = colors?.[v]
	if (c && !(TONES as readonly string[]).includes(c)) {
		// A CSS colour: tinted background, full-strength text.
		return (
			<span className={cn(BADGE, className)} style={{ color: c, backgroundColor: `color-mix(in srgb, ${c} 16%, transparent)` }} data-jd-badge={v} data-jd="badge">
				{v}
			</span>
		)
	}
	const tone = (c as Tone | undefined) ?? KNOWN_TONES[v.toLowerCase()] ?? NEUTRAL
	return (
		<span className={cn(BADGE, TONE_CLASS[tone], className)} data-jd-badge={v} data-jd-tone={tone} data-jd="badge">
			{v}
		</span>
	)
}

const numberFmt = new Intl.NumberFormat()
const Empty = () => <span className="jd:text-muted-foreground">—</span>
const LINK = "jd:text-blue-600 jd:dark:text-blue-400 jd:hover:underline"

/** Built-in renderer per built-in type (unknown types render as text). */
function builtin(value: unknown, col: ResolvedColumn, ctx?: RenderCtx): React.ReactNode {
	const s = toText(value)
	switch (col.type) {
		case "mono":
		case "ip":
			return <span className="jd:truncate jd:font-mono jd:text-[12px] jd:tabular-nums">{s}</span>
		case "number":
			return <span className="jd:truncate jd:tabular-nums">{typeof value === "number" ? numberFmt.format(value) : s}</span>
		case "date":
			return <span className="jd:tabular-nums">{s}</span>
		case "datetime":
			return <span className="jd:tabular-nums">{BUILTIN_FORMATS.datetime?.(value, undefined, {}) ?? s}</span>
		case "url":
			return (
				<a href={s} target="_blank" rel="noreferrer noopener" className={cn("jd:truncate", LINK)}>
					{s.replace(/^https?:\/\//, "")}
				</a>
			)
		case "email":
			return (
				<a href={`mailto:${s}`} className={cn("jd:truncate", LINK)}>
					{s}
				</a>
			)
		case "boolean":
		case "enum":
			return <Badge v={s} colors={ctx?.statusColors ? { ...ctx.statusColors, ...(col.colors ?? {}) } : col.colors} className={ctx?.badgeClass} />
		case "json":
			return <span className="jd:truncate jd:font-mono jd:text-[11px] jd:text-muted-foreground">{s}</span>
		default:
			return <span className={col.wrap ? undefined : "jd:truncate"}>{s}</span>
	}
}

/** Mounts a DOM Node returned by a user renderer. */
function NodeHost({ node }: { node: Node }) {
	const ref = React.useRef<HTMLSpanElement>(null)
	React.useEffect(() => {
		const el = ref.current
		if (!el) return
		el.replaceChildren(node)
	}, [node])
	return <span ref={ref} className="jd:contents" />
}

/** Turn whatever a user renderer returned into a React node. */
function toNode(out: unknown, wrap: boolean): React.ReactNode {
	if (out === null || out === undefined || out === false) return null
	if (React.isValidElement(out)) return out
	if (typeof Node !== "undefined" && out instanceof Node) return <NodeHost node={out} />
	return <span className={wrap ? undefined : "jd:truncate"}>{String(out)}</span>
}

/** Fill "{field}" placeholders from the row (URL-encoded). */
export function fillTemplate(t: string, row: Row): string {
	return t.replace(/\{(\w+)\}/g, (_, k: string) => encodeURIComponent(toText(row[k])))
}

export function formatValue(value: unknown, row: Row, col: ResolvedColumn, formats: Record<string, FormatFn>): string | undefined {
	if (typeof col.format === "function") return col.format(value, row)
	if (typeof col.format === "string") {
		const { name, arg } = parseFormat(col.format)
		const f = formats[name]
		return f ? f(value, arg, row) : undefined
	}
	return undefined
}

export function renderCell(value: unknown, row: Row, col: ResolvedColumn, ctx: RenderCtx): React.ReactNode {
	let node: React.ReactNode
	const custom = col.render ?? ctx.types[col.type]?.render ?? ctx.renderers[col.type]
	if (custom) node = toNode(custom(value, row), col.wrap)
	else if (value === null || value === undefined || value === "") return <Empty />
	else {
		const formatted = formatValue(value, row, col, ctx.formats)
		node = formatted !== undefined ? <span className={col.wrap ? undefined : "jd:truncate jd:tabular-nums"}>{formatted}</span> : builtin(value, col, ctx)
	}
	const rel = col.relation
	const open = ctx.onRelation
	if (rel && open) {
		return (
			<button
				type="button"
				data-jd-rel={`${rel.table}.${rel.field}`}
				title={`${rel.table}: ${toText(value)}`}
				onClick={(e) => {
					e.stopPropagation()
					open(rel.table, rel.field, value)
				}}
				className={cn("jd:min-w-0 jd:cursor-pointer jd:truncate jd:text-left jd:underline jd:decoration-dotted jd:underline-offset-2", LINK)}
			>
				{node}
			</button>
		)
	}
	if (col.link) {
		const href = typeof col.link === "function" ? col.link(row) : fillTemplate(col.link, row)
		return (
			<a href={href} target="_blank" rel="noreferrer noopener" className={cn("jd:min-w-0 jd:truncate", LINK)} data-jd-link={col.id}>
				{node}
			</a>
		)
	}
	return node
}

/** Tooltip text for a cell, or undefined. */
export function tooltipFor(value: unknown, row: Row, col: ResolvedColumn, formats: Record<string, FormatFn>): string | undefined {
	if (col.tooltip === false) return undefined
	if (typeof col.tooltip === "function") return col.tooltip(value, row)
	if (value === null || value === undefined || value === "") return undefined
	return formatValue(value, row, col, formats) ?? (typeof value === "object" ? JSON.stringify(value, null, 2) : String(value))
}
