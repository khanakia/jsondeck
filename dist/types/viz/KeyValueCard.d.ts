import { type Measure, type Row, type Where } from "../core/aggregate";
/** Column type name: text, number, date, datetime, url, ip, email, boolean, enum, json, mono (others show as text). */
type ColumnType = string;
/**
 * The part of a column the card needs. Structural on purpose, so the table's
 * resolved columns (core/resolve.ts ResolvedColumn) can be passed straight in.
 */
export type KVColumn = {
    id: string;
    label?: string;
    type?: string;
    format?: string | ((value: unknown, row: Row) => string);
};
export type KVField = string | {
    field: string;
    label?: string;
    type?: ColumnType;
};
export type KVSpec = {
    title?: string | undefined;
    /** Which fields of `row` to show, in order. Default: every key of the row. */
    fields?: KVField[] | undefined;
    /** Aggregates over `rows` instead of (or as well as) one row: label → measure (+ optional where). */
    aggregates?: {
        label: string;
        measure: Measure;
        where?: Where;
    }[] | undefined;
    /** Two columns of pairs on wide cards. */
    columns?: 1 | 2 | undefined;
};
export type KeyValueCardProps = {
    spec: KVSpec;
    /** The one row to show. */
    row?: Row | undefined;
    /** Rows the aggregates run over. */
    rows?: Row[] | undefined;
    /** Column specs (from guess.ts) so values use the table's formats. */
    columnSpecs?: KVColumn[] | undefined;
    /** Click on a value: (field, value). */
    onSelect?: (field: string, value: unknown) => void | undefined;
    className?: string | undefined;
};
export declare function KeyValueCard({ spec, row, rows, columnSpecs, onSelect, className }: KeyValueCardProps): import("react").JSX.Element;
export {};
