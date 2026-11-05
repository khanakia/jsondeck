/**
 * `describe`'s output: the resolved config as plain JSON. Pure. Part of the
 * extras chunk (src/extras.ts), not the core: mounting never needs it.
 */
import type { ResolvedDeck } from "./resolve"

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v)

/** Drop functions and undefined, recursively, so a resolved value is plain JSON. */
function plain(v: unknown): unknown {
	if (typeof v === "function" || v === undefined) return undefined
	if (Array.isArray(v)) return v.map(plain).filter((x) => x !== undefined)
	if (isObj(v)) {
		const out: Record<string, unknown> = {}
		for (const [k, x] of Object.entries(v)) {
			const p = plain(x)
			if (p !== undefined) out[k] = p
		}
		return out
	}
	return v
}

/**
 * The resolved config as plain JSON in the same shape as the input config
 * (functions left out), so it can be copied, edited and passed back.
 */
export function describeDeck(d: ResolvedDeck): Record<string, unknown> {
	const tables: Record<string, unknown> = {}
	for (const t of d.tables) {
		const columns: Record<string, unknown> = {}
		for (const c of t.columns) {
			columns[c.id] = plain({
				type: c.type,
				label: c.label,
				hidden: c.hidden || undefined,
				width: c.width,
				minWidth: c.minWidth,
				pin: c.pin,
				align: c.align,
				wrap: c.wrap || undefined,
				className: c.className,
				tooltip: typeof c.tooltip === "boolean" ? c.tooltip : undefined,
				format: typeof c.format === "string" ? c.format : undefined,
				link: typeof c.link === "string" ? c.link : undefined,
				order: c.order,
				colors: c.colors,
				filter: c.filter === false ? false : { type: c.filter.type, options: c.filter.options?.map((o) => o.value), operators: c.filter.operators },
				sort: c.sort === false ? false : undefined,
				search: c.search ? undefined : false,
				computed: c.computed || undefined,
			})
		}
		tables[t.name] = plain({
			label: t.label,
			key: t.key,
			columnOrder: t.columns.map((c) => c.id),
			pageSize: t.pageSize,
			search: t.search,
			filters: t.filters ? undefined : false,
			views: t.views === false ? false : undefined,
			defaultSort: t.defaultSort.map((s) => (s.direction === "desc" ? `-${s.fieldId}` : s.fieldId)),
			defaultFilters: t.defaultFilters.map((f) => ({ column: f.fieldId, operator: f.operator, value: f.value })),
			columns,
		})
	}
	return plain({
		theme: d.theme,
		tableOrder: d.tables.map((t) => t.name),
		pageSizes: d.pageSizes,
		acronyms: d.acronyms,
		guess: d.guess,
		formats: Object.keys(d.formats),
		types: Object.keys(d.types),
		labels: d.labels,
		tables,
	}) as Record<string, unknown>
}

