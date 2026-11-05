import type { Issue, RawIssue } from "./validate";
/** The closest candidate within a third of the word's length (at least 2 edits), case-insensitive. */
export declare function closest(word: string, candidates: readonly string[]): string | undefined;
/** One recorded issue as { path, message }, with "(did you mean …?)" when a close name exists. */
export declare function explainIssue(i: RawIssue): Issue;
/** "tables.findings.columns.sevrity: no such column (did you mean severity?)" */
export declare function formatIssue(i: Issue): string;
/** Recorded issues as the lines mount returns and logs. */
export declare function issueLines(list: readonly RawIssue[]): string[];
