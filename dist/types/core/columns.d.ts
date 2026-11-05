/**
 * Column order and visibility. Pure: no React. Same rules as
 * the table engine: a saved order wins, columns it does not name are
 * appended in their natural order, hidden ids are dropped.
 */
/** Columns sorted by a saved order; ids the order does not know go last. */
export declare function orderColumns<C extends {
    id: string;
}>(columns: C[], order: string[]): C[];
/** Columns minus the hidden ids. */
export declare function visibleColumns<C extends {
    id: string;
}>(columns: C[], hidden: string[]): C[];
/** The rows of one 1-based page, with the page clamped to the last page. */
export declare function pageSlice<R>(rows: R[], page: number, pageSize: number): {
    rows: R[];
    page: number;
    pageCount: number;
};
