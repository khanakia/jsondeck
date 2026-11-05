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
import type { PageConfig } from "../core/config";
import type { ResolvedPage } from "../core/layout";
import type { ResolvedDeck } from "../core/resolve";
/** One promise for the parts this deck shows on its first paint, or null when there is none. */
export declare function preloadFor(deck: ResolvedDeck, layout: {
    pages: ResolvedPage[];
    configs: PageConfig[];
}): Promise<unknown> | null;
