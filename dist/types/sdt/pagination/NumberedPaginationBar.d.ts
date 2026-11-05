type Props = {
    /** 1-based current page. */
    page: number;
    pageCount: number;
    pageSize: number;
    total: number;
    onPage: (page: number) => void;
};
/**
 * Numbered pagination for in-memory data: "1–50 of N", first/prev, page
 * numbers with "…" gaps, next/last. Replaces the server-paged
 * CursorPaginationBar (cursor paging only knows next/prev); same look.
 */
export declare function NumberedPaginationBar({ page, pageCount, pageSize, total, onPage }: Props): import("react").JSX.Element;
export {};
