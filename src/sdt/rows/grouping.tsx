/**
 * Row grouping for the table, one on-demand chunk: the pure grouping and
 * aggregation (core/group.ts) and the group header row with its counts and
 * aggregates. Loaded the first time a table is grouped.
 */
import { ChevronRight } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { ColumnMetaX } from "../../auto"
import { formatValue } from "../../components/cells"
import type { FormatFn } from "../../core/config"
import type { GroupNode } from "../../core/group"
import type { ResolvedTable } from "../../core/resolve"

export { flattenGroups, groupRows } from "../../core/group"

/** Shown when an aggregate has no named format: up to 2 decimals in the reader's locale. */
const AGG_FORMAT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })

export type GroupRowProps = {
	node: GroupNode
	path: string
	open: boolean
	table: ResolvedTable
	columns: { id: string }[]
	specs: Map<string, ColumnMetaX>
	/** Chevron / checkbox columns before the data columns. */
	specialCols: number
	/** Row height classes for the density. */
	cellClass: string
	rowClass: string | undefined
	alignClass: (id: string) => string | undefined
	formats: Record<string, FormatFn>
	onToggle: (path: string) => void
}

/** A group header: "field: value (count)" with a chevron, then the group's aggregates under their columns. */
export function GroupRow({ node: g, path, open, table, columns, specs, specialCols, cellClass, rowClass, alignClass, formats, onToggle }: GroupRowProps) {
	const col = table.columns.find((c) => c.id === g.field)
	return (
		<TableRow data-jd-group={path} className={cn("jd:bg-muted/50 jd:hover:bg-muted/70 jd:border-b", rowClass)}>
			<TableCell colSpan={specialCols + 1} className={cn("jd:px-2 jd:text-[12px]", cellClass)} style={{ paddingLeft: 8 + g.depth * 16 }}>
				<button type="button" aria-expanded={open} data-jd="group-toggle" onClick={() => onToggle(path)} className="jd:flex jd:cursor-pointer jd:items-center jd:gap-1.5 jd:whitespace-nowrap">
					<ChevronRight className={cn("jd:h-3.5 jd:w-3.5 jd:transition-transform", open && "jd:rotate-90")} />
					<span className="jd:text-muted-foreground">{col?.label ?? g.field}:</span>
					<span className="jd:font-medium">{g.key}</span>
					<span className="jd:bg-tab-badge jd:inline-flex jd:h-4 jd:min-w-4 jd:items-center jd:justify-center jd:rounded-full jd:px-1 jd:text-[10px] jd:tabular-nums" data-jd="group-count">
						{g.count}
					</span>
				</button>
			</TableCell>
			{columns.slice(1).map((c) => {
				const agg = g.aggregates[c.id]
				const spec = specs.get(c.id)?.spec
				return (
					<TableCell key={c.id} className={cn("jd:px-3 jd:text-[12px] jd:font-medium jd:tabular-nums", cellClass, alignClass(c.id))} data-jd-agg={agg === undefined ? undefined : c.id}>
						{agg === undefined || !spec ? null : (formatValue(agg, {}, spec, formats) ?? AGG_FORMAT.format(agg))}
					</TableCell>
				)
			})}
		</TableRow>
	)
}
