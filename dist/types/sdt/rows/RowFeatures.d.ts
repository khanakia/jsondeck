import * as React from "react";
import { useLabels } from "../../lib/labels";
import { type CopyFormat } from "../../core/clipboard";
import type { Row } from "../../core/config";
import type { ResolvedColumn, ResolvedTable } from "../../core/resolve";
import type { FilterCondition } from "../types";
/** Nesting stops here (a guard against relation cycles). */
export declare const MAX_DEPTH = 4;
export declare function formatLabel(L: ReturnType<typeof useLabels>, f: CopyFormat): string;
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
type QuickProps = {
    table: ResolvedTable;
    conditions: FilterCondition[];
    /** Set (or clear with null) the one condition for a column; ids are stable per column. */
    onSet: (column: string, cond: Omit<FilterCondition, "id"> | null) => void;
};
export declare function QuickFilters({ table, conditions, onSet }: QuickProps): React.JSX.Element | null;
export declare function SelectionBar({ count, total, onSelectAll, onCopy, onClear }: {
    count: number;
    total: number;
    onSelectAll: () => void;
    onCopy: (f: CopyFormat) => void;
    onClear: () => void;
}): React.JSX.Element | null;
export declare function GroupByMenu({ columns, value, onChange }: {
    columns: ResolvedColumn[];
    value: string[];
    onChange: (v: string[]) => void;
}): React.JSX.Element;
export declare function MoreMenu({ items }: {
    items: {
        label: string;
        onSelect: () => void;
        id: string;
    }[];
}): React.JSX.Element | null;
export {};
