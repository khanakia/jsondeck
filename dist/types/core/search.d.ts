/**
 * Site search across a deck's pages. Pure (no React): builds a flat index of
 * page titles, section titles, markdown headings and text, and table rows,
 * then ranks entries against a query. The dialog (components/SearchDialog)
 * only renders hits and navigates.
 *
 * Heading anchors use `headingSlugs`, the same function the Markdown renderer
 * uses for heading ids, so a hit always lands on the heading it names.
 */
import type { PageConfig, Row } from "./config";
/** What kind of thing a hit points at. */
export declare const SEARCH_KINDS: readonly ["page", "heading", "text", "row"];
export type SearchKind = (typeof SEARCH_KINDS)[number];
export type SearchEntry = {
    kind: SearchKind;
    pageId: string;
    pageTitle: string;
    /** The line shown in the result list. */
    label: string;
    /** Everything matched against (lower-cased once at build time). */
    haystack: string;
    /** Body text for text hits (the snippet is cut from it). */
    text?: string | undefined;
    /** Heading anchor on the page (`#/page/anchor`). */
    anchor?: string | undefined;
    /** Row hits: the dataset and the row (opened in the row drawer). */
    table?: string | undefined;
    row?: Row | undefined;
};
export type SearchHit = SearchEntry & {
    score: number;
    snippet?: string | undefined;
};
/** Rows indexed per dataset: enough for reference tables, bounded for big dashboards. */
export declare const MAX_ROWS_PER_TABLE = 2000;
/** Results shown at most. */
export declare const MAX_HITS = 40;
/** Markdown inline syntax stripped for display ("**a** `b` [c](d)" → "a b c"). */
export declare function plainInline(s: string): string;
/** "Quick filters" → "quick-filters" (heading anchor). */
export declare function headingSlug(text: string): string;
/**
 * Anchors for a list of heading texts in document order: duplicates get
 * "-2", "-3"… Shared with the Markdown renderer so ids and hits agree.
 */
export declare function headingSlugs(texts: string[]): string[];
/** Headings of a markdown text, with level (1–6) and anchor; fenced code is skipped. */
export declare function markdownHeadings(text: string): {
    level: number;
    text: string;
    anchor: string;
}[];
/**
 * Build the index. `pages` carry their resolved ids; `rows(table)` returns a
 * dataset's rows; `rowLabel(table, row)` names a row (default: its first text
 * values). A dataset is indexed once, under the first page that places it.
 */
export declare function buildSearchIndex(pages: {
    id: string;
    config: PageConfig;
    title: string;
}[], rows: (table: string) => Row[], rowLabel?: (table: string, row: Row) => string): SearchEntry[];
/**
 * Rank entries: every word of the query must appear. Label matches beat body
 * matches, a label that starts with the query beats one that contains it,
 * pages beat headings beat rows beat text, shorter labels win ties.
 */
export declare function searchIndex(entries: SearchEntry[], query: string, limit?: number): SearchHit[];
