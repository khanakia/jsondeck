/**
 * The page filter bar (`filters` on a page): one select per field, applied to
 * every component on the page that has the field. An on-demand chunk, loaded
 * before the first render of a deck with page filters
 * (components/first-paint.ts).
 */
import * as React from "react"
import { useLabels } from "@/lib/labels"
import type { ResolvedPage } from "../core/layout"
import { toText } from "../core/query"
import { PageContext } from "./Items"

/** Page filter bar: one select per field; applies to every component that has the field. */
export function PageFilterBar({ page, values, onChange }: { page: ResolvedPage; values: Record<string, string>; onChange: (field: string, value: string | undefined) => void }) {
	const ctx = React.useContext(PageContext)
	const L = useLabels()
	if (!ctx || page.filters.length === 0) return null
	return (
		<div className="jd:flex jd:flex-wrap jd:items-center jd:gap-2" data-jd="page-filters">
			{page.filters.map((f) => {
				const seen = new Set<string>()
				let label = f
				for (const t of ctx.deck.tables) {
					const col = t.columns.find((c) => c.id === f)
					if (!col) continue
					label = col.label
					for (const r of t.rows) {
						const v = toText(r[f])
						if (v) seen.add(v)
					}
				}
				const opts = [...seen].sort()
				return (
					<label key={f} className="jd:flex jd:items-center jd:gap-1 jd:text-[12px]">
						<span className="jd:text-muted-foreground">{label}</span>
						<select
							data-jd-page-filter={f}
							value={values[f] ?? ""}
							onChange={(e) => onChange(f, e.target.value || undefined)}
							className="jd:h-7 jd:rounded jd:border jd:border-input jd:bg-background jd:px-1.5 jd:text-[12px]"
						>
							<option value="">{L.allValues}</option>
							{opts.map((o) => (
								<option key={o} value={o}>
									{o}
								</option>
							))}
						</select>
					</label>
				)
			})}
		</div>
	)
}

