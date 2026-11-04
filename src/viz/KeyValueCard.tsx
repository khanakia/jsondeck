/**
 * KeyValueCard: one row (or a set of aggregates) as label / value pairs,
 * formatted by column type. Props in, events out.
 */
import type { ReactNode } from "react"
import { type Measure, measure, type Row, type Where } from "../core/aggregate"
import { humanize } from "../core/labels"
import { formatNumber, formatValue } from "./format"
import "./viz.css"

/** Column type name: text, number, date, datetime, url, ip, email, boolean, enum, json, mono (others show as text). */
type ColumnType = string

/**
 * The part of a column the card needs. Structural on purpose, so the table's
 * resolved columns (core/resolve.ts ResolvedColumn) can be passed straight in.
 */
export type KVColumn = { id: string; label?: string; type?: string; format?: string | ((value: unknown, row: Row) => string) }

export type KVField = string | { field: string; label?: string; type?: ColumnType }

export type KVSpec = {
	title?: string | undefined
	/** Which fields of `row` to show, in order. Default: every key of the row. */
	fields?: KVField[] | undefined
	/** Aggregates over `rows` instead of (or as well as) one row: label → measure (+ optional where). */
	aggregates?: { label: string; measure: Measure; where?: Where }[] | undefined
	/** Two columns of pairs on wide cards. */
	columns?: 1 | 2 | undefined
}

export type KeyValueCardProps = {
	spec: KVSpec
	/** The one row to show. */
	row?: Row | undefined
	/** Rows the aggregates run over. */
	rows?: Row[] | undefined
	/** Column specs (from guess.ts) so values use the table's formats. */
	columnSpecs?: KVColumn[] | undefined
	/** Click on a value: (field, value). */
	onSelect?: (field: string, value: unknown) => void | undefined
	className?: string | undefined
}

function renderValue(v: unknown, type: ColumnType): ReactNode {
	const text = formatValue(v, type)
	if (text === "–") return <span className="jd:text-muted-foreground">–</span>
	switch (type) {
		case "url":
			return /^https?:\/\//i.test(String(v)) ? (
				<a href={String(v)} target="_blank" rel="noopener noreferrer" className="jd:text-foreground jd:underline jd:decoration-border jd:underline-offset-2">{text}</a>
			) : text
		case "email":
			return <a href={`mailto:${String(v)}`} className="jd:underline jd:decoration-border jd:underline-offset-2">{text}</a>
		case "ip":
		case "mono":
			return <span className="jd:font-mono jd:text-[12px]">{text}</span>
		case "enum":
			return <span className="jd:rounded jd:bg-muted jd:px-1.5 jd:py-px jd:text-[11px]">{text}</span>
		case "json":
			return <code className="jd:block jd:truncate jd:font-mono jd:text-[11px] jd:text-muted-foreground" title={text}>{text}</code>
		case "number":
			return <span className="jd:tabular-nums">{text}</span>
		default:
			return text
	}
}

export function KeyValueCard({ spec, row, rows, columnSpecs, onSelect, className }: KeyValueCardProps) {
	const byId = new Map((columnSpecs ?? []).map((c) => [c.id, c]))
	const fields = (spec.fields ?? Object.keys(row ?? {})).map((f) => {
		const o = typeof f === "string" ? { field: f } : f
		const col = byId.get(o.field)
		return { field: o.field, label: o.label ?? col?.label ?? humanize(o.field), type: o.type ?? col?.type ?? "text", format: typeof col?.format === "function" ? col.format : undefined }
	})
	/** `pick` is set only for row fields when the caller listens: aggregates are not a value to filter by. */
	const pairs: { key: string; label: string; node: ReactNode; pick?: (() => void) | undefined }[] = []
	if (row)
		for (const f of fields)
			pairs.push({ key: f.field, label: f.label, node: f.format ? f.format(row[f.field], row) : renderValue(row[f.field], f.type), pick: onSelect ? () => onSelect(f.field, row[f.field]) : undefined })
	for (const a of spec.aggregates ?? []) {
		const v = measure(rows ?? [], a.measure, a.where)
		pairs.push({ key: `agg:${a.label}`, label: a.label, node: <span className="jd:tabular-nums">{formatNumber(v)}</span> })
	}
	return (
		<section className={`jd:min-w-0 jd:rounded-lg jd:border jd:border-card-border jd:bg-card jd:shadow-(--jds-card-shadow) jd:px-3 jd:py-2 ${className ?? ""}`} data-jd="kv">
			{spec.title && <h3 className="jd:mb-1 jd:text-xs jd:font-medium jd:text-foreground">{spec.title}</h3>}
			{pairs.length === 0 ? (
				<p className="jd:text-xs jd:text-muted-foreground">Nothing to show</p>
			) : (
				<dl className={`jd:grid jd:gap-x-4 jd:gap-y-0.5 ${spec.columns === 2 ? "jd:sm:grid-cols-2" : ""}`}>
					{pairs.map((p) => (
						<div key={p.key} className="jd:flex jd:min-w-0 jd:items-baseline jd:gap-2 jd:py-0.5">
							<dt className="jd:w-28 jd:shrink-0 jd:truncate jd:text-[11px] jd:text-muted-foreground">{p.label}</dt>
							<dd className="jd:min-w-0 jd:flex-1 jd:truncate">
								{p.pick ? (
									<button type="button" className="jd:max-w-full jd:truncate jd:text-left jd:hover:underline" onClick={p.pick}>
										{p.node}
									</button>
								) : (
									p.node
								)}
							</dd>
						</div>
					))}
				</dl>
			)}
		</section>
	)
}
