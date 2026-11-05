/**
 * Turns the issues resolve recorded (validate.ts) into sentences with a "did
 * you mean" suggestion. Pure. An on-demand chunk: loaded only when a config
 * has issues (mount's `issues` and console warning, the issues box,
 * `describe`), so a valid config never downloads it.
 */
import { QUICK_FILTER_KINDS, TONES } from "./config"
import type { Issue, IssueCode, RawIssue } from "./validate"

/** The sentence for each code; `suggest` adds "(did you mean …?)" from `arg` and `pool`. */
const MESSAGES: Record<IssueCode, { text: (i: RawIssue) => string; suggest?: true }> = {
	key: { text: () => "unknown key", suggest: true },
	object: { text: () => "must be an object" },
	oneOf: { text: (i) => `must be one of ${(i.pool ?? []).join(", ")}`, suggest: true },
	posNum: { text: () => "must be a positive number" },
	sortShape: { text: () => 'must be "column", "-column" or { column, direction }' },
	noColumn: { text: () => "no such column", suggest: true },
	noColumnQ: { text: (i) => `no such column "${i.arg ?? ""}"`, suggest: true },
	noColumnIn: { text: (i) => `no such column "${i.arg ?? ""}" in ${i.extra ?? ""}`, suggest: true },
	noTable: { text: () => "no such table", suggest: true },
	noTableQ: { text: (i) => `no such table "${i.arg ?? ""}"`, suggest: true },
	typeOrObj: { text: () => "must be a type name or an object" },
	unknownType: { text: (i) => `unknown type "${i.arg ?? ""}"`, suggest: true },
	colorsObj: { text: () => "must be an object of value → colour" },
	tone: { text: () => `must be a tone (${TONES.join(", ")}) or a CSS colour` },
	unknownFormat: { text: (i) => `unknown format "${i.arg ?? ""}"`, suggest: true },
	formatShape: { text: () => "must be a format name or a function" },
	sortFn: { text: () => "must be false or a comparator function" },
	idList: { text: () => "must be a list of column ids" },
	searchShape: { text: () => "must be false or { columns: [...] }" },
	list: { text: () => "must be a list" },
	filterShape: { text: () => "must be { column, operator, value }" },
	filterOff: { text: (i) => `column "${i.arg ?? ""}" has filter: false` },
	quickShape: { text: () => `must be { column, kind: ${QUICK_FILTER_KINDS.join(" | ")} }` },
	detector: { text: () => "must be { type, test(values) }" },
	detectorType: { text: (i) => `detector type "${i.arg ?? ""}" is not built in or registered in types (shown as text)` },
	label: { text: () => "unknown label", suggest: true },
	pageSizes: { text: () => "must be a list of positive numbers" },
	relationShape: { text: () => 'must be { from: "table.column", to: "table.column" }' },
	tokensObj: { text: () => "must be an object of token → value" },
	token: { text: () => "unknown theme token", suggest: true },
	cssValue: { text: () => "must be a CSS value (string)" },
	slotsObj: { text: () => "must be an object of slot → class names" },
	slot: { text: () => "unknown class slot", suggest: true },
	component: { text: (i) => `unknown component "${i.arg ?? ""}"`, suggest: true },
	componentShape: { text: (i) => `must be an object with component: ${(i.pool ?? []).join(" | ")}` },
	gridColumns: { text: () => "must be a column count or a list of ratios like [2, 1]" },
	noTableHasColumn: { text: (i) => `no table has a column "${i.arg ?? ""}"` },
	pagesList: { text: () => "must be a list of pages" },
}

/** Edit distance (Levenshtein), small strings only. */
function distance(a: string, b: string): number {
	const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
	for (let i = 1; i <= a.length; i++) {
		let prev = dp[0] ?? 0
		dp[0] = i
		for (let j = 1; j <= b.length; j++) {
			const tmp = dp[j] ?? 0
			dp[j] = Math.min(tmp + 1, (dp[j - 1] ?? 0) + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
			prev = tmp
		}
	}
	return dp[b.length] ?? 0
}

/** The closest candidate within a third of the word's length (at least 2 edits), case-insensitive. */
export function closest(word: string, candidates: readonly string[]): string | undefined {
	const w = word.toLowerCase()
	let best: string | undefined
	let bestD = Math.max(2, Math.floor(w.length / 3)) + 1
	for (const c of candidates) {
		const d = distance(w, c.toLowerCase())
		if (d < bestD) {
			best = c
			bestD = d
		}
	}
	return best
}

/** One recorded issue as { path, message }, with "(did you mean …?)" when a close name exists. */
export function explainIssue(i: RawIssue): Issue {
	const m = MESSAGES[i.code]
	const message = m.text(i)
	const suggestion = m.suggest && i.arg !== undefined && i.pool ? closest(i.arg, i.pool) : undefined
	return { path: i.path, message: suggestion ? `${message} (did you mean ${suggestion}?)` : message }
}

/** "tables.findings.columns.sevrity: no such column (did you mean severity?)" */
export function formatIssue(i: Issue): string {
	return i.path ? `${i.path}: ${i.message}` : i.message
}

/** Recorded issues as the lines mount returns and logs. */
export function issueLines(list: readonly RawIssue[]): string[] {
	return list.map((i) => formatIssue(explainIssue(i)))
}
