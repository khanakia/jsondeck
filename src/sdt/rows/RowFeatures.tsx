/**
 * Row-level features of ClientDataTable, kept out of the main file:
 *  - RowDetail is in RowDetail.tsx (an on-demand chunk, loaded when a row is first expanded)
 *  - QuickFilters: the one-row filter strip (range / chips / toggle / search), two-way with the pills
 *  - SelectionBar (the group-by and "more" menus are in ToolbarMenus.tsx, an on-demand chunk)
 */
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { COPY_FORMATS, type CopyFormat } from "../../core/copy"
import type { Row } from "../../core/config"
import { fill } from "../../core/labels"
import type { ResolvedTable } from "../../core/resolve"
import type { FilterCondition } from "../types"

import { formatLabel } from "./row-shared"

// ── Quick filters ───────────────────────────────────────────────────────

type QuickProps = {
	table: ResolvedTable
	conditions: FilterCondition[]
	/** Set (or clear with null) the one condition for a column; ids are stable per column. */
	onSet: (column: string, cond: Omit<FilterCondition, "id"> | null) => void
}

const CHIP = "jd:inline-flex jd:h-6 jd:cursor-pointer jd:items-center jd:rounded-md jd:border jd:px-2 jd:text-[12px] jd:transition-colors jd:whitespace-nowrap"

function bounds(rows: Row[], col: string): [number, number] | null {
	let lo = Number.POSITIVE_INFINITY
	let hi = Number.NEGATIVE_INFINITY
	for (const r of rows) {
		const n = Number(r[col])
		if (r[col] === null || r[col] === undefined || r[col] === "" || Number.isNaN(n)) continue
		lo = Math.min(lo, n)
		hi = Math.max(hi, n)
	}
	return Number.isFinite(lo) && Number.isFinite(hi) ? [lo, hi] : null
}

export function QuickFilters({ table, conditions, onSet }: QuickProps) {
	const L = useLabels()
	if (table.quickFilters.length === 0) return null
	return (
		<div className="jd:flex jd:flex-wrap jd:items-center jd:gap-x-4 jd:gap-y-1.5" data-jd="quick-filters" role="group" aria-label={L.quickFilters}>
			{table.quickFilters.map((q) => {
				const col = table.columns.find((c) => c.id === q.column)
				if (!col) return null
				const cond = conditions.find((c) => c.fieldId === q.column)
				const label = q.label ?? col.label
				if (q.kind === "chips") {
					const chosen = cond && Array.isArray(cond.value) ? cond.value.map(String) : []
					return (
						<div key={q.column} className="jd:flex jd:flex-wrap jd:items-center jd:gap-1" data-jd-quick={q.column}>
							<span className="jd:text-muted-foreground jd:mr-0.5 jd:text-[12px]">{label}</span>
							{(col.values ?? []).map((v) => {
								const on = chosen.includes(v)
								return (
									<button
										key={v}
										type="button"
										aria-pressed={on}
										data-jd-chip={`${q.column}=${v}`}
										onClick={() => {
											const next = on ? chosen.filter((x) => x !== v) : [...chosen, v]
											onSet(q.column, next.length ? { fieldId: q.column, operator: "in", value: next } : null)
										}}
										className={cn(CHIP, on ? "jd:bg-primary jd:text-primary-foreground jd:border-primary" : "jd:bg-card jd:text-muted-foreground jd:hover:text-foreground jd:border-border")}
									>
										{v}
									</button>
								)
							})}
						</div>
					)
				}
				if (q.kind === "toggle") {
					const on = cond?.operator === "is" && cond.value === true
					return (
						<button
							key={q.column}
							type="button"
							aria-pressed={on}
							data-jd-quick={q.column}
							onClick={() => onSet(q.column, on ? null : { fieldId: q.column, operator: "is", value: true })}
							className={cn(CHIP, on ? "jd:bg-primary jd:text-primary-foreground jd:border-primary" : "jd:bg-card jd:text-muted-foreground jd:hover:text-foreground jd:border-border")}
						>
							{label}
						</button>
					)
				}
				if (q.kind === "search") {
					const v = cond && typeof cond.value === "string" ? cond.value : ""
					return (
						<label key={q.column} className="jd:flex jd:items-center jd:gap-1.5 jd:text-[12px]" data-jd-quick={q.column}>
							<span className="jd:text-muted-foreground">{label}</span>
							<input
								value={v}
								onChange={(e) => onSet(q.column, e.target.value ? { fieldId: q.column, operator: "contains", value: e.target.value } : null)}
								className="jd:h-6 jd:w-36 jd:rounded-md jd:border jd:border-input jd:bg-background jd:px-1.5 jd:text-[12px] jd:outline-none jd:focus-visible:ring-2 jd:focus-visible:ring-ring"
							/>
						</label>
					)
				}
				// range
				const b = bounds(table.rows, q.column)
				const cur = cond?.operator === "between" && Array.isArray(cond.value) ? cond.value : ["", ""]
				const lo = cur[0] === "" || cur[0] == null ? "" : Number(cur[0])
				const hi = cur[1] === "" || cur[1] == null ? "" : Number(cur[1])
				const set = (nlo: number | "", nhi: number | "") =>
					onSet(q.column, nlo === "" && nhi === "" ? null : { fieldId: q.column, operator: "between", value: [nlo, nhi] })
				const num = (s: string): number | "" => (s === "" ? "" : Number(s))
				const input = "jd:h-6 jd:w-20 jd:rounded-md jd:border jd:border-input jd:bg-background jd:px-1.5 jd:text-[12px] jd:tabular-nums jd:outline-none jd:focus-visible:ring-2 jd:focus-visible:ring-ring"
				return (
					<div key={q.column} className="jd:flex jd:items-center jd:gap-1.5 jd:text-[12px]" data-jd-quick={q.column}>
						<span className="jd:text-muted-foreground">{label}</span>
						<input type="number" aria-label={`${label} ${L.min}`} placeholder={b ? String(b[0]) : L.min} value={lo} onChange={(e) => set(num(e.target.value), hi)} className={input} data-jd-range="min" />
						{b && (
							<input
								type="range"
								aria-label={`${label} ${L.min}`}
								min={b[0]}
								max={b[1]}
								step="any"
								value={lo === "" ? b[0] : lo}
								onChange={(e) => set(Number(e.target.value), hi)}
								className="jd:w-20 jd:accent-[var(--jds-primary)]"
							/>
						)}
						<span className="jd:text-muted-foreground">–</span>
						<input type="number" aria-label={`${label} ${L.max}`} placeholder={b ? String(b[1]) : L.max} value={hi} onChange={(e) => set(lo, num(e.target.value))} className={input} data-jd-range="max" />
					</div>
				)
			})}
		</div>
	)
}

// ── Toolbar pieces ──────────────────────────────────────────────────────

export function SelectionBar({ count, total, onSelectAll, onCopy, onClear }: { count: number; total: number; onSelectAll: () => void; onCopy: (f: CopyFormat) => void; onClear: () => void }) {
	const L = useLabels()
	if (count === 0) return null
	return (
		<div className="jd:border-card-border jd:bg-muted/50 jd:flex jd:items-center jd:gap-2 jd:rounded-md jd:border jd:px-2 jd:py-1 jd:text-[12px]" data-jd="selection-bar">
			<span className="jd:font-medium jd:tabular-nums">{fill(L.selected, { n: count })}</span>
			{count < total && (
				<Button variant="ghost" size="xs" onClick={onSelectAll} data-jd="select-all-matches">
					{fill(L.selectAllMatches, { n: total })}
				</Button>
			)}
			<span className="jd:text-border">·</span>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="xs" data-jd="copy-selected">
						<Copy className="jd:h-3 jd:w-3" />
						{L.copyAs}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="jd:min-w-40 jd:p-0.5">
					<DropdownMenuGroup>
						{COPY_FORMATS.map((f) => (
							<DropdownMenuItem key={f} className="jd:h-7 jd:px-2 jd:text-xs" onClick={() => onCopy(f)}>
								{formatLabel(L, f)}
							</DropdownMenuItem>
						))}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<Button variant="ghost" size="xs" onClick={onClear} data-jd="clear-selection">
				{L.clearSelection}
			</Button>
		</div>
	)
}
