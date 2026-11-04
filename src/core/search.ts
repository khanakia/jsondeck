/**
 * Site search across a deck's pages. Pure (no React): builds a flat index of
 * page titles, section titles, markdown headings and text, and table rows,
 * then ranks entries against a query. The dialog (components/SearchDialog)
 * only renders hits and navigates.
 *
 * Heading anchors use `headingSlugs`, the same function the Markdown renderer
 * uses for heading ids, so a hit always lands on the heading it names.
 */
import type { PageConfig, PageItem, Row, SectionConfig } from "./config"

/** What kind of thing a hit points at. */
export const SEARCH_KINDS = ["page", "heading", "text", "row"] as const
export type SearchKind = (typeof SEARCH_KINDS)[number]

export type SearchEntry = {
	kind: SearchKind
	pageId: string
	pageTitle: string
	/** The line shown in the result list. */
	label: string
	/** Everything matched against (lower-cased once at build time). */
	haystack: string
	/** Body text for text hits (the snippet is cut from it). */
	text?: string | undefined
	/** Heading anchor on the page (`#/page/anchor`). */
	anchor?: string | undefined
	/** Row hits: the dataset and the row (opened in the row drawer). */
	table?: string | undefined
	row?: Row | undefined
}

export type SearchHit = SearchEntry & { score: number; snippet?: string | undefined }

/** Rows indexed per dataset: enough for reference tables, bounded for big dashboards. */
export const MAX_ROWS_PER_TABLE = 2000
/** Results shown at most. */
export const MAX_HITS = 40
/** Characters of context either side of a text match. */
const SNIPPET_RADIUS = 60

const KIND_WEIGHT: Record<SearchKind, number> = { page: 30, heading: 20, row: 10, text: 0 }

/** Lower-case, collapse whitespace. */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim()

/** Markdown inline syntax stripped for display ("**a** `b` [c](d)" → "a b c"). */
export function plainInline(s: string): string {
	return s
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "$1$2")
		.replace(/\*([^*\s][^*]*)\*|_([^_\s][^_]*)_/g, "$1$2")
		.replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
}

/** "Quick filters" → "quick-filters" (heading anchor). */
export function headingSlug(text: string): string {
	return (
		plainInline(text)
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "section"
	)
}

/**
 * Anchors for a list of heading texts in document order: duplicates get
 * "-2", "-3"… Shared with the Markdown renderer so ids and hits agree.
 */
export function headingSlugs(texts: string[]): string[] {
	const seen = new Map<string, number>()
	return texts.map((t) => {
		const base = headingSlug(t)
		const n = (seen.get(base) ?? 0) + 1
		seen.set(base, n)
		return n === 1 ? base : `${base}-${n}`
	})
}

/** Headings of a markdown text, with level (1–6) and anchor; fenced code is skipped. */
export function markdownHeadings(text: string): { level: number; text: string; anchor: string }[] {
	const raw: { level: number; text: string }[] = []
	let fence = false
	for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
		if (/^```/.test(line)) fence = !fence
		if (fence) continue
		const m = /^(#{1,6})\s+(.*)$/.exec(line)
		if (m) raw.push({ level: (m[1] ?? "#").length, text: (m[2] ?? "").trim() })
	}
	const anchors = headingSlugs(raw.map((h) => h.text))
	return raw.map((h, i) => ({ ...h, anchor: anchors[i] ?? headingSlug(h.text) }))
}

/** Every item of a page, depth-first through nested sections. */
function pageItems(sections: SectionConfig[] | undefined): PageItem[] {
	const out: PageItem[] = []
	for (const s of sections ?? []) {
		out.push(...(s.items ?? []))
		out.push(...pageItems(s.sections))
	}
	return out
}

/** Paragraph-ish text blocks of a markdown text, each tagged with the heading above it. */
function markdownBlocks(text: string): { heading?: { text: string; anchor: string } | undefined; body: string }[] {
	const heads = markdownHeadings(text)
	let h = -1
	const out: { heading?: { text: string; anchor: string } | undefined; body: string }[] = []
	let buf: string[] = []
	let fence = false
	const flush = () => {
		const body = plainInline(buf.join(" ")).replace(/\s+/g, " ").trim()
		if (body) out.push({ heading: heads[h], body })
		buf = []
	}
	for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
		if (/^```/.test(line)) {
			flush()
			fence = !fence
			continue
		}
		if (fence) continue
		if (/^#{1,6}\s/.test(line)) {
			flush()
			h++
			continue
		}
		if (line.trim() === "" || /^:::/.test(line.trim())) {
			flush()
			continue
		}
		buf.push(line.replace(/^\s*([-*+]|\d+[.)]|>)\s+/, "").replace(/\|/g, " "))
	}
	flush()
	return out
}

/** Text of a cell for searching (objects and arrays flattened shallowly). */
function cellText(v: unknown): string {
	if (v === null || v === undefined) return ""
	if (typeof v === "string") return v
	if (typeof v === "number" || typeof v === "boolean") return String(v)
	if (Array.isArray(v)) return v.map(cellText).join(" ")
	return ""
}

/**
 * Build the index. `pages` carry their resolved ids; `rows(table)` returns a
 * dataset's rows; `rowLabel(table, row)` names a row (default: its first text
 * values). A dataset is indexed once, under the first page that places it.
 */
export function buildSearchIndex(
	pages: { id: string; config: PageConfig; title: string }[],
	rows: (table: string) => Row[],
	rowLabel?: (table: string, row: Row) => string,
): SearchEntry[] {
	const out: SearchEntry[] = []
	const indexedTables = new Set<string>()
	for (const p of pages) {
		out.push({ kind: "page", pageId: p.id, pageTitle: p.title, label: p.title, haystack: norm(`${p.title} ${p.config.group ?? ""}`) })
		for (const item of pageItems(p.config.sections)) {
			if (item.component === "markdown") {
				// Level-1 headings repeat the page title; the page entry already covers them.
				for (const h of markdownHeadings(item.text).filter((x) => x.level > 1)) {
					const label = plainInline(h.text)
					out.push({ kind: "heading", pageId: p.id, pageTitle: p.title, label, anchor: h.anchor, haystack: norm(label) })
				}
				for (const b of markdownBlocks(item.text)) {
					out.push({
						kind: "text",
						pageId: p.id,
						pageTitle: p.title,
						label: b.heading ? plainInline(b.heading.text) : p.title,
						anchor: b.heading?.anchor,
						text: b.body,
						haystack: norm(b.body),
					})
				}
			} else if (item.component === "table" && !indexedTables.has(item.table)) {
				indexedTables.add(item.table)
				for (const row of rows(item.table).slice(0, MAX_ROWS_PER_TABLE)) {
					const values = Object.values(row).map(cellText).filter(Boolean)
					const label = rowLabel ? rowLabel(item.table, row) : values.slice(0, 2).join(" · ")
					out.push({ kind: "row", pageId: p.id, pageTitle: p.title, label, table: item.table, row, text: values.join(" · "), haystack: norm(values.join(" ")) })
				}
			}
		}
	}
	return out
}

/** A window of `text` around the first match of `term`, with ellipses. */
function snippetOf(text: string, term: string): string {
	const at = text.toLowerCase().indexOf(term)
	if (at < 0) return text.slice(0, SNIPPET_RADIUS * 2)
	const from = Math.max(0, at - SNIPPET_RADIUS)
	const to = Math.min(text.length, at + term.length + SNIPPET_RADIUS)
	return `${from > 0 ? "…" : ""}${text.slice(from, to)}${to < text.length ? "…" : ""}`
}

/**
 * Rank entries: every word of the query must appear. Label matches beat body
 * matches, a label that starts with the query beats one that contains it,
 * pages beat headings beat rows beat text, shorter labels win ties.
 */
export function searchIndex(entries: SearchEntry[], query: string, limit = MAX_HITS): SearchHit[] {
	const q = norm(query)
	if (!q) return []
	const words = q.split(" ")
	const hits: SearchHit[] = []
	for (const e of entries) {
		const label = e.label.toLowerCase()
		if (!words.every((w) => e.haystack.includes(w) || label.includes(w))) continue
		let score = KIND_WEIGHT[e.kind]
		if (label === q) score += 120
		else if (label.startsWith(q)) score += 90
		else if (label.includes(q)) score += 60
		else if (words.every((w) => label.includes(w))) score += 40
		if (e.haystack.includes(q)) score += 15
		score -= Math.min(20, label.length / 10)
		hits.push({ ...e, score, snippet: e.kind === "text" || e.kind === "row" ? snippetOf(e.text ?? "", words[0] ?? q) : undefined })
	}
	hits.sort((a, b) => b.score - a.score)
	return hits.slice(0, limit)
}
