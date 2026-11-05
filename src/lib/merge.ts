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
 * in src/, plus a list of common overrides, and runs with the checks.
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
	overscroll: ["overscroll-x", "overscroll-y"],
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
	"scroll-m": ["scroll-mx", "scroll-my", "scroll-mt", "scroll-mr", "scroll-mb", "scroll-ml"],
	"scroll-p": ["scroll-px", "scroll-py", "scroll-pt", "scroll-pr", "scroll-pb", "scroll-pl"],
	"font-size": ["leading"],
	flex: ["basis", "grow", "shrink"],
	"line-clamp": ["display", "overflow"],
	"fvn-normal": ["fvn-ordinal", "fvn-slashed-zero", "fvn-figure", "fvn-spacing", "fvn-fraction"],
	"fvn-ordinal": ["fvn-normal"],
	"fvn-slashed-zero": ["fvn-normal"],
	"fvn-figure": ["fvn-normal"],
	"fvn-spacing": ["fvn-normal"],
	"fvn-fraction": ["fvn-normal"],
	translate: ["translate-x", "translate-y", "translate-none"],
	"translate-none": ["translate", "translate-x", "translate-y"],
	scale: ["scale-x", "scale-y"],
	touch: ["touch-x", "touch-y", "touch-pz"],
	"touch-x": ["touch"],
	"touch-y": ["touch"],
	"touch-pz": ["touch"],
	"border-spacing": ["border-spacing-x", "border-spacing-y"],
}

/** Whole-class utilities (no value part) and the group each sets. */
const EXACT: Record<string, string> = {}
const exact = (group: string, names: string) => {
	for (const n of names.split(" ")) EXACT[n] = group
}
exact("display", "block inline-block inline flex inline-flex table inline-table table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row-group table-row flow-root grid inline-grid contents list-item hidden")
exact("position", "static fixed absolute relative sticky")
exact("visibility", "visible invisible collapse")
exact("font-style", "italic not-italic")
exact("text-decoration-line", "underline overline line-through no-underline")
exact("text-transform", "uppercase lowercase capitalize normal-case")
exact("text-overflow", "truncate text-ellipsis text-clip")
exact("sr", "sr-only not-sr-only")
exact("fvn-normal", "normal-nums")
exact("fvn-ordinal", "ordinal")
exact("fvn-slashed-zero", "slashed-zero")
exact("fvn-figure", "lining-nums oldstyle-nums")
exact("fvn-spacing", "proportional-nums tabular-nums")
exact("fvn-fraction", "diagonal-fractions stacked-fractions")
exact("isolation", "isolate isolation-auto")
exact("box", "box-border box-content")
exact("float", "float-left float-right float-start float-end float-none")
exact("clear", "clear-left clear-right clear-both clear-none clear-start clear-end")
exact("text-alignment", "text-left text-center text-right text-justify text-start text-end")
exact("text-wrap", "text-wrap text-nowrap text-balance text-pretty")
exact("break", "break-normal break-words break-all break-keep")
exact("wrap", "wrap-break-word wrap-anywhere wrap-normal")
exact("flex-direction", "flex-row flex-row-reverse flex-col flex-col-reverse")
exact("flex-wrap", "flex-wrap flex-wrap-reverse flex-nowrap")
exact("grow", "grow grow-0")
exact("shrink", "shrink shrink-0")
exact("transform", "transform transform-cpu transform-gpu transform-none")
exact("antialiasing", "antialiased subpixel-antialiased")
exact("outline-style", "outline-dashed outline-dotted outline-double outline-none outline-hidden outline-solid")
exact("outline-w", "outline")
exact("border-style", "border-solid border-dashed border-dotted border-double border-hidden border-none")
exact("ring-w", "ring")
exact("ring-w-inset", "ring-inset")
exact("bg-clip", "bg-clip-border bg-clip-padding bg-clip-content bg-clip-text")
exact("bg-attachment", "bg-fixed bg-local bg-scroll")
exact("bg-repeat", "bg-repeat bg-no-repeat bg-repeat-x bg-repeat-y bg-repeat-round bg-repeat-space")
exact("bg-size", "bg-auto bg-cover bg-contain")
exact("bg-position", "bg-bottom bg-center bg-left bg-left-bottom bg-left-top bg-right bg-right-bottom bg-right-top bg-top")
exact("bg-image", "bg-none")
exact("shadow", "shadow")
exact("rounded", "rounded")
exact("border-w", "border")
exact("container", "container")
exact("@container", "@container")
exact("list-position", "list-inside list-outside")
exact("decoration-style", "decoration-solid decoration-double decoration-dotted decoration-dashed decoration-wavy")
exact("transition", "transition transition-all transition-colors transition-opacity transition-shadow transition-transform transition-none")
exact("select", "select-none select-text select-all select-auto")
exact("resize", "resize resize-none resize-x resize-y")
exact("pointer-events", "pointer-events-none pointer-events-auto")
exact("appearance", "appearance-none appearance-auto")
exact("whitespace", "whitespace-normal whitespace-nowrap whitespace-pre whitespace-pre-line whitespace-pre-wrap whitespace-break-spaces")
exact("touch", "touch-auto touch-none touch-manipulation")
exact("touch-x", "touch-pan-x touch-pan-left touch-pan-right")
exact("touch-y", "touch-pan-y touch-pan-up touch-pan-down")
exact("touch-pz", "touch-pinch-zoom")
exact("table-layout", "table-auto table-fixed")
exact("caption", "caption-top caption-bottom")
exact("border-collapse", "border-collapse border-separate")

/** Utilities with a value: stem → group (longest stem wins), for stems whose value never changes the group. */
const STEMS: Record<string, string> = {}
const stems = (names: string, group?: string) => {
	for (const n of names.split(" ")) STEMS[n] = group ?? n
}
stems("p px py ps pe pt pr pb pl m mx my ms me mt mr mb ml w h size min-w min-h max-w max-h gap gap-x gap-y")
stems("inset inset-x inset-y start end top right bottom left z order basis flex grow shrink col-span col-start col-end row-span row-start row-end")
stems("grid-cols grid-rows auto-cols auto-rows grid-flow overflow overflow-x overflow-y overscroll overscroll-x overscroll-y")
stems("rounded rounded-s rounded-e rounded-t rounded-r rounded-b rounded-l rounded-ss rounded-se rounded-ee rounded-es rounded-tl rounded-tr rounded-br rounded-bl")
stems("opacity cursor items justify justify-items justify-self content self place-content place-items place-self")
stems("leading tracking line-clamp list indent align aspect columns object")
stems("duration delay ease origin rotate scale scale-x scale-y skew-x skew-y translate translate-x translate-y")
stems("space-x space-y divide-x divide-y underline-offset outline-offset ring-offset")
stems("scroll-m scroll-mx scroll-my scroll-mt scroll-mr scroll-mb scroll-ml scroll-p scroll-px scroll-py scroll-pt scroll-pr scroll-pb scroll-pl will-change content-visibility")
stems("blur backdrop-blur border-spacing border-spacing-x border-spacing-y accent caret")
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
