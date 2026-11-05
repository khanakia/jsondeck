import * as React from "react";
import type { AutoTable } from "../auto";
import type { ResolvedTable } from "../core/resolve";
import { type Row } from "../core/query";
import type { FilterCondition } from "./types";
export type ClientDataTableProps = {
    /** The resolved table (rows, column specs, defaults). */
    table: ResolvedTable;
    /** Engine shapes built from it (columns, filter fields, sort options, field info). */
    auto: AutoTable;
    /** Only the visible table listens to keyboard shortcuts. */
    active?: boolean | undefined;
    toolbarEnd?: React.ReactNode | undefined;
    className?: string | undefined;
    /** Instance id: keys saved views and page wiring (one dataset may be placed twice). Default: the table name. */
    instanceId?: string | undefined;
    /** Extra AND conditions from the page filter bar (not shown as pills). */
    pageFilters?: FilterCondition[] | undefined;
    /** Row click when the table config has no onRowClick (opens the row drawer). */
    onRowOpen?: ((row: Row) => void) | undefined;
    /** Show the CSV / JSON export menu for the filtered rows. */
    exportable?: boolean | undefined;
    /** Called on pointer-down inside the table (the page uses it to pick the keyboard target). */
    onFocus?: (() => void) | undefined;
    /** Page wiring: lets charts and facets add filters to this instance. */
    register?: ((id: string, api: TableApi) => () => void) | undefined;
    /** Nesting depth (0 = top level); nested related tables stop at MAX_DEPTH. */
    depth?: number | undefined;
    /** Compact nested look (no views, smaller chrome). */
    compact?: boolean | undefined;
    /** Selection changes (master–detail and the selection bar). */
    onSelectionChange?: ((rows: Row[]) => void) | undefined;
    /** A master's selection restricts this table to these rows (null = no restriction). */
    restrictRows?: ReadonlySet<Row> | null | undefined;
    /** Chip text for the restriction ("F-024") and how to clear it. */
    restrictLabel?: string | undefined;
    onClearRestrict?: (() => void) | undefined;
    /** A plain row click selects that one row (used by master tables without checkboxes). */
    selectOnClick?: boolean | undefined;
    /** Bumping this clears the selection (the master chip's ✕ on a detail table). */
    selectionResetKey?: number | undefined;
};
/** What the page can do to a placed table: add a filter on a field. */
export type TableApi = {
    table: string;
    addFilter: (field: string, value: string) => void;
};
/**
 * ClientDataTable
 * ─────────────────────────────────────────────────────────────────────
 * the table component, working on data held in the browser.
 * Same state (reducer), toolbar (FilterBar + SortDropdown + columns + views),
 * header menus, resize/reorder and grid look. What changed:
 *   • useServerQuery + buildWhere → `applyQuery` (pure, core/query.ts) runs the
 *     same FilterCondition/SortRule state over the rows in memory
 *   • cursor paging → numbered pages (page is 1-based in state.pagination)
 *   • URL state, row actions/context menu, refetch and fetchAll are dropped
 *   • header click sorts (shift-click adds a sort), on top of the header menu
 */
export declare function ClientDataTable(props: ClientDataTableProps): React.JSX.Element;
