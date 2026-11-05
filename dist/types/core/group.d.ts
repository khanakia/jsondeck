/**
 * Row grouping for the table (multi-level, with subtotals). Pure.
 * Built on aggregate.ts: the same keys (`groupBy`, "(empty)" for missing,
 * arrays put a row in every group they name) and the same measures.
 */
import { type MeasureOp, type Row } from "./aggregate";
export type GroupAggregates = Record<string, MeasureOp>;
export type GroupOptions = {
    /** Per grouping column: the value order to use (e.g. severity). Values not listed come after, by value. */
    order?: Record<string, string[]> | undefined;
    /** Column → measure, computed for every group (count needs no column; use any key). */
    aggregates?: GroupAggregates | undefined;
};
export type GroupNode = {
    /** The grouping column at this level. */
    field: string;
    /** Group label as text ("(empty)" for missing values). */
    key: string;
    /** The first raw value seen for this group (undefined for "(empty)"). */
    value: unknown;
    /** Rows under this group, all levels. */
    count: number;
    /** Column → measured value for the rows in this group. */
    aggregates: Record<string, number>;
    /** 0 for the top level. */
    depth: number;
    /** Sub-groups when there is a next level … */
    children?: GroupNode[];
    /** … else the rows themselves. */
    rows?: Row[];
};
/**
 * Group rows by one or more columns. `by: []` returns no groups.
 * Rows inside a leaf keep their input order (sort the rows first to sort within groups).
 */
export declare function groupRows(rows: Row[], by: string[], opts?: GroupOptions): GroupNode[];
/** Depth-first list of nodes, skipping the children of collapsed group paths ("sev\0high"). For rendering flat rows. */
export declare function flattenGroups(nodes: GroupNode[], collapsed?: ReadonlySet<string>, parent?: string): {
    node: GroupNode;
    path: string;
}[];
