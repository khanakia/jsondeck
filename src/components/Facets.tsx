/**
 * The facets component (count per value, click to filter), an on-demand chunk
 * loaded when a page shows one (a `facets` item or a table's `facets` sidebar).
 */
import type { ResolvedItem } from "../core/layout"
import { toText } from "../core/query"
import { type PageCtx, pageRows } from "./Items"

/** Count per value for each field; clicking a value filters the target tables. */
export function Facets({ item, ctx, fields }: { item: ResolvedItem; ctx: PageCtx; fields: string[] }) {
	const rows = pageRows(ctx, item.table ?? "")
	const table = ctx.deck.tables.find((t) => t.name === item.table)
	const max = 12
	return (
		<div className="jd:flex jd:flex-col jd:gap-3" data-jd="facets">
			{fields.map((f) => {
				const counts = new Map<string, number>()
				for (const r of rows) {
					const v = toText(r[f]) || "(empty)"
					counts.set(v, (counts.get(v) ?? 0) + 1)
				}
				const list = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max)
				const top = list[0]?.[1] ?? 1
				const label = table?.columns.find((c) => c.id === f)?.label ?? f
				return (
					<div key={f}>
						<div className="jd:text-muted-foreground jd:mb-1 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">{label}</div>
						<div className="jd:flex jd:flex-col">
							{list.map(([v, n]) => (
								<button
									key={v}
									type="button"
									data-jd-facet={`${f}=${v}`}
									onClick={() => ctx.select(item, f, v)}
									className="jd:hover:bg-muted jd:relative jd:flex jd:h-6 jd:cursor-pointer jd:items-center jd:justify-between jd:gap-2 jd:rounded jd:px-1.5 jd:text-left jd:text-[12px]"
								>
									<span className="jd:bg-primary/10 jd:absolute jd:inset-y-0.5 jd:left-0 jd:rounded" style={{ width: `${(n / top) * 100}%` }} />
									<span className="jd:relative jd:truncate">{v}</span>
									<span className="jd:text-muted-foreground jd:relative jd:tabular-nums">{n}</span>
								</button>
							))}
						</div>
					</div>
				)
			})}
		</div>
	)
}

