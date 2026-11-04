/**
 * Config issues and "did you mean" suggestions. Pure.
 */

export type Issue = { path: string; message: string }

export function issue(path: string, message: string, suggestion?: string): Issue {
	return { path, message: suggestion ? `${message} (did you mean ${suggestion}?)` : message }
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
export function closest(word: string, candidates: string[]): string | undefined {
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

/** "tables.findings.columns.sevrity: no such column (did you mean severity?)" */
export function formatIssue(i: Issue): string {
	return i.path ? `${i.path}: ${i.message}` : i.message
}
