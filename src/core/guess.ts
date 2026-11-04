/**
 * Column type guessing. Pure: no React, no DOM. Given a column's sample values
 * it returns a type (plus enum values/order). Every threshold comes from
 * GuessOptions; custom detectors run first so users can add their own types.
 */
import type { Detector, ResolvedGuess, Row } from "./config"

/** Built-in thresholds; `config.guess` overrides any of them. */
export const DEFAULT_GUESS: ResolvedGuess = {
	enumMaxDistinct: 12,
	enumMaxRatio: 0.34,
	enumMaxLen: 32,
	longTextLen: 80,
	sampleSize: 2000,
	knownOrders: [
		["critical", "high", "medium", "low", "info", "none"],
		["p0", "p1", "p2", "p3", "p4"],
	],
	detectors: [],
}

const RE_IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}(\/\d{1,2})?$/
const RE_IPV6 = /^[0-9a-f:]+:[0-9a-f:]*(\/\d{1,3})?$/i
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_URL = /^https?:\/\/\S+$/i
const RE_DATE = /^\d{4}-\d{2}-\d{2}$/
const RE_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/

export const isEmpty = (v: unknown) => v === null || v === undefined || v === ""

function every(values: unknown[], test: (v: unknown) => boolean): boolean {
	for (const v of values) if (!test(v)) return false
	return values.length > 0
}

export type Guess = { type: string; order?: string[]; values?: string[] }

/** Sorted distinct values, in a known order when one matches. */
export function enumValues(strs: string[], knownOrders: string[][]): { values: string[]; order?: string[] } {
	const distinct = [...new Set(strs)]
	const lower = distinct.map((d) => d.toLowerCase())
	const known = knownOrders.find((o) => lower.every((d) => o.includes(d)))
	if (!known) return { values: distinct.sort() }
	const order = [...distinct].sort((a, b) => known.indexOf(a.toLowerCase()) - known.indexOf(b.toLowerCase()))
	return { values: order, order }
}

/** Guess one column's type from its sample values. */
export function guessType(values: unknown[], opts: ResolvedGuess = DEFAULT_GUESS, detectors: Detector[] = opts.detectors): Guess {
	const vals = values.filter((v) => !isEmpty(v))
	if (vals.length === 0) return { type: "text" }
	for (const d of detectors) {
		try {
			if (d.test(vals)) return { type: d.type }
		} catch {
			// A throwing detector is treated as "no match"; validation reports bad detectors.
		}
	}
	if (every(vals, (v) => typeof v === "object")) return { type: "json" }
	if (every(vals, (v) => typeof v === "boolean" || v === "true" || v === "false")) return { type: "boolean", values: ["true", "false"] }
	if (every(vals, (v) => typeof v === "number" && Number.isFinite(v))) return { type: "number" }
	if (!every(vals, (v) => typeof v === "string" || typeof v === "number")) return { type: "text" }
	const strs = vals.map(String)
	if (every(strs, (s) => RE_IPV4.test(s as string) || RE_IPV6.test(s as string))) return { type: "ip" }
	if (every(strs, (s) => RE_EMAIL.test(s as string))) return { type: "email" }
	if (every(strs, (s) => RE_URL.test(s as string))) return { type: "url" }
	if (every(strs, (s) => RE_DATE.test(s as string))) return { type: "date" }
	if (every(strs, (s) => RE_DATETIME.test(s as string) && !Number.isNaN(Date.parse(s as string)))) return { type: "datetime" }
	const distinct = new Set(strs).size
	const maxLen = strs.reduce((m, s) => Math.max(m, s.length), 0)
	if (distinct <= opts.enumMaxDistinct && distinct <= Math.max(2, strs.length * opts.enumMaxRatio) && maxLen <= opts.enumMaxLen)
		return { type: "enum", ...enumValues(strs, opts.knownOrders) }
	if (maxLen > opts.longTextLen) return { type: "longtext" }
	return { type: "text" }
}

/** Keys in first-seen order across the sample, so sparse keys still get a column. */
export function collectKeys(rows: Row[], sampleSize = DEFAULT_GUESS.sampleSize): string[] {
	const seen = new Set<string>()
	for (const r of rows.slice(0, sampleSize)) for (const k of Object.keys(r ?? {})) seen.add(k)
	return [...seen]
}
