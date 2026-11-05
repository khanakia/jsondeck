import * as React from "react";
import type { Row } from "../../core/config";
import type { ResolvedColumn, ResolvedTable } from "../../core/resolve";
/** Expanded row: field grid (+ custom render) and, when asked, nested tables of related rows. */
export declare function RowDetail({ row, table, fields, depth, parentId, onlyRelation, className, }: {
    row: Row;
    table: ResolvedTable;
    fields: ResolvedColumn[];
    depth: number;
    parentId: string;
    /** Show only this relation's rows (expand: { relation }) instead of the field grid. */
    onlyRelation?: string | undefined;
    /** User class slot `detailPanel`. */
    className?: string | undefined;
}): React.JSX.Element;
