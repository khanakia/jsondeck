/**
 * Renders one placed component (table, chart, stat, kv card, markdown, facets)
 * from its resolved item. Reads only the resolved spec and the page context.
 */
import * as React from "react";
import type { Row } from "../core/config";
import type { ResolvedItem } from "../core/layout";
import type { ResolvedDeck } from "../core/resolve";
import { type TableApi } from "../sdt/ClientDataTable";
import type { RenderCtx } from "./cells";
/** What the page shares with every component on it. */
export type PageCtx = {
    deck: ResolvedDeck;
    /** The page this item is on (heading anchors are `#/<pageId>/<anchor>`). */
    pageId: string;
    renderCtx: RenderCtx;
    /** Page filter bar: field → chosen value. */
    pageFilters: Record<string, string>;
    register: (id: string, api: TableApi) => () => void;
    /** A chart bar / slice or facet value was clicked: filter the item's target tables. */
    select: (source: ResolvedItem, field: string, value: string) => void;
    focusedId: string | null;
    setFocused: (id: string) => void;
    openRow: (table: string, row: Row) => void;
    toolbarEnd?: React.ReactNode | undefined;
    /** Master–detail: each table item's selected rows, and the table behind an item id. */
    selections: Record<string, Row[]>;
    setSelection: (id: string, rows: Row[]) => void;
    resetKeys: Record<string, number>;
    clearSelection: (id: string) => void;
    itemTable: (id: string) => string | undefined;
    /** Item ids that some other item uses as its master. */
    masters: ReadonlySet<string>;
};
export declare const PageContext: React.Context<PageCtx | null>;
/** Rows of a dataset (computed columns included) after the page filter bar. */
export declare function pageRows(ctx: PageCtx, table: string): Row[];
/** An item, wrapped in a Preview / Code box when its spec sets `code`. */
export declare function ItemView({ item }: {
    item: ResolvedItem;
}): React.JSX.Element;
