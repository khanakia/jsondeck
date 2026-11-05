/**
 * Aggregation for charts and stat tiles. Pure: no React, no DOM.
 *
 *   rows ─ where ─ group (key × optional series) ─ measure ─ sort ─ top-N + "Other"
 *
 * Filtering reuses the table engine's operators (`matchCondition` from
 * query.ts), so a chart `where` and a table filter mean exactly the same thing.
 */
import type { FilterFieldType, FilterOperator } from "../sdt/types";
import { type Row } from "./query";
export type { Row };
/** Label used for a missing / empty group value. */
export declare const EMPTY_KEY = "(empty)";
/** Label of the bucket that collects everything past top-N. */
export declare const OTHER_KEY = "Other";
/**
 * One `where` entry. A scalar means "is", an array means "is any of",
 * an object picks an operator from query.ts (`gt`, `contains`, `between`, …).
 * `type` overrides the guessed comparison type (number / date / text).
 */
export type WhereClause = unknown | unknown[] | {
    op: FilterOperator;
    value?: unknown;
    type?: FilterFieldType;
};
/** Field (dot path allowed) → clause. All entries must match (AND). */
export type Where = Record<string, WhereClause>;
/** Read a field by name, falling back to a dot path (`tags.env`) when no flat key matches. */
export declare function getField(row: Row, field: string): unknown;
/** Compile a `where` into a row predicate once (cheap to call per row). */
export declare function compileWhere(where: Where | undefined): (row: Row) => boolean;
/** Rows matching a `where`. Returns the input array itself when there is nothing to filter. */
export declare function filterRows(rows: Row[], where?: Where): Row[];
export declare const TIME_BUCKETS: readonly ["day", "week", "month", "year"];
export type TimeBucket = (typeof TIME_BUCKETS)[number];
/** A group key: a field name (dot path ok) or a function of the row. */
export type KeyFn = string | ((row: Row) => unknown);
/** Bucket label of a date-ish value; "" when the value is not a date. Local calendar, like the table filters. */
export declare function timeBucket(v: unknown, bucket: TimeBucket): string;
/** Plain grouping: key → rows (array values put the row in every group they name). Insertion order. */
export declare function groupBy(rows: Row[], key: KeyFn, bucket?: TimeBucket): Map<string, Row[]>;
export declare const MEASURE_OPS: readonly ["count", "sum", "avg", "min", "max", "distinct"];
export type MeasureOp = (typeof MEASURE_OPS)[number];
/** `"count"`, `"sum:cost"`, or `{ op, field }`. `distinct` counts distinct values of `field`. */
export type Measure = "count" | `${MeasureOp}:${string}` | {
    op: MeasureOp;
    field?: string;
};
/** Normalise the shorthand forms into `{ op, field }`. Unknown ops fall back to count. */
export declare function parseMeasure(m: Measure | undefined): {
    op: MeasureOp;
    field?: string;
};
/** One measure over all rows (stat tiles). */
export declare function measure(rows: Row[], m?: Measure, where?: Where): number;
/**
 * - `"value"` / `"-value"`: by total, ascending / descending (default for categories: descending);
 * - `"key"` / `"-key"`: by label (default for time buckets: ascending);
 * - a string array: that order first (e.g. severity), unknown values after, by total.
 */
export type SortSpec = "value" | "-value" | "key" | "-key" | string[];
export type AggregateSpec = {
    /** Category axis. Omit for a single "All" group. */
    groupBy?: KeyFn | undefined;
    /** Bucket the groupBy values as dates. */
    bucket?: TimeBucket | undefined;
    /** Second split (stacked / grouped bars, multi-line). */
    series?: KeyFn | undefined;
    measure?: Measure | undefined;
    where?: Where | undefined;
    sort?: SortSpec | undefined;
    /** Keep the first N keys after sorting and fold the rest into "Other". Ignored for time buckets. */
    top?: number | undefined;
    /** Same for series. */
    topSeries?: number | undefined;
    /** Fill missing time buckets with 0 (default true when `bucket` is set). */
    fill?: boolean | undefined;
};
/** keys × series matrix: `cells[k][s]`. `series` is `["value"]` when there is no split. */
export type AggResult = {
    keys: string[];
    series: string[];
    cells: number[][];
    totals: number[];
    seriesTotals: number[];
};
export declare const SINGLE_SERIES = "value";
/** Group, measure, sort and fold. One pass over the rows; fine for 50k rows. */
export declare function aggregate(rows: Row[], spec?: AggregateSpec): AggResult;
