import type { FilterCondition, SortRule, TableState } from "../types";
export type TableAction = {
    type: "SET_SEARCH";
    search: string;
} | {
    type: "SET_SORT";
    sort: SortRule[];
} | {
    type: "ADD_FILTER";
    filter: FilterCondition;
} | {
    type: "UPDATE_FILTER";
    filter: FilterCondition;
} | {
    type: "REMOVE_FILTER";
    id: string;
} | {
    type: "CLEAR_FILTERS";
} | {
    type: "PAGE_NEXT";
    cursor: string | null;
} | {
    type: "PAGE_PREV";
    cursor: string | null;
} | {
    type: "RESET_PAGINATION";
} | {
    type: "SET_PAGE";
    page: number;
} | {
    type: "REPLACE_STATE";
    state: TableState;
} | {
    type: "SET_VIEW_ID";
    viewId: string | null;
} | {
    type: "SET_HIDDEN_COLUMNS";
    hiddenColumns: string[];
} | {
    type: "TOGGLE_COLUMN";
    columnId: string;
} | {
    type: "SET_COLUMN_SIZES";
    columnSizes: Record<string, number>;
} | {
    type: "SET_COLUMN_ORDER";
    columnOrder: string[];
} | {
    type: "RESET_COLUMN_LAYOUT";
} | {
    type: "SET_PAGE_SIZE";
    pageSize: number;
} | {
    type: "SET_LAYOUT";
    layoutId: string;
} | {
    type: "SET_GROUP_BY";
    groupBy: string[];
} | {
    type: "SET_DETAIL_COLUMNS";
    detailColumns: string[] | null;
};
export declare function initialTableState(defaults?: Partial<TableState>): TableState;
export declare function tableReducer(state: TableState, action: TableAction): TableState;
