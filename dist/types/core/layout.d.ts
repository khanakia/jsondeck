/**
 * Pages, sections and placed components. Pure: no React.
 *  - resolvePages: config.pages (or the default "one tab per table" layout)
 *    → resolved pages, with each table placement resolved per spot.
 *  - Layout edits (move, resize, add, remove) are pure functions over a
 *    PageConfig, so the edit mode only holds state and calls these.
 */
import { type ComponentBase, type PageConfig, type PageItem } from "./config";
import { type ResolvedDeck, type ResolvedTable } from "./resolve";
import { type Issue } from "./validate";
export declare const COMPONENTS: readonly ["table", "chart", "stat", "kv", "markdown", "facets", "toc"];
/** Kinds that read no dataset (no `table` key). */
export declare const TABLELESS: readonly ComponentKind[];
export type ComponentKind = (typeof COMPONENTS)[number];
export type ResolvedItem = {
    /** Instance id: keys table state, saved views and edit operations. */
    id: string;
    kind: ComponentKind;
    span: number;
    height?: number | undefined;
    title?: string | undefined;
    /** Dataset name (every kind but markdown). */
    table?: string | undefined;
    /** The item as written (charts, stats, kv and facets read their spec from it). */
    spec: PageItem;
    /** Table components: the placement resolved (dataset spec → overrides). */
    placement?: ResolvedTable | undefined;
};
export type ResolvedSection = {
    /** Path in the page ("0", "0.1"): addresses the section for edits. */
    path: string;
    title?: string | undefined;
    description?: string | undefined;
    collapsible: boolean;
    collapsed: boolean;
    columns: number[];
    items: ResolvedItem[];
    sections: ResolvedSection[];
    tabs: boolean;
    /** Count shown on a tab (the default layout shows row counts). */
    badge?: number | undefined;
};
export type ResolvedPage = {
    id: string;
    title: string;
    group?: string | undefined;
    filters: string[];
    sections: ResolvedSection[];
};
/** "Server inventory" → "server-inventory" (URL hash id). */
export declare function slug(s: string): string;
/** The layout used when config has no `pages`: one page, one tab per table. */
export declare function defaultPages(deck: ResolvedDeck): PageConfig[];
/** Resolve one page config (also used after a layout edit). */
export declare function resolvePage(deck: ResolvedDeck, raw: PageConfig, index: number, issues: Issue[]): ResolvedPage;
export declare function resolvePages(deck: ResolvedDeck): {
    pages: ResolvedPage[];
    configs: PageConfig[];
    issues: Issue[];
};
/** Every item gets an explicit id, so saved layouts can find them again. */
export declare function withItemIds(p: PageConfig, pageId: string): PageConfig;
export declare function moveItem(p: PageConfig, itemId: string, toPath: string, toIndex: number): PageConfig;
export declare function updateItem(p: PageConfig, itemId: string, patch: Partial<ComponentBase>): PageConfig;
export declare function removeItem(p: PageConfig, itemId: string): PageConfig;
export declare function addItem(p: PageConfig, path: string, item: PageItem): PageConfig;
/** A starter spec for "Add item": sensible defaults from the dataset's resolved columns. */
export declare function starterItem(deck: ResolvedDeck, kind: ComponentKind, table: string, id: string): PageItem;
/** Plain JSON of a page (functions dropped), for "Copy config" and localStorage. */
export declare function plainPage(p: PageConfig): unknown;
/**
 * Re-attach an edited page saved as plain JSON to the original config: items
 * whose id exists in the original keep their functions; the saved order,
 * span, height and membership win.
 */
export declare function restorePage(original: PageConfig, saved: unknown): PageConfig | null;
