/**
 * Every theme token jsondeck reads, with its light and dark default and a
 * description. Pure data, published as `JsonDeck.THEME_TOKENS`. Kept apart
 * from theme-tokens.ts (the names) so the first download does not carry it:
 * the same defaults are in the stylesheet (styles.css).
 */
import type { ThemeTokenName } from "./theme-tokens"

/** Key order follows TOKEN_NAMES; a missing or extra key is a type error. */
export const THEME_TOKENS = {
	page: { light: "#f4f4f5", dark: "#09090b", description: "Page background (for host pages; the root itself is transparent)" },
	card: { light: "#ffffff", dark: "#18181b", description: "Block surface: tables, charts, cards, drawer" },
	"card-border": { light: "rgb(228 228 231 / 0.8)", dark: "rgb(39 39 42 / 0.7)", description: "Block border (subtle; blocks separate from the page by this border only)" },
	"card-shadow": { light: "none", dark: "none", description: "Block shadow; none by default (set e.g. 0 1px 2px rgb(0 0 0 / 0.05) to add one back)" },
	background: { light: "#ffffff", dark: "#18181b", description: "Inner surfaces: table cells, inputs" },
	foreground: { light: "#18181b", dark: "#fafafa", description: "Text" },
	muted: { light: "#f4f4f5", dark: "#27272a", description: "Muted surface: table header, hover" },
	"muted-foreground": { light: "#71717a", dark: "#a1a1aa", description: "Secondary text" },
	accent: { light: "#f4f4f5", dark: "#27272a", description: "Hover / active item background" },
	"accent-foreground": { light: "#18181b", dark: "#fafafa", description: "Text on accent" },
	primary: { light: "#18181b", dark: "#fafafa", description: "Primary buttons, active chips, badges" },
	"primary-foreground": { light: "#fafafa", dark: "#18181b", description: "Text on primary" },
	secondary: { light: "#f4f4f5", dark: "#27272a", description: "Neutral badges" },
	"secondary-foreground": { light: "#18181b", dark: "#fafafa", description: "Text on secondary" },
	popover: { light: "#ffffff", dark: "#18181b", description: "Menus, popovers, tooltips of charts" },
	"popover-foreground": { light: "#18181b", dark: "#fafafa", description: "Text in menus" },
	border: { light: "#efeff1", dark: "rgb(39 39 42 / 0.6)", description: "Inner dividers: row lines, header bottom (a step lighter than card-border)" },
	input: { light: "#e4e4e7", dark: "#27272a", description: "Input borders" },
	ring: { light: "#a1a1aa", dark: "#52525b", description: "Focus ring, chart axes" },
	destructive: { light: "#dc2626", dark: "#ef4444", description: "Danger actions" },
	tabs: { light: "#e4e4e7", dark: "#27272a", description: "Segmented tab pill on the page" },
	"tabs-card": { light: "#f4f4f5", dark: "#27272a", description: "Segmented tab pill inside a card" },
	"tab-badge": { light: "#d4d4d8", dark: "#3f3f46", description: "Tab count badge" },
	"chart-1": { light: "#2a78d6", dark: "#3987e5", description: "Chart palette slot 1" },
	"chart-2": { light: "#eb6834", dark: "#d95926", description: "Chart palette slot 2" },
	"chart-3": { light: "#1baf7a", dark: "#199e70", description: "Chart palette slot 3" },
	"chart-4": { light: "#eda100", dark: "#c98500", description: "Chart palette slot 4" },
	"chart-5": { light: "#e87ba4", dark: "#d55181", description: "Chart palette slot 5" },
	"chart-6": { light: "#008300", dark: "#008300", description: "Chart palette slot 6" },
	"chart-7": { light: "#6250d6", dark: "#9085e9", description: "Chart palette slot 7" },
	"chart-8": { light: "#e34948", dark: "#e66767", description: "Chart palette slot 8" },
	"chart-other": { light: "#b5b3ab", dark: "#5f5e58", description: "The folded 'Other' group" },
	good: { light: "#0ca30c", dark: "#0ca30c", description: "Status: good" },
	warning: { light: "#fab219", dark: "#fab219", description: "Status: warning" },
	serious: { light: "#ec835a", dark: "#ec835a", description: "Status: serious" },
	critical: { light: "#d03b3b", dark: "#d03b3b", description: "Status: critical" },
	up: { light: "#006300", dark: "#0ca30c", description: "Delta up (stat tiles)" },
	down: { light: "#b42828", dark: "#e66767", description: "Delta down (stat tiles)" },
	radius: { light: "6px", dark: "6px", description: "Control radius (cards are 2px rounder)" },
	"font-size": { light: "13px", dark: "13px", description: "Base text size" },
	"row-height": { light: "28px", dark: "28px", description: "Table row height, compact density" },
	"row-height-comfortable": { light: "36px", dark: "36px", description: "Table row height, comfortable density" },
	"sticky-top": { light: "0px", dark: "0px", description: "Offset for sticky parts (sidebar, table of contents, heading scroll) below a host's own sticky header" },
} as const satisfies Record<ThemeTokenName, { light: string; dark: string; description: string }>
