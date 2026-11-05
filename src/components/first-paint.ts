/**
 * What a deck needs before its first paint. Most parts load on use (a menu on
 * first click, the calendar when a date filter opens); a few change what the
 * first paint looks like, so loading them afterwards would make the page jump.
 * mount() asks this module which of them a deck has and renders once they are
 * there:
 *  - a stored default saved view (the table opens on that view),
 *  - pinned columns (sticky cells and their border),
 *  - the sidebar page navigation,
 *  - the deck header's theme toggle and edit button,
 *  - the page filter bar.
 * A plain table has none of them and renders at once.
 */
import type { PageConfig } from "../core/config"
import type { ResolvedPage, ResolvedSection } from "../core/layout"
import type { ResolvedDeck, ResolvedTable } from "../core/resolve"
import { hasStoredDefaultView } from "../core/views-key"
import { deckButtonsPart, pageFilterPart, pinningPart, sidebarPart, viewsPart } from "./parts"

/** Every placed table on the deck's pages: its instance id and resolved spec. */
function placedTables(pages: ResolvedPage[]): { id: string; table: ResolvedTable }[] {
	const out: { id: string; table: ResolvedTable }[] = []
	const walk = (secs: ResolvedSection[]) => {
		for (const s of secs) {
			for (const it of s.items) if (it.placement) out.push({ id: it.id, table: it.placement })
			walk(s.sections)
		}
	}
	for (const p of pages) walk(p.sections)
	return out
}

/** One promise for the parts this deck shows on its first paint, or null when there is none. */
export function preloadFor(deck: ResolvedDeck, layout: { pages: ResolvedPage[]; configs: PageConfig[] }): Promise<unknown> | null {
	const placed = placedTables(layout.pages)
	const loads: Promise<unknown>[] = []
	// Built-in storage only: a custom storage answers asynchronously anyway, and its default view applies once listed.
	const viewIds = placed.filter((p) => p.table.views !== false && !p.table.views.storage).map((p) => p.id)
	if (hasStoredDefaultView(viewIds)) loads.push(viewsPart.load())
	if (placed.some((p) => p.table.columns.some((c) => c.pin))) loads.push(pinningPart.load())
	if (deck.config.nav === "sidebar" && layout.configs.length > 1) loads.push(sidebarPart.load())
	// Same rule as Deck: a deck with pages can be edited unless `editable: false`.
	if (deck.config.themeToggle === true || (deck.config.editable ?? deck.config.pages !== undefined)) loads.push(deckButtonsPart.load())
	if (layout.pages.some((p) => p.filters.length > 0)) loads.push(pageFilterPart.load())
	return loads.length ? Promise.all(loads) : null
}
