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
import * as React from "react";
/** A chart item on a page, with the chart itself (bar, line, area, pie, donut, sparkline). */
export declare const ChartItemView: React.LazyExoticComponent<typeof import("./ChartItem").ChartItemView>;
/** Facets (count per value, click to filter). */
export declare const Facets: React.LazyExoticComponent<typeof import("./Facets").Facets>;
/** An item in a Preview / Code box (`code: true`): its spec as source text, with the code view. */
export declare const ItemCode: React.LazyExoticComponent<typeof import("./ItemCode").ItemCode>;
export declare const StatTile: React.LazyExoticComponent<typeof import("../viz/StatTile").StatTile>;
export declare const KeyValueCard: React.LazyExoticComponent<typeof import("../viz/KeyValueCard").KeyValueCard>;
/** Markdown with callouts, steps, heading anchors and code fences. */
export declare const Markdown: React.LazyExoticComponent<typeof import("../viz/Markdown").Markdown>;
/** "On this page" outline. */
export declare const Toc: React.LazyExoticComponent<typeof import("./Toc").Toc>;
export declare const CodeView: React.LazyExoticComponent<typeof import("./CodeView").CodeView>;
/** Start fetching the code view early (example() does, so it arrives with the example shell). */
export declare function preloadCodeView(): void;
export declare const SearchDialog: React.LazyExoticComponent<typeof import("./SearchDialog").SearchDialog>;
/**
 * Decks with site search fetch its chunk once the page is idle, so the first
 * keystrokes after ⌘K or "/" are never typed into a box that is not there yet.
 */
export declare function preloadSearchWhenIdle(): () => void;
/** "No rows" / "No matches" message of an empty table (sdt/table/EmptyState.tsx). */
export declare const EmptyState: React.LazyExoticComponent<typeof import("../sdt/table/EmptyState").EmptyState>;
/** Side drawer for a row and its related rows. */
export declare const RowDrawer: React.LazyExoticComponent<typeof import("./RowDrawer").RowDrawer>;
/** Config issues box (only when a config has issues). */
export declare const IssuesBox: React.LazyExoticComponent<typeof import("./IssuesBox").IssuesBox>;
/** Layout editor tools (per-item toolbar, add control, Copy config / Reset in the deck header). */
export declare const DeckEditTools: React.LazyExoticComponent<typeof import("./EditTools").DeckEditTools>;
export declare const ItemTools: React.LazyExoticComponent<typeof import("./EditTools").ItemTools>;
export declare const AddItem: React.LazyExoticComponent<typeof import("./EditTools").AddItem>;
/** A row's right-click menu (items and the menu component). */
export declare const RowMenu: React.LazyExoticComponent<typeof import("../sdt/rows/RowMenu").RowMenu>;
/** Expanded row: detail fields and nested tables. */
export declare const RowDetail: React.LazyExoticComponent<typeof import("../sdt/rows/RowDetail").RowDetail>;
/** Quick filter strip (range, chips, toggle, search), when a table configures `quickFilters`. */
export declare const QuickFilters: React.LazyExoticComponent<typeof import("../sdt/rows/RowFeatures").QuickFilters>;
/** "n selected · Copy as … · Clear" bar, once rows are selected. */
export declare const SelectionBar: React.LazyExoticComponent<typeof import("../sdt/rows/RowFeatures").SelectionBar>;
export declare const DateControl: React.LazyExoticComponent<typeof import("../sdt/filters/controls/DateControl").DateControl>;
export declare const DateRangeControl: React.LazyExoticComponent<typeof import("../sdt/filters/controls/DateRangeControl").DateRangeControl>;
/**
 * What shows while a chunk loads: an empty box of the given height (0 by
 * default), so nothing inside a table moves and no scrollbar appears; charts
 * and widgets pass a height close to their final one.
 */
export declare function Pending({ height, className }: {
    height?: number | undefined;
    className?: string | undefined;
}): React.JSX.Element;
/** `<Suspense>` with the Pending box. */
export declare function OnDemand({ children, height }: {
    children: React.ReactNode;
    height?: number | undefined;
}): React.JSX.Element;
