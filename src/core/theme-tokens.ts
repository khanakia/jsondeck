/**
 * Theme token names and class slots, the small part of theming the core
 * needs: each token is the CSS variable `--jds-<name>` on `.jd-root`, so it can
 * be overridden in config (`theme: { light: {...}, dark: {...} }`) or in plain
 * CSS (`.jd-root { --jds-primary: #2563eb }`, `.jd-root.jd-dark { ... }`).
 * The defaults and descriptions (`THEME_TOKENS`) live in theme-defaults.ts:
 * the stylesheet already holds the defaults, so only the public constant
 * needs them and the first download does not.
 */

/** Every token name jsondeck reads (theme-defaults.ts must give each one a default; the type check enforces it). */
export const TOKEN_NAMES = ["page", "card", "card-border", "card-shadow", "background", "foreground", "muted", "muted-foreground", "accent", "accent-foreground", "primary", "primary-foreground", "secondary", "secondary-foreground", "popover", "popover-foreground", "border", "input", "ring", "destructive", "tabs", "tabs-card", "tab-badge", "chart-1", "chart-2", "chart-3", "chart-4", "chart-5", "chart-6", "chart-7", "chart-8", "chart-other", "good", "warning", "serious", "critical", "up", "down", "radius", "font-size", "row-height", "row-height-comfortable", "sticky-top"] as const

export type ThemeTokenName = (typeof TOKEN_NAMES)[number]
/** Runtime check that a string is a token name. */
export function isTokenName(k: string): k is ThemeTokenName {
	return TOKEN_NAMES.some((n) => n === k)
}
export type ThemeTokens = { [K in ThemeTokenName]?: string | undefined }

/** Styling hooks: a user class name per slot, applied as given (not prefixed). */
export const CLASS_SLOTS = [
	"root", "page", "section", "sectionTitle", "grid", "item", "card", "cardHeader", "cardTitle", "toolbar",
	"table", "thead", "th", "tbody", "tr", "td", "groupRow", "detailPanel", "pagination",
	"chart", "stat", "kv", "markdown", "drawer", "tabs", "tab", "tabActive", "badge",
] as const
export type ClassSlot = (typeof CLASS_SLOTS)[number]
export type ClassNames = { [K in ClassSlot]?: string | undefined }

/** Token overrides as inline CSS variables for the root element. */
export function tokenStyle(tokens: ThemeTokens | undefined): Record<string, string> {
	const out: Record<string, string> = {}
	for (const [k, v] of Object.entries(tokens ?? {})) if (typeof v === "string" && v) out[`--jds-${k}`] = v
	return out
}
