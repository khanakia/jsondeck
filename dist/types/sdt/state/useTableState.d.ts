import * as React from "react";
import type { FilterCondition, SortRule, TableState } from "../types";
type UseTableStateOptions = {
    defaultSort?: SortRule[] | undefined;
    /** Seed the initial state — used for URL hydration / view restore */
    initial?: Partial<TableState> | undefined;
};
/**
 * Owns the single source of truth for the table.
 */
export declare function useTableState(opts?: UseTableStateOptions): {
    state: TableState;
    dispatch: React.ActionDispatch<[action: import("./reducer").TableAction]>;
    actions: {
        setSearch: (search: string) => void;
        setSort: (sort: SortRule[]) => void;
        addFilter: (filter: FilterCondition) => void;
        updateFilter: (filter: FilterCondition) => void;
        removeFilter: (id: string) => void;
        clearFilters: () => void;
        pageNext: (cursor: string | null) => void;
        pagePrev: (cursor: string | null) => void;
        resetPagination: () => void;
        setPage: (page: number) => void;
        replaceState: (newState: TableState) => void;
        setViewId: (viewId: string | null) => void;
        setHiddenColumns: (hiddenColumns: string[]) => void;
        toggleColumn: (columnId: string) => void;
        setColumnSizes: (columnSizes: Record<string, number>) => void;
        setColumnOrder: (columnOrder: string[]) => void;
        resetColumnLayout: () => void;
        setPageSize: (pageSize: number) => void;
        setGroupBy: (groupBy: string[]) => void;
        setDetailColumns: (detailColumns: string[] | null) => void;
        setLayout: (layoutId: string) => void;
    };
};
export {};
