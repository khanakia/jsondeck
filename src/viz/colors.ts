/**
 * Colour assignment for charts. Pure.
 *
 * Rules (from the dataviz method): categorical slots are handed out in a
 * fixed order and never cycled; a colour follows the entity, not its rank
 * (pass `domain` from the unfiltered rows so a filter does not repaint the
 * survivors); "Other" is always the neutral grey; severity-like values use
 * the reserved status colours.
 */
import { OTHER_KEY } from "../core/aggregate"

/** Number of categorical slots (--jdv-s1 … --jdv-s8). A ninth series folds into "Other". */
export const SLOT_COUNT = 8

/** Named colours a spec may use instead of a hex value. */
export const NAMED_COLORS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "good", "warning", "serious", "critical", "other", "muted"] as const
export type NamedColor = (typeof NAMED_COLORS)[number]

/** Severity words get status colours automatically when every key is one of these. */
export const SEVERITY_COLORS: Record<string, NamedColor> = {
	critical: "critical",
	high: "serious",
	medium: "warning",
	low: "s1",
	info: "other",
	none: "other",
}

/** CSS colour for a name: a named token → var(--jdv-…), anything else is used as given (hex, rgb, var()). */
export function cssColor(c: string): string {
	return NAMED_COLORS.some((n) => n === c) ? `var(--jdv-${c})` : c
}

export const slotColor = (i: number) => `var(--jdv-s${(i % SLOT_COUNT) + 1})`

/** True when every value (ignoring Other / empty) is a severity word. */
export function isSeverityDomain(values: string[]): boolean {
	const real = values.filter((v) => v !== OTHER_KEY && v !== "(empty)")
	return real.length > 0 && real.every((v) => v.toLowerCase() in SEVERITY_COLORS)
}

/**
 * Build `value → css colour` for one coloured dimension.
 * @param values  the values being drawn, in draw order
 * @param domain  stable order to assign slots from (defaults to `values`)
 * @param explicit spec overrides (`{ critical: "#d03b3b", web: "s3" }`)
 */
export function colorScale(values: string[], domain?: string[], explicit?: Record<string, string>): (v: string) => string {
	const order = domain && domain.length ? domain : values
	const slot = new Map<string, number>()
	for (const v of order) if (v !== OTHER_KEY && !slot.has(v)) slot.set(v, slot.size)
	for (const v of values) if (v !== OTHER_KEY && !slot.has(v)) slot.set(v, slot.size)
	const severity = !explicit && isSeverityDomain(values)
	return (v) => {
		if (explicit?.[v]) return cssColor(explicit[v])
		if (v === OTHER_KEY) return cssColor("other")
		if (severity) return cssColor(SEVERITY_COLORS[v.toLowerCase()] ?? "other")
		const i = slot.get(v) ?? 0
		return i < SLOT_COUNT ? slotColor(i) : cssColor("other")
	}
}
