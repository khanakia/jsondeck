/**
 * Number and value formatting shared by the viz components. Pure.
 */
import { toText } from "../core/query"

/** Below this, numbers are shown in full (1,284); at or above, compact (12.9K). */
const COMPACT_FROM = 10_000

const fullFmt = new Intl.NumberFormat("en", { maximumFractionDigits: 2 })
const compactFmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

/** 1,284 / 12.9K / 4.2M. Non-finite values show as an en dash. */
export function formatNumber(n: number, compact = true): string {
	if (!Number.isFinite(n)) return "–"
	return compact && Math.abs(n) >= COMPACT_FROM ? compactFmt.format(n) : fullFmt.format(n)
}

export function formatPercent(n: number): string {
	if (!Number.isFinite(n)) return "–"
	return `${Math.abs(n) < 10 ? n.toFixed(1) : Math.round(n)}%`
}

/** Display text of one cell, by column type. Rendering (links, badges) is done by the caller. */
/** `type` is a column type name (text, number, date, datetime, boolean, json, …); unknown names format as text. */
export function formatValue(v: unknown, type = "text"): string {
	if (v === null || v === undefined || v === "") return "–"
	switch (type) {
		case "number": return typeof v === "number" ? formatNumber(v, false) : String(v)
		case "boolean": return v === true || v === "true" ? "yes" : "no"
		case "datetime": {
			const d = new Date(String(v))
			return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString()
		}
		case "json": return toText(v)
		default: return Array.isArray(v) ? v.map(toText).join(", ") : toText(v)
	}
}

/** "Nice" axis ticks covering [min, max] with about `count` steps (0 always included for bar-like data). */
export function niceTicks(min: number, max: number, count = 5): number[] {
	if (!Number.isFinite(min) || !Number.isFinite(max)) return [0]
	if (min === max) {
		if (max === 0) return [0, 1]
		min = Math.min(0, min)
		max = Math.max(0, max)
	}
	const span = max - min
	const raw = span / Math.max(1, count)
	const mag = 10 ** Math.floor(Math.log10(raw))
	const norm = raw / mag
	const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
	const lo = Math.floor(min / step) * step
	const hi = Math.ceil(max / step) * step
	const out: number[] = []
	for (let t = lo; t <= hi + step / 2; t += step) out.push(Math.round(t / step) * step)
	return out
}
