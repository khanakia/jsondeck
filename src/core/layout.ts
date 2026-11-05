/**
 * Pages, sections and placed components. Pure: no React.
 *  - resolvePages: config.pages (or the default "one tab per table" layout)
 *    → resolved pages, with each table placement resolved per spot.
 *  - Layout edits (move, resize, add, remove) are pure functions over a
 *    PageConfig, so the edit mode only holds state and calls these.
 */
import { type ComponentBase, type PageConfig, type PageItem, type SectionConfig, TABLE_KEYS, type TableConfig } from "./config"
import { humanize } from "./labels"
import { type ResolvedDeck, type ResolvedTable, resolvePlacement } from "./resolve"
import { closest, type Issue, issue } from "./validate"

export const COMPONENTS = ["table", "chart", "stat", "kv", "markdown", "facets", "toc"] as const
/** Kinds that read no dataset (no `table` key). */
export const TABLELESS: readonly ComponentKind[] = ["markdown", "toc"]
export type ComponentKind = (typeof COMPONENTS)[number]
const SECTION_KEYS = ["title", "description", "collapsible", "collapsed", "columns", "items", "sections", "tabs"]
const PAGE_KEYS = ["id", "title", "group", "filters", "sections"]
/** Default grid when a section sets no columns. */
const DEFAULT_COLUMNS = [1]

export type ResolvedItem = {
	/** Instance id: keys table state, saved views and edit operations. */
	id: string
	kind: ComponentKind
	span: number
	height?: number | undefined
	title?: string | undefined
	/** Dataset name (every kind but markdown). */
	table?: string | undefined
	/** The item as written (charts, stats, kv and facets read their spec from it). */
	spec: PageItem
	/** Table components: the placement resolved (dataset spec → overrides). */
	placement?: ResolvedTable | undefined
}

export type ResolvedSection = {
	/** Path in the page ("0", "0.1"): addresses the section for edits. */
	path: string
	title?: string | undefined
	description?: string | undefined
	collapsible: boolean
	collapsed: boolean
	columns: number[]
	items: ResolvedItem[]
	sections: ResolvedSection[]
	tabs: boolean
	/** Count shown on a tab (the default layout shows row counts). */
	badge?: number | undefined
}

export type ResolvedPage = { id: string; title: string; group?: string | undefined; filters: string[]; sections: ResolvedSection[] }

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v)
const isKind = (v: unknown): v is ComponentKind => typeof v === "string" && (COMPONENTS as readonly string[]).includes(v)
/** Runtime check that a value is shaped like a placed item (an object with a known component). */
function isPageItem(v: unknown): v is PageItem {
	return isObj(v) && isKind(v.component)
}

/** "Server inventory" → "server-inventory" (URL hash id). */
export function slug(s: string): string {
	return (
		s
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "") || "page"
	)
}

/** The layout used when config has no `pages`: one page, one tab per table. */
export function defaultPages(deck: ResolvedDeck): PageConfig[] {
	return [
		{
			id: "tables",
			title: "Tables",
			sections: [{ tabs: true, sections: deck.tables.map((t) => ({ title: t.label, items: [{ component: "table", table: t.name, id: t.name }] })) }],
		},
	]
}

/** Only the table settings of a placed table item (drop component/table/id/span/…). */
function tableOverrides(item: PageItem): Partial<TableConfig> {
	const out: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(item)) if (TABLE_KEYS.includes(k) && k !== "hidden") out[k] = v
	return out
}

function resolveItem(deck: ResolvedDeck, raw: unknown, id: string, path: string, issues: Issue[]): ResolvedItem | null {
	if (!isPageItem(raw)) {
		const c = isObj(raw) ? raw.component : undefined
		issues.push(issue(isObj(raw) ? `${path}.component` : path, typeof c === "string" ? `unknown component "${c}"` : `must be an object with component: ${COMPONENTS.join(" | ")}`, typeof c === "string" ? closest(c, [...COMPONENTS]) : undefined))
		return null
	}
	const spec = raw
	const kind = spec.component
	const base: ComponentBase = spec
	const table = "table" in spec ? spec.table : undefined
	if (!TABLELESS.includes(kind) && (typeof table !== "string" || !(table in deck.datasets))) {
		issues.push(issue(`${path}.table`, `no such table "${String(table)}"`, closest(String(table), Object.keys(deck.datasets))))
		return null
	}
	const item: ResolvedItem = {
		id: typeof base.id === "string" ? base.id : id,
		kind,
		span: typeof base.span === "number" && base.span > 0 ? Math.floor(base.span) : 1,
		height: typeof base.height === "number" && base.height > 0 ? base.height : undefined,
		title: typeof base.title === "string" ? base.title : undefined,
		table,
		spec,
	}
	if (kind === "table" && table) {
		const placement = resolvePlacement(deck, table, tableOverrides(spec), issues, path)
		if (!placement) return null
		item.placement = placement
	}
	if (spec.component === "table" && spec.facets) {
		const cols = deck.tables.find((t) => t.name === table)?.columns.map((c) => c.id) ?? []
		for (const f of spec.facets) if (!cols.includes(f)) issues.push(issue(`${path}.facets`, `no such column "${f}"`, closest(f, cols)))
	}
	if (kind === "facets" && "fields" in spec) {
		const cols = deck.tables.find((t) => t.name === table)?.columns.map((c) => c.id) ?? []
		for (const f of spec.fields) if (!cols.includes(f)) issues.push(issue(`${path}.fields`, `no such column "${f}"`, closest(f, cols)))
	}
	return item
}

function resolveSection(deck: ResolvedDeck, raw: unknown, path: string, cfgPath: string, pageId: string, issues: Issue[]): ResolvedSection | null {
	if (!isObj(raw)) {
		issues.push(issue(cfgPath, "must be an object"))
		return null
	}
	for (const k of Object.keys(raw)) if (!SECTION_KEYS.includes(k)) issues.push(issue(`${cfgPath}.${k}`, "unknown key", closest(k, SECTION_KEYS)))
	const s: SectionConfig = raw
	let columns = DEFAULT_COLUMNS
	if (typeof s.columns === "number" && s.columns > 0) columns = Array.from({ length: Math.floor(s.columns) }, () => 1)
	else if (Array.isArray(s.columns) && s.columns.length > 0 && s.columns.every((n) => typeof n === "number" && n > 0)) columns = s.columns
	else if (s.columns !== undefined) issues.push(issue(`${cfgPath}.columns`, "must be a column count or a list of ratios like [2, 1]"))
	const items = (s.items ?? []).map((it, i) => resolveItem(deck, it, `${pageId}/${path}/${i}`, `${cfgPath}.items[${i}]`, issues)).filter((x): x is ResolvedItem => !!x)
	const sections = (s.sections ?? []).map((c, i) => resolveSection(deck, c, `${path}.${i}`, `${cfgPath}.sections[${i}]`, pageId, issues)).filter((x): x is ResolvedSection => !!x)
	// A tab's badge: the row count when the tab holds exactly one table.
	for (const sec of sections) {
		const only = sec.items.length === 1 && sec.sections.length === 0 ? sec.items[0] : undefined
		if (only?.placement) sec.badge = only.placement.rows.length
	}
	return {
		path,
		title: s.title,
		description: s.description,
		collapsible: s.collapsible === true,
		collapsed: s.collapsed === true,
		columns,
		items,
		sections,
		tabs: s.tabs === true,
	}
}

/** Resolve one page config (also used after a layout edit). */
export function resolvePage(deck: ResolvedDeck, raw: PageConfig, index: number, issues: Issue[]): ResolvedPage {
	const cfgPath = `pages[${index}]`
	for (const k of Object.keys(raw)) if (!PAGE_KEYS.includes(k)) issues.push(issue(`${cfgPath}.${k}`, "unknown key", closest(k, PAGE_KEYS)))
	const id = typeof raw.id === "string" ? raw.id : slug(raw.title ?? `page-${index + 1}`)
	const filters = (raw.filters ?? []).map((f) => {
		const field = f.includes(".") ? f.slice(f.indexOf(".") + 1) : f
		if (!deck.tables.some((t) => t.columns.some((c) => c.id === field))) issues.push(issue(`${cfgPath}.filters`, `no table has a column "${field}"`))
		return field
	})
	return {
		id,
		title: typeof raw.title === "string" ? raw.title : humanize(id, deck.acronyms),
		group: typeof raw.group === "string" && raw.group ? raw.group : undefined,
		filters,
		sections: (raw.sections ?? []).map((s, i) => resolveSection(deck, s, String(i), `${cfgPath}.sections[${i}]`, id, issues)).filter((x): x is ResolvedSection => !!x),
	}
}

export function resolvePages(deck: ResolvedDeck): { pages: ResolvedPage[]; configs: PageConfig[]; issues: Issue[] } {
	const issues: Issue[] = []
	const given = deck.config.pages
	if (given !== undefined && !Array.isArray(given)) issues.push(issue("pages", "must be a list of pages"))
	const configs = Array.isArray(given) && given.length > 0 ? given : defaultPages(deck)
	const pages = configs.map((p, i) => resolvePage(deck, p, i, issues))
	return { pages, configs, issues }
}

// ── Page config helpers (the edits themselves are in layout-edit.ts, loaded with the editor) ──

/** Deep copy of a page config; functions are kept by reference. */
export function clonePage(p: PageConfig): PageConfig {
	const cloneSection = (s: SectionConfig): SectionConfig => ({ ...s, items: (s.items ?? []).map((it) => ({ ...it })), sections: (s.sections ?? []).map(cloneSection) })
	return { ...p, sections: p.sections.map(cloneSection) }
}

/** Every item gets an explicit id, so saved layouts can find them again. */
export function withItemIds(p: PageConfig, pageId: string): PageConfig {
	const out = clonePage(p)
	const walk = (sections: SectionConfig[], prefix: string) =>
		sections.forEach((s, i) => {
			const path = prefix ? `${prefix}.${i}` : String(i)
			s.items = (s.items ?? []).map((it, j) => (it.id ? it : { ...it, id: `${pageId}/${path}/${j}` }))
			walk(s.sections ?? [], path)
		})
	walk(out.sections, "")
	return out
}

/** Plain JSON of a page (functions dropped), for "Copy config" and localStorage. */
export function plainPage(p: PageConfig): unknown {
	return JSON.parse(JSON.stringify(p))
}

/**
 * Re-attach an edited page saved as plain JSON to the original config: items
 * whose id exists in the original keep their functions; the saved order,
 * span, height and membership win.
 */
export function restorePage(original: PageConfig, saved: unknown): PageConfig | null {
	if (!isObj(saved) || !Array.isArray(saved.sections)) return null
	const byId = new Map<string, PageItem>()
	const collect = (sections: SectionConfig[]) =>
		sections.forEach((s) => {
			for (const it of s.items ?? []) if (it.id) byId.set(it.id, it)
			collect(s.sections ?? [])
		})
	collect(original.sections)
	const fix = (s: unknown): SectionConfig => {
		const sec: SectionConfig = isObj(s) ? s : {}
		return {
			...sec,
			items: (sec.items ?? []).map((it) => {
				const orig = it.id ? byId.get(it.id) : undefined
				return orig ? { ...orig, span: it.span, height: it.height } : it
			}),
			sections: (sec.sections ?? []).map(fix),
		}
	}
	return { ...original, sections: saved.sections.map(fix) }
}
