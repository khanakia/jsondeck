import type { DataTableColumn } from "../types";
type Props<TNode> = {
    /** All columns (in caller-defined order). The menu lists only the
     *  ones whose `meta.hideable` isn't explicitly false. */
    columns: DataTableColumn<TNode>[];
    /** Currently hidden column ids. */
    hiddenColumns: string[];
    /** Toggle a single column's visibility. */
    onToggle: (columnId: string) => void;
    /** Reset to "all visible". */
    onShowAll: () => void;
    /** Columns shown in the expanded row detail; with it, each row gets an "In detail" toggle. */
    detailColumns?: string[] | undefined;
    onToggleDetail?: ((columnId: string) => void) | undefined;
};
/**
 * Toolbar dropdown that lists hideable columns with a checkbox each.
 */
export declare function ColumnVisibilityMenu<TNode>({ columns, hiddenColumns, onToggle, onShowAll, detailColumns, onToggleDetail, }: Props<TNode>): import("react").JSX.Element | null;
export {};
