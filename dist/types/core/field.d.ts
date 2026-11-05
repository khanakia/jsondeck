/**
 * Reading a field from a row, with dotted paths into nested objects
 * ("owner.name"). Its own tiny module so the relations index (always loaded)
 * does not pull in aggregate.ts (charts, stat tiles, group totals), which
 * loads on demand.
 */
export type Row = Record<string, unknown>;
/** A field's value; "a.b.c" walks nested objects when the row has no "a.b.c" key. */
export declare function getField(row: Row, field: string): unknown;
