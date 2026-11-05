/**
 * A small class merger for our `jd:`-prefixed Tailwind v4 classes: when two
 * classes set the same thing ("jd:h-7 … jd:h-6"), the later one wins and the
 * earlier one is dropped, so a caller's `className` reliably overrides a
 * component's defaults. Classes without the `jd:` prefix are kept as they are.
 *
 * It replaces tailwind-merge (about 9 kB gzipped, the largest library in the
 * first download after React). It knows the utility families jsondeck and its
 * users' overrides use, not all of Tailwind; `scripts/check-merge.mjs` proves
 * it gives the same result as tailwind-merge for every pair of classes found
 * in src/, plus a list of common overrides, and runs with the checks. The
 * tables below list only the utilities that appear there (the stylesheet holds
 * no other `jd:` class, so no other one can have an effect); add a family here
 * when src/ starts using it, and the check fails until you do.
 *
 * How it works: each class becomes a key, variants + important + a "group"
 * (what the utility sets, e.g. "h", "font-size", "text-color"). A later class
 * removes earlier classes with the same key, and also the narrower groups its
 * group covers (p covers px / pt / …; size covers w and h; inset covers top /
 * left / …), the same way tailwind-merge does.
 */

/** Groups a broader group also overrides when it comes later. */
const COVERS: Record<string, readonly string[]> = {
	p: ["px", "py", "ps", "pe", "pt", "pr", "pb", "pl"],
	px: ["pr", "pl", "ps", "pe"],
	py: ["pt", "pb"],
	m: ["mx", "my", "ms", "me", "mt", "mr", "mb", "ml"],
	mx: ["mr", "ml", "ms", "me"],
	my: ["mt", "mb"],
	size: ["w", "h"],
	inset: ["inset-x", "inset-y", "start", "end", "top", "right", "bottom", "left"],
	"inset-x": ["right", "left"],
	"inset-y": ["top", "bottom"],
	gap: ["gap-x", "gap-y"],
	overflow: ["overflow-x", "overflow-y"],
	rounded: ["rounded-s", "rounded-e", "rounded-t", "rounded-r", "rounded-b", "rounded-l", "rounded-ss", "rounded-se", "rounded-ee", "rounded-es", "rounded-tl", "rounded-tr", "rounded-br", "rounded-bl"],
	"rounded-t": ["rounded-tl", "rounded-tr"],
	"rounded-r": ["rounded-tr", "rounded-br"],
	"rounded-b": ["rounded-br", "rounded-bl"],
	"rounded-l": ["rounded-tl", "rounded-bl"],
	"border-w": ["border-w-x", "border-w-y", "border-w-s", "border-w-e", "border-w-t", "border-w-r", "border-w-b", "border-w-l"],
	"border-w-x": ["border-w-r", "border-w-l"],
	"border-w-y": ["border-w-t", "border-w-b"],
	"border-color": ["border-color-x", "border-color-y", "border-color-s", "border-color-e", "border-color-t", "border-color-r", "border-color-b", "border-color-l"],
	"border-color-x": ["border-color-r", "border-color-l"],
	"border-color-y": ["border-color-t", "border-color-b"],
	"font-size": ["leading"],
	flex: ["basis", "grow", "shrink"],
	"line-clamp": ["display", "overflow"],
}

/** Whole-class utilities (no value part) and the group each sets. */
const EXACT: Record<string, string> = {}
const exact = (group: string, names: string) => {
	for (const n of names.split(" ")) EXACT[n] = group
}
exact("display", "block inline-block flex inline-flex grid contents hidden")
exact("position", "static fixed absolute relative sticky")
exact("visibility", "invisible")
exact("font-style", "italic")
exact("text-decoration-line", "underline no-underline")
exact("text-transform", "uppercase")
exact("text-overflow", "truncate")
exact("sr", "sr-only")
exact("fvn-spacing", "tabular-nums")
exact("text-alignment", "text-left text-center text-right")
exact("break", "break-words break-all")
exact("flex-direction", "flex-row flex-row-reverse flex-col")
exact("flex-wrap", "flex-wrap")
exact("shrink", "shrink-0")
exact("outline-style", "outline-dashed outline-none outline-hidden")
exact("outline-w", "outline")
exact("border-style", "border-dashed border-none")
exact("ring-w", "ring")
exact("ring-w-inset", "ring-inset")
exact("bg-image", "bg-none")
exact("shadow", "shadow")
exact("rounded", "rounded")
exact("border-w", "border")
exact("@container", "@container")
exact("decoration-style", "decoration-dotted")
exact("transition", "transition-all transition-colors transition-opacity transition-transform")
exact("select", "select-none")
exact("pointer-events", "pointer-events-none")
exact("whitespace", "whitespace-normal whitespace-nowrap whitespace-pre whitespace-pre-wrap")
exact("caption", "caption-bottom")
exact("border-collapse", "border-collapse")

/** Utilities with a value: stem → group (longest stem wins), for stems whose value never changes the group. */
const STEMS: Record<string, string> = {}
const stems = (names: string, group?: string) => {
	for (const n of names.split(" ")) STEMS[n] = group ?? n
}
stems("p px py pt pr pb pl m mx my mt mr mb ml w h size min-w min-h max-w max-h gap gap-x gap-y")
stems("inset inset-x inset-y top right bottom left z flex shrink col-span")
stems("grid-cols overflow overflow-x overflow-y")
stems("rounded rounded-t rounded-r rounded-l rounded-tl")
stems("opacity cursor items justify self")
stems("leading tracking line-clamp list align aspect")
stems("duration origin rotate translate-x translate-y")
stems("underline-offset outline-offset")
stems("scroll-mt")
stems("accent")
stems("select", "select")
stems("whitespace", "whitespace")
stems("pointer-events", "pointer-events")

/** Font sizes, by name (text-sm …) and as arbitrary lengths (text-[12px]). */
const SIZE_NAMES = /^(xs|sm|base|lg|[2-9]?xl)$/
const LENGTH = /^\[(length:)?(-?[\d.]+(px|rem|em|%|vh|vw|ch|ex|lh|svh|dvh)?|calc\(.*\)|clamp\(.*\))\]$|^\((length:)--.*\)$/
const WIDTHS = /^(\d+|\[(length:)?[\d.]+(px|rem|em)?\]|\(length:--.*\))$/
const SHADOW_SIZES = /^(2xs|xs|sm|md|lg|xl|2xl|none|inner)$/
const LINE_STYLES = /^(solid|dashed|dotted|double|hidden|none)$/
const FONT_WEIGHTS = /^(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\d{3})$/
const SIDES: Record<string, string> = { x: "-x", y: "-y", s: "-s", e: "-e", t: "-t", r: "-r", b: "-b", l: "-l" }

/** The group of a value-taking utility whose value decides what it sets (text-sm vs text-red-500). */
function valueGroup(u: string): string | null {
	const dash = (stem: string) => (u.startsWith(`${stem}-`) ? u.slice(stem.length + 1) : null)
	let v = dash("text")
	if (v !== null) return SIZE_NAMES.test(v) || LENGTH.test(v) ? "font-size" : "text-color"
	v = dash("font")
	if (v !== null) return FONT_WEIGHTS.test(v) || /^\[(weight:|\d)/.test(v) ? "font-weight" : "font-family"
	v = dash("bg")
	if (v !== null) return /^(linear|radial|conic|gradient|\[url)/.test(v) ? "bg-image" : "bg-color"
	v = dash("shadow")
	if (v !== null) return SHADOW_SIZES.test(v) || /^\[(\d|inset|0)/.test(v) || /^\((shadow:)?--/.test(v) ? "shadow" : "shadow-color"
	v = dash("outline")
	if (v !== null && !v.startsWith("offset-")) return WIDTHS.test(v) ? "outline-w" : "outline-color"
	v = dash("ring")
	if (v !== null && !v.startsWith("offset-")) return WIDTHS.test(v) ? "ring-w" : "ring-color"
	v = dash("decoration")
	if (v !== null) return WIDTHS.test(v) || v === "auto" || v === "from-font" ? "decoration-w" : "decoration-color"
	v = dash("stroke")
	if (v !== null) return WIDTHS.test(v) ? "stroke-w" : "stroke"
	v = dash("animate")
	if (v !== null) return /^(spin|ping|pulse|bounce|none)$|^\[|^\(/.test(v) ? "animate" : null
	v = dash("fill")
	if (v !== null) return "fill"
	v = dash("border")
	if (v !== null) {
		// border-x-2, border-l, border-t-red-500, border-dashed, border-2, border-red-500
		const side = /^([xysetrbl])(?:-(.*))?$/.exec(v)
		if (side) {
			const s = SIDES[side[1] ?? ""] ?? ""
			const rest = side[2]
			return rest === undefined || WIDTHS.test(rest) ? `border-w${s}` : `border-color${s}`
		}
		if (LINE_STYLES.test(v)) return "border-style"
		return WIDTHS.test(v) ? "border-w" : "border-color"
	}
	return null
}

/** Splits "a:b:[&_x]:c" at top-level colons (not inside [] or ()). */
function splitVariants(cls: string): string[] {
	const out: string[] = []
	let depth = 0
	let start = 0
	for (let i = 0; i < cls.length; i++) {
		const ch = cls[i]
		if (ch === "[" || ch === "(") depth++
		else if (ch === "]" || ch === ")") depth--
		else if (ch === ":" && depth === 0) {
			out.push(cls.slice(start, i))
			start = i + 1
		}
	}
	out.push(cls.slice(start))
	return out
}

/** The group a utility (no variants, no "!" or "-") sets, or null if unknown (then it is never merged). */
function groupOf(u: string): string | null {
	const known = EXACT[u]
	if (known) return known
	const byValue = valueGroup(u)
	if (byValue) return byValue
	// Longest stem first: "rounded-tl-md" before "rounded-t" before "rounded".
	for (let i = u.lastIndexOf("-"); i > 0; i = u.lastIndexOf("-", i - 1)) {
		const g = STEMS[u.slice(0, i)]
		if (g) return g
	}
	return null
}

type Parsed = { key: string; group: string; prefix: string }

const PREFIX = "jd:"

/** A utility we can classify: a name, then an optional bracket / parenthesis value and opacity modifier. */
const WELL_FORMED = /^[a-z@][a-z0-9.\-]*(\[[^\s]*\]|\([^\s]*\))?(\/[a-z0-9.]+|\/\[[^\s]*\])?$/

function parse(cls: string): Parsed | null {
	if (!cls.startsWith(PREFIX)) return null
	const parts = splitVariants(cls.slice(PREFIX.length))
	let u = parts.pop() ?? ""
	let important = false
	if (u.startsWith("!")) {
		important = true
		u = u.slice(1)
	} else if (u.endsWith("!")) {
		important = true
		u = u.slice(0, -1)
	}
	if (u.startsWith("-")) u = u.slice(1)
	// Arbitrary property ([--x:1], [mask-type:luminance]): its own group per property.
	const prop = /^\[([a-z-]+):.+\]$/.exec(u)
	if (prop) {
		const variants = [...parts].sort()
		const prefix = `${variants.join(":")}${important ? "!" : ""}|`
		return { key: `${prefix}[${prop[1]}]`, group: `[${prop[1]}]`, prefix }
	}
	if (!WELL_FORMED.test(u)) return null
	// An opacity modifier (bg-primary/10) does not change what the class sets.
	const slash = u.search(/\/[^\]\)]*$/)
	const base = slash > 0 && !u.includes("[", slash) ? u.slice(0, slash) : u
	const group = groupOf(base)
	if (!group) return null
	// Arbitrary variants ([&_svg], *:) keep their place; plain ones are order-free.
	const variants = parts.every((p) => !p.startsWith("[") && p !== "*") ? [...parts].sort() : parts
	const prefix = `${variants.join(":")}${important ? "!" : ""}|`
	return { key: prefix + group, group, prefix }
}

/** Merges a space-separated class string: for every conflict the later class wins. */
export function mergeClasses(input: string): string {
	const list = input.split(/\s+/).filter(Boolean)
	const taken = new Set<string>()
	const keep: string[] = []
	// Walk from the end: the last class of each key is kept, earlier ones dropped.
	for (let i = list.length - 1; i >= 0; i--) {
		const cls = list[i] ?? ""
		const p = parse(cls)
		if (!p) {
			keep.push(cls)
			continue
		}
		if (taken.has(p.key)) continue
		taken.add(p.key)
		for (const g of COVERS[p.group] ?? []) taken.add(p.prefix + g)
		keep.push(cls)
	}
	return keep.reverse().join(" ")
}
