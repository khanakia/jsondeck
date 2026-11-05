/**
 * Links between tables. Pure: no React.
 *
 * A relation `{ from: "findings.affected", to: "ec2.private_ip" }` says: the
 * value in findings.affected names the ec2 row whose private_ip equals it.
 * Either side may hold an array (many-to-many). The field part may be a dot
 * path into nested objects (`ec2.tags.owner`).
 *
 * The index is built once (O(total rows)); each lookup is a few Map reads,
 * so a detail drawer can ask on every row click even at ~50k rows.
 */
import { type Row } from "./field";
export type Relation = {
    /** `table.field` holding the pointer. */
    from: string;
    /** `table.field` being pointed at (usually the target table's key). */
    to: string;
    /** Optional display name for the forward link (default: target table name). */
    label?: string;
    /** Optional display name for the reverse link (default: source table name). */
    reverseLabel?: string;
};
/** forward = rows this row points at; reverse = rows that point at this row. */
export type Direction = "forward" | "reverse";
export type RelatedGroup = {
    relation: Relation;
    direction: Direction;
    /** The other table. */
    table: string;
    /** The field in the other table that matched. */
    field: string;
    label: string;
    rows: Row[];
};
export type RelationIndex = {
    /** Related rows in every direction, one group per relation side that applies to this table. Empty groups are kept (count 0). */
    lookup(table: string, row: Row): RelatedGroup[];
    /** Same as lookup but counts only (no row arrays kept by the caller). */
    counts(table: string, row: Row): {
        label: string;
        table: string;
        direction: Direction;
        count: number;
    }[];
    /** Rows of `table` whose `field` holds `value` (for rendering a cell value as a link). */
    find(table: string, field: string, value: unknown): Row[];
    /** Does this `table.field` point somewhere? Returns the forward relations that start at it. */
    linksFrom(table: string, field: string): Relation[];
    /** Relations whose `from` or `to` names a table that is not in the data (config typos). */
    invalid: {
        relation: Relation;
        reason: string;
    }[];
};
type Side = {
    table: string;
    field: string;
};
/** Split `table.field.path` at the first dot. */
export declare function parseSide(s: string): Side | null;
export declare function buildRelations(tables: Record<string, Row[]>, relations?: Relation[]): RelationIndex;
export {};
