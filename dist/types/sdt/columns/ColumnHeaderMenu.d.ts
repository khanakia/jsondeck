import type { DataTableColumn, SortRule } from "../types";
type Props<TNode> = {
    column: DataTableColumn<TNode>;
    /** Sort fieldIds the table knows about. We only show sort items
     *  when this column's `meta.sortFieldId` matches one of these. */
    sortFieldIds: Set<string>;
    /** Filter fieldIds the table knows about. Same intent as above. */
    filterFieldIds: Set<string>;
    /** Whether this column is allowed to be hidden. */
    hideable: boolean;
    /** Currently active sort rules — used to highlight the active item. */
    currentSort: SortRule[];
    /** Apply / clear sort. Pass null to clear. */
    onSort: (rule: SortRule | null) => void;
    /** Open the filter picker pre-seeded with this filter field id. */
    onFilter: (filterFieldId: string) => void;
    /** Hide this column. */
    onHide: () => void;
};
/**
 * Chevron-on-header menu. Shows sort / filter / hide based on which
 * capabilities the column has declared via its `meta`.
 *
 * Renders nothing when there's nothing useful to show.
 */
export declare function ColumnHeaderMenu<TNode>({ column, sortFieldIds, filterFieldIds, hideable, currentSort, onSort, onFilter, onHide, }: Props<TNode>): import("react").JSX.Element | null;
export {};
