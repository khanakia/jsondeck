/**
 * Saved views for one table, as an on-demand chunk: the storage, the list,
 * applying the default view, and the Views toolbar control with its create /
 * update / delete / default / favourite handlers. ClientDataTable shows a
 * look-alike trigger until this arrives (on hover, focus or click of the
 * Views button), or has it loaded before its first render when a default view
 * is stored (components/first-paint.ts), so the table opens on that view with
 * no flash.
 */
import * as React from "react";
import type { TableState } from "../types";
import type { SavedView, ViewStorage } from "./storage/ViewStorage";
/** The stored default view of a scope, read synchronously (built-in localStorage storage only). */
export declare function readDefaultView(scope: string): SavedView | null;
/** The table state a view opens on (page size kept; grouping falls back to the table's own). */
export declare function viewState(view: SavedView, groupBy: string[], pageSize: number): TableState;
export type ViewsControlProps = {
    /** Storage scope (`jsondeck:<instance id>`). */
    scope: string;
    /** A custom ViewStorage from config; default localStorage. */
    storage: ViewStorage | undefined;
    state: TableState;
    replaceState: (s: TableState) => void;
    setViewId: (id: string | null) => void;
    /** The table's configured grouping (a view without grouping falls back to it). */
    groupBy: string[];
    /** True when the table already opened on the default view (its first render read it). */
    openedOnDefault: boolean;
};
export declare function ViewsControl({ scope, storage, state, replaceState, setViewId, groupBy, openedOnDefault }: ViewsControlProps): React.JSX.Element;
