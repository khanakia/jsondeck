/**
 * Config issues and "did you mean" suggestions. Pure.
 */
export type Issue = {
    path: string;
    message: string;
};
export declare function issue(path: string, message: string, suggestion?: string): Issue;
/** The closest candidate within a third of the word's length (at least 2 edits), case-insensitive. */
export declare function closest(word: string, candidates: string[]): string | undefined;
/** "tables.findings.columns.sevrity: no such column (did you mean severity?)" */
export declare function formatIssue(i: Issue): string;
