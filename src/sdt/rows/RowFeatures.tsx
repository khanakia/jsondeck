/**
 * Row-level features of ClientDataTable, kept out of the main file:
 *  - RowDetail: the inline expanded panel (field grid, custom render, nested related tables)
 *  - QuickFilters: the one-row filter strip (range / chips / toggle / search), two-way with the pills
 *  - SelectionBar, GroupByMenu, MoreMenu: toolbar pieces
 */
import { ChevronRight, Copy, Layers, MoreHorizontal } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLabels } from "@/lib/labels"
import { useNested } from "@/lib/nested"
import { cn } from "@/lib/utils"
import { buildAuto } from "../../auto"
import { renderCell } from "../../components/cells"
import { ICON_BTN, LABEL_BTN, Tip, useToolbarLabels } from "../../components/Tip"
import { COPY_FORMATS, type CopyFormat } from "../../core/clipboard"
import type { Row } from "../../core/config"
import { fill } from "../../core/labels"
import { toText } from "../../core/query"
import type { ResolvedColumn, ResolvedTable } from "../../core/resolve"
import { ClientDataTable } from "../ClientDataTable"
import type { FilterCondition } from "../types"

/** Nesting stops here (a guard against relation cycles). */
export const MAX_DEPTH = 4
/** Rows per page in a nested related table. */
const NESTED_PAGE_SIZE = 10
const FMT_KEY: Record<CopyFormat, "fmt_json" | "fmt_csv" | "fmt_tsv" | "fmt_markdown" | "fmt_text"> = {
	json: "fmt_json",
	csv: "fmt_csv",
	tsv: "fmt_tsv",
	markdown: "fmt_markdown",
	text: "fmt_text",
}
export function formatLabel(L: ReturnType<typeof useLabels>, f: CopyFormat): string {
	return L[FMT_KEY[f]]
}

/** A user renderer's result as a node (text, DOM Node or React element). */
function asNode(out: unknown): React.ReactNode {
	if (out === null || out === undefined || out === false) return null
	if (React.isValidElement(out)) return out
	if (typeof Node !== "undefined" && out instanceof Node) {
		return <span ref={(el) => el?.replaceChildren(out)} />
	}
	return String(out)
}

const GRID_COLS: Record<number, string> = {
	1: "jd:grid-cols-1",
	2: "jd:grid-cols-2",
	3: "jd:grid-cols-3",
	4: "jd:grid-cols-4",
}

/** Expanded row: field grid (+ custom render) and, when asked, nested tables of related rows. */
export function RowDetail({
	row,
	table,
	fields,
	depth,
	parentId,
	onlyRelation,
	className,
}: {
	row: Row
	table: ResolvedTable
	fields: ResolvedColumn[]
	depth: number
	parentId: string
	/** Show only this relation's rows (expand: { relation }) instead of the field grid. */
	onlyRelation?: string | undefined
	/** User class slot `detailPanel`. */
	className?: string | undefined
}) {
	const L = useLabels()
	const nested = useNested()
	const d = table.detail
	const cols = GRID_COLS[d?.columns ?? 3] ?? GRID_COLS[3]
	const groups = nested && (d?.related || onlyRelation) && depth < MAX_DEPTH ? nested.relIndex.lookup(table.name, row).filter((g) => g.rows.length > 0 && (!onlyRelation || g.label === onlyRelation)) : []
	const keyText = table.key ? toText(row[table.key]) : toText(row[table.columns[0]?.id ?? ""])
	return (
		// Indented past the chevron column, on the muted inner surface with a left accent, so it reads as belonging to the row above.
		<div className={cn("jd:my-1 jd:ml-8 jd:mr-2 jd:flex jd:flex-col jd:gap-3 jd:rounded-r-md jd:border-l-2 jd:border-primary/30 jd:bg-muted/50 jd:py-2.5 jd:pl-3 jd:pr-3", className)} data-jd="row-detail" data-jd-depth={depth}>
			{!onlyRelation && fields.length > 0 && (
				<dl className={cn("jd:grid jd:gap-x-4 jd:gap-y-1.5 jd:max-md:grid-cols-1", cols)}>
					{fields.map((c) => (
						<div key={c.id} className="jd:min-w-0" data-jd-detail-field={c.id}>
							<dt className="jd:text-muted-foreground jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">{c.label}</dt>
							<dd className="jd:flex jd:min-w-0 jd:items-center jd:whitespace-normal jd:break-words jd:text-[13px]">{renderCell(row[c.id], row, { ...c, wrap: true }, nested?.renderCtx ?? { types: {}, renderers: {}, formats: {} })}</dd>
						</div>
					))}
				</dl>
			)}
			{d?.render && <div data-jd="detail-render">{asNode(d.render(row, row))}</div>}
			{groups.map((g) => {
				const target = nested?.deck.tables.find((t) => t.name === g.table)
				if (!target || !nested) return null
				// The nested table: the related rows, compact, its own sort/search/expand, one level deeper.
				const sub: ResolvedTable = {
					...target,
					rows: g.rows,
					pageSize: NESTED_PAGE_SIZE,
					views: false,
					quickFilters: [],
					selectable: false,
					expand: target.detail?.related || depth + 1 < MAX_DEPTH - 1 ? "inline" : target.expand,
					detail: { ...(target.detail ?? {}), related: true },
					defaultFilters: [],
				}
				const auto = buildAuto(sub, nested.renderCtx)
				return (
					<div key={`${g.direction}:${g.relation.from}:${g.relation.to}`} className="jd:flex jd:flex-col jd:gap-1" data-jd="nested" data-jd-nested-table={g.table}>
						<div className="jd:flex jd:items-center jd:gap-1 jd:text-[12px]" data-jd="breadcrumb">
							<span className="jd:text-muted-foreground">{table.label}</span>
							<span className="jd:font-medium">{keyText}</span>
							<ChevronRight className="jd:text-muted-foreground jd:h-3 jd:w-3" />
							<span className="jd:font-medium">{g.label}</span>
							<span className="jd:bg-tab-badge jd:inline-flex jd:h-4 jd:min-w-4 jd:items-center jd:justify-center jd:rounded-full jd:px-1 jd:text-[10px] jd:tabular-nums">{g.rows.length}</span>
						</div>
						{/* Its own card with its own header row, so it never lines up with the parent's columns. */}
						<div className="jd:border-card-border jd:bg-card jd:rounded-lg jd:border jd:p-2 jd:shadow-(--jds-card-shadow)">
							<ClientDataTable table={sub} auto={auto} instanceId={`${parentId}>${g.table}:${keyText}`} depth={depth + 1} compact active={false} />
						</div>
					</div>
				)
			})}
			{groups.length === 0 && (d?.related || onlyRelation) && fields.length === 0 && <div className="jd:text-muted-foreground jd:text-[12px]">{L.noRelated}</div>}
		</div>
	)
}

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

export function GroupByMenu({ columns, value, onChange }: { columns: ResolvedColumn[]; value: string[]; onChange: (v: string[]) => void }) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	const candidates = columns.filter((c) => c.type === "enum" || c.type === "boolean" || c.type === "text" || c.type === "mono" || c.type === "date")
	return (
		<DropdownMenu>
			<Tip label={value.length ? `${L.groupBy}: ${value.join(", ")}` : L.groupBy}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" aria-label={L.groupBy} data-jd="group-by" className={withLabels ? LABEL_BTN : ICON_BTN}>
						<Layers className={cn("jd:h-3.5 jd:w-3.5", value.length > 0 && "jd:text-foreground")} />
						{withLabels && L.groupBy}
						{value.length > 0 && <span className="jd:bg-primary jd:absolute jd:right-0.5 jd:top-0.5 jd:h-1.5 jd:w-1.5 jd:rounded-full" />}
					</Button>
				</DropdownMenuTrigger>
			</Tip>
			<DropdownMenuContent align="end" className="jd:min-w-44 jd:p-0.5">
				<DropdownMenuGroup>
					<DropdownMenuItem className="jd:h-7 jd:px-2 jd:text-xs" onClick={() => onChange([])}>
						{L.noGrouping}
					</DropdownMenuItem>
					{candidates.map((c) => {
						const i = value.indexOf(c.id)
						return (
							<DropdownMenuItem
								key={c.id}
								closeOnClick={false}
								data-jd-group-option={c.id}
								className="jd:h-7 jd:gap-1.5 jd:px-2 jd:text-xs"
								onClick={() => onChange(i >= 0 ? value.filter((v) => v !== c.id) : [...value, c.id])}
							>
								<span className="jd:inline-flex jd:w-3.5 jd:justify-center jd:text-[10px] jd:tabular-nums">{i >= 0 ? i + 1 : ""}</span>
								{c.label}
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export function MoreMenu({ items }: { items: { label: string; onSelect: () => void; id: string }[] }) {
	const L = useLabels()
	if (items.length === 0) return null
	return (
		<DropdownMenu>
			<Tip label={L.more}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" aria-label={L.more} data-jd="more-menu" className={ICON_BTN}>
						<MoreHorizontal className="jd:h-3.5 jd:w-3.5" />
					</Button>
				</DropdownMenuTrigger>
			</Tip>
			<DropdownMenuContent align="end" className="jd:min-w-40 jd:p-0.5">
				<DropdownMenuGroup>
					{items.map((it) => (
						<DropdownMenuItem key={it.id} data-jd-more={it.id} className="jd:h-7 jd:px-2 jd:text-xs" onClick={it.onSelect}>
							{it.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
