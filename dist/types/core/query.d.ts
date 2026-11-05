/**
 * The in-memory query engine. Pure: no React. It replaces the server-paged
 * server layer (useServerQuery + buildWhere → GraphQL `where`): the same
 * FilterCondition / SortRule state is applied straight to the rows.
 *
 *   rows ─ search ─ filters (AND) ─ multi-sort ─ page slice
 */
import type { FilterCondition, FilterFieldType, SortRule } from "../sdt/types";
import type { Comparator, SortKind } from "./config";
export type Row = Record<string, unknown>;
/** What the engine needs to know about a field: its filter type and sort order. */
export type FieldInfo = {
    id: string;
    type: FilterFieldType;
    sort?: SortKind | Comparator | undefined;
    order?: string[] | undefined;
};
/** Text a value is searched and compared by: objects as JSON, the rest as strings. */
export declare function toText(v: unknown): string;
/** Local calendar day (YYYY-MM-DD) of a date-ish value; "" when not a date. */
export declare function localDay(v: unknown): string;
/**
 * One condition against one cell. An incomplete condition (no value yet)
 * matches everything, so a half-built filter pill never empties the table.
 */
export declare function matchCondition(cell: unknown, cond: FilterCondition, type: FilterFieldType): boolean;
/** Global search: any of the given fields contains the query (case-insensitive). */
export declare function matchSearch(row: Row, query: string, fieldIds: string[]): boolean;
/** Stable multi-sort by rules in priority order. */
export declare function sortRows(rows: Row[], rules: SortRule[], fields: Map<string, FieldInfo>): Row[];
export type QueryInput = {
    search: string;
    searchFields: string[];
    filters: FilterCondition[];
    sort: SortRule[];
    fields: FieldInfo[];
};
/** Search + filters (AND) + sort. Pagination is a slice done by the caller. */
export declare function applyQuery(rows: Row[], q: QueryInput): Row[];
/**
 * Page numbers to show with "…" gaps: first, last, and a window around the
 * current page. 1-based in and out (pagination is 1-based).
 */
export declare function pageList(current: number, count: number, siblings?: number): (number | "…")[];
