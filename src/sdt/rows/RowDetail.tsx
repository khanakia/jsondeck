/**
 * Expanded row, loaded the first time a row is expanded: the detail field
 * grid (+ a custom `detail.render`) and, when asked, nested tables of related
 * rows (each its own ClientDataTable, one level deeper, up to MAX_DEPTH).
 */
import { ChevronRight } from "lucide-react"
import * as React from "react"
import { useLabels } from "@/lib/labels"
import { useNested } from "@/lib/nested"
import { cn } from "@/lib/utils"
import { buildAuto } from "../../auto"
import { renderCell } from "../../components/cells"
import type { Row } from "../../core/config"
import { toText } from "../../core/query"
import type { ResolvedColumn, ResolvedTable } from "../../core/resolve"
import { ClientDataTable } from "../ClientDataTable"
import { MAX_DEPTH } from "./row-shared"

/** Rows per page in a nested related table. */
const NESTED_PAGE_SIZE = 10
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

