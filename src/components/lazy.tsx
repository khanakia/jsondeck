/**
 * Every component that loads on demand, in one place. Each `import()` here is
 * its own chunk in the split builds (dist/chunks/<Name>.js for the <script>
 * loader, dist/esm/<Name>.js for the ES module), fetched the first time a page
 * renders that component; in the single file (jsondeck.full.js) the imports
 * are inlined and resolve at once.
 *
 * Rule: nothing else may import these modules statically, or the bundler folds
 * them back into the core and the first download grows again. The size check
 * in scripts/verify-cdn.mjs fails when that happens.
 *
 * Popups (Base UI menus, popovers, dialogs) load the same way through
 * ui/deferred.tsx, because their trigger has to show before the chunk is there.
 */
import * as React from "react"
import { cn } from "@/lib/utils"

/** Charts: bar, line, area, pie, donut, sparkline. */
export const Chart = React.lazy(() => import("../viz/Chart").then((m) => ({ default: m.Chart })))
export const StatTile = React.lazy(() => import("../viz/StatTile").then((m) => ({ default: m.StatTile })))
export const KeyValueCard = React.lazy(() => import("../viz/KeyValueCard").then((m) => ({ default: m.KeyValueCard })))
/** Markdown with callouts, steps, heading anchors and code fences. */
export const Markdown = React.lazy(() => import("../viz/Markdown").then((m) => ({ default: m.Markdown })))
/** "On this page" outline. */
export const Toc = React.lazy(() => import("./Toc").then((m) => ({ default: m.Toc })))
/** Preview / Code box with the syntax highlighter. */
export const CodeView = React.lazy(() => import("./CodeView").then((m) => ({ default: m.CodeView })))
/** ⌘K site search (builds its index when first opened). */
const loadSearch = () => import("./SearchDialog")
export const SearchDialog = React.lazy(() => loadSearch().then((m) => ({ default: m.SearchDialog })))
/**
 * Decks with site search fetch its chunk once the page is idle, so the first
 * keystrokes after ⌘K or "/" are never typed into a box that is not there yet.
 */
export function preloadSearchWhenIdle(): () => void {
	const run = () => void loadSearch().catch(() => undefined)
	if (typeof window.requestIdleCallback === "function") {
		const id = window.requestIdleCallback(run, { timeout: 2000 })
		return () => window.cancelIdleCallback(id)
	}
	const t = window.setTimeout(run, 200)
	return () => window.clearTimeout(t)
}
/** Side drawer for a row and its related rows. */
export const RowDrawer = React.lazy(() => import("./RowDrawer").then((m) => ({ default: m.RowDrawer })))
/** Config issues box (only when a config has issues). */
export const IssuesBox = React.lazy(() => import("./IssuesBox").then((m) => ({ default: m.IssuesBox })))
/** Layout editor tools (per-item toolbar, add control, Copy config / Reset in the deck header). */
export const DeckEditTools = React.lazy(() => import("./EditTools").then((m) => ({ default: m.DeckEditTools })))
export const ItemTools = React.lazy(() => import("./EditTools").then((m) => ({ default: m.ItemTools })))
export const AddItem = React.lazy(() => import("./EditTools").then((m) => ({ default: m.AddItem })))
/** Right-click menu. */
export const ContextMenu = React.lazy(() => import("./ContextMenu").then((m) => ({ default: m.ContextMenu })))
/** Expanded row: detail fields and nested tables. */
export const RowDetail = React.lazy(() => import("../sdt/rows/RowDetail").then((m) => ({ default: m.RowDetail })))
/** Quick filter strip (range, chips, toggle, search), when a table configures `quickFilters`. */
export const QuickFilters = React.lazy(() => import("../sdt/rows/RowFeatures").then((m) => ({ default: m.QuickFilters })))
/** "n selected · Copy as … · Clear" bar, once rows are selected. */
export const SelectionBar = React.lazy(() => import("../sdt/rows/RowFeatures").then((m) => ({ default: m.SelectionBar })))
/** Date filters with the calendar (react-day-picker + date-fns). */
export const DateControl = React.lazy(() => import("../sdt/filters/controls/DateControl").then((m) => ({ default: m.DateControl })))
export const DateRangeControl = React.lazy(() => import("../sdt/filters/controls/DateRangeControl").then((m) => ({ default: m.DateRangeControl })))

/**
 * What shows while a chunk loads: an empty box of the given height (0 by
 * default), so nothing inside a table moves and no scrollbar appears; charts
 * and widgets pass a height close to their final one.
 */
export function Pending({ height = 0, className }: { height?: number | undefined; className?: string | undefined }) {
	return <div data-jd="pending" aria-busy="true" className={cn("jd:w-full", className)} style={height ? { height } : undefined} />
}

/** `<Suspense>` with the Pending box. */
export function OnDemand({ children, height }: { children: React.ReactNode; height?: number | undefined }) {
	return <React.Suspense fallback={<Pending height={height} />}>{children}</React.Suspense>
}
