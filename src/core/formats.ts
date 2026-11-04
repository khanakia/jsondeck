/**
 * Built-in named formats. Pure. `format: "currency:EUR"` → formats.currency(v, "EUR", row).
 * `config.formats` adds or replaces entries.
 */
import type { FormatFn } from "./config"

const isNum = (v: unknown) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)))
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"]
const BYTE_STEP = 1024
const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
	["year", 365 * 864e5],
	["month", 30 * 864e5],
	["week", 7 * 864e5],
	["day", 864e5],
	["hour", 36e5],
	["minute", 6e4],
	["second", 1e3],
]
const pad = (n: number) => String(n).padStart(2, "0")

export const BUILTIN_FORMATS: Record<string, FormatFn> = {
	/** number:2 → fixed decimals; plain "number" → locale grouping. */
	number: (v, arg) => {
		if (!isNum(v)) return String(v ?? "")
		const d = arg === undefined ? undefined : Number(arg)
		return new Intl.NumberFormat(undefined, d === undefined ? {} : { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number(v))
	},
	/** currency:EUR (default USD). */
	currency: (v, arg) => (isNum(v) ? new Intl.NumberFormat(undefined, { style: "currency", currency: arg || "USD" }).format(Number(v)) : String(v ?? "")),
	/** A fraction shown as percent: 0.25 → 25%. percent:1 → one decimal. */
	percent: (v, arg) =>
		isNum(v) ? new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: arg ? Number(arg) : 0, minimumFractionDigits: arg ? Number(arg) : 0 }).format(Number(v)) : String(v ?? ""),
	/** 1536 → "1.5 KB" (1024 steps). */
	bytes: (v) => {
		if (!isNum(v)) return String(v ?? "")
		let n = Number(v)
		let i = 0
		while (Math.abs(n) >= BYTE_STEP && i < BYTE_UNITS.length - 1) {
			n /= BYTE_STEP
			i++
		}
		return `${i === 0 ? n : n.toFixed(1)} ${BYTE_UNITS[i]}`
	},
	/** "3 days ago" / "in 2 hours". */
	relative: (v) => {
		const t = new Date(String(v)).getTime()
		if (Number.isNaN(t)) return String(v ?? "")
		const diff = t - Date.now()
		const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
		for (const [unit, ms] of RELATIVE_STEPS) if (Math.abs(diff) >= ms || unit === "second") return rtf.format(Math.round(diff / ms), unit)
		return String(v)
	},
	/** Local YYYY-MM-DD. */
	date: (v) => {
		const d = new Date(String(v))
		return Number.isNaN(d.getTime()) ? String(v ?? "") : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
	},
	/** Local YYYY-MM-DD HH:mm. */
	datetime: (v) => {
		const d = new Date(String(v))
		return Number.isNaN(d.getTime()) ? String(v ?? "") : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
	},
	json: (v) => JSON.stringify(v),
	upper: (v) => String(v ?? "").toUpperCase(),
	lower: (v) => String(v ?? "").toLowerCase(),
}

/** Split "currency:EUR" into name + argument. */
export function parseFormat(spec: string): { name: string; arg?: string } {
	const i = spec.indexOf(":")
	return i < 0 ? { name: spec } : { name: spec.slice(0, i), arg: spec.slice(i + 1) }
}
