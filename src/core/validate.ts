/**
 * Config issues, the part the first download carries. Pure.
 *
 * Resolving a config still finds every problem (a bad key or value is skipped
 * so the rest renders), but it only records *what* is wrong: a short code plus
 * the offending word and the names it could have meant. The sentences and the
 * "did you mean" search live in explain.ts, an on-demand chunk loaded only
 * when a config has issues, so a valid config never downloads them.
 *
 * Public form: `Issue` ({ path, message }), produced by `explainIssue`.
 */

/** "tables.findings.columns.sevrity: no such column (did you mean severity?)" */
export type Issue = { path: string; message: string }

/**
 * Every kind of problem resolve.ts and layout.ts report. The sentence for each
 * is in explain.ts (MESSAGES); a code missing there is a type error.
 */
export type IssueCode =
	| "key"
	| "object"
	| "oneOf"
	| "posNum"
	| "sortShape"
	| "noColumn"
	| "noColumnQ"
	| "noColumnIn"
	| "noTable"
	| "noTableQ"
	| "typeOrObj"
	| "unknownType"
	| "colorsObj"
	| "tone"
	| "unknownFormat"
	| "formatShape"
	| "sortFn"
	| "idList"
	| "searchShape"
	| "list"
	| "filterShape"
	| "filterOff"
	| "quickShape"
	| "detector"
	| "detectorType"
	| "label"
	| "pageSizes"
	| "relationShape"
	| "tokensObj"
	| "token"
	| "cssValue"
	| "slotsObj"
	| "slot"
	| "component"
	| "componentShape"
	| "gridColumns"
	| "noTableHasColumn"
	| "pagesList"

/**
 * One problem as resolve records it. `arg` is the offending word (shown in the
 * sentence and matched against `pool` for "did you mean"); `pool` is also the
 * list some sentences print ("must be one of …"); `extra` is a second word
 * (the table in "no such column "x" in hosts").
 */
export type RawIssue = { path: string; code: IssueCode; arg?: string | undefined; pool?: readonly string[] | undefined; extra?: string | undefined }

export function issue(path: string, code: IssueCode, arg?: string, pool?: readonly string[], extra?: string): RawIssue {
	return { path, code, arg, pool, extra }
}

/** Same problem at the same place (pool aside: two runs build equal lists). */
export function sameIssue(a: RawIssue, b: RawIssue): boolean {
	return a.path === b.path && a.code === b.code && a.arg === b.arg && a.extra === b.extra
}
