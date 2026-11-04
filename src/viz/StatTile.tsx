/**
 * StatTile: one headline number. label · value · optional delta vs. a second
 * `where` · optional sparkline. Props in, events out.
 */
import { useMemo } from "react"
import { aggregate, filterRows, type Measure, measure, type Row, type TimeBucket, type Where } from "../core/aggregate"
import { Sparkline } from "./Chart"
import { formatNumber, formatPercent } from "./format"
import "./viz.css"

export type StatSpec = {
	label: string
	measure?: Measure | undefined
	where?: Where | undefined
	/** Compare against the same measure over rows matching this `where` (e.g. last period). */
	compare?: Where | undefined
	/** Text after the delta, e.g. "vs last week". */
	compareLabel?: string | undefined
	/** Is a rise good (green) or bad (red)? Default true. Set false for counts of problems. */
	upIsGood?: boolean | undefined
	/** Trend line: the measure per time bucket of a date field. */
	trend?: { field: string; bucket?: TimeBucket; points?: number } | undefined
	/** Shown under the value. */
	hint?: string | undefined
}

export type StatTileProps = {
	rows: Row[]
	spec: StatSpec
	/** Click on the tile (e.g. apply its `where` to the table). */
	onSelect?: (where: Where | undefined) => void | undefined
	className?: string | undefined
}

/** Last N trend points: enough to show a shape without crowding a compact tile. */
const DEFAULT_TREND_POINTS = 12

export function StatTile({ rows, spec, onSelect, className }: StatTileProps) {
	const value = useMemo(() => measure(rows, spec.measure, spec.where), [rows, spec.measure, spec.where])
	const prev = useMemo(() => (spec.compare ? measure(rows, spec.measure, spec.compare) : null), [rows, spec.measure, spec.compare])
	const trend = useMemo(() => {
		if (!spec.trend) return null
		const r = aggregate(filterRows(rows, spec.where), { groupBy: spec.trend.field, bucket: spec.trend.bucket ?? "day", measure: spec.measure })
		const vals = r.keys.map((k, i) => (k === "(empty)" ? null : r.totals[i])).filter((v): v is number => v !== null)
		return vals.slice(-(spec.trend.points ?? DEFAULT_TREND_POINTS))
	}, [rows, spec.trend, spec.where, spec.measure])

	const delta = prev === null ? null : value - prev
	const pct = prev ? ((value - prev) / Math.abs(prev)) * 100 : null
	const good = delta === null || delta === 0 ? null : (delta > 0) === (spec.upIsGood ?? true)
	const Tag = onSelect ? "button" : "div"

	return (
		<Tag
			type={onSelect ? "button" : undefined}
			onClick={onSelect ? () => onSelect(spec.where) : undefined}
			className={`jd:flex jd:min-w-0 jd:flex-col jd:gap-0.5 jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:shadow-(--jds-card-shadow) jd:px-3 jd:py-2 jd:text-left ${onSelect ? "jd:cursor-pointer jd:hover:bg-accent" : ""} ${className ?? ""}`}
			data-jd="stat"
		>
			<span className="jd:truncate jd:text-[11px] jd:text-muted-foreground">{spec.label}</span>
			<div className="jd:flex jd:items-end jd:justify-between jd:gap-2">
				<span className="jd:text-xl jd:font-semibold jd:leading-tight jd:text-foreground" data-jd="stat-value" title={formatNumber(value, false)}>
					{formatNumber(value)}
				</span>
				{trend && trend.length > 1 && (
					<div className="jd:w-20 jd:shrink-0">
						<Sparkline values={trend} height={26} />
					</div>
				)}
			</div>
			{delta !== null && (
				<span className="jd:flex jd:items-center jd:gap-1 jd:text-[11px] jd:tabular-nums" data-jd="stat-delta">
					<span style={{ color: good === null ? "var(--jdv-muted)" : good ? "var(--jdv-up)" : "var(--jdv-down)" }} aria-label={delta > 0 ? "up" : delta < 0 ? "down" : "no change"}>
						{delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} {delta > 0 ? "+" : ""}
						{formatNumber(delta)}
						{pct !== null && ` (${delta > 0 ? "+" : ""}${formatPercent(pct)})`}
					</span>
					{spec.compareLabel && <span className="jd:text-muted-foreground">{spec.compareLabel}</span>}
				</span>
			)}
			{spec.hint && <span className="jd:truncate jd:text-[11px] jd:text-muted-foreground">{spec.hint}</span>}
		</Tag>
	)
}
