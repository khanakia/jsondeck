import { useLabels } from "@/lib/labels"
import {
	ArrowDown,
	ArrowUp,
	EyeOff,
	Filter,
	X,
} from "lucide-react"
import { HeaderMenuTrigger } from "../toolbar/triggers"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DataTableColumn, SortRule } from "../types"

type Props<TNode> = {
	column: DataTableColumn<TNode>
	/** Sort fieldIds the table knows about. We only show sort items
	 *  when this column's `meta.sortFieldId` matches one of these. */
	sortFieldIds: Set<string>
	/** Filter fieldIds the table knows about. Same intent as above. */
	filterFieldIds: Set<string>
	/** Whether this column is allowed to be hidden. */
	hideable: boolean
	/** Currently active sort rules — used to highlight the active item. */
	currentSort: SortRule[]
	/** Apply / clear sort. Pass null to clear. */
	onSort: (rule: SortRule | null) => void
	/** Open the filter picker pre-seeded with this filter field id. */
	onFilter: (filterFieldId: string) => void
	/** Hide this column. */
	onHide: () => void
}

/**
 * Chevron-on-header menu. Shows sort / filter / hide based on which
 * capabilities the column has declared via its `meta`.
 *
 * Renders nothing when there's nothing useful to show.
 */
export function ColumnHeaderMenu<TNode>({
	column,
	sortFieldIds,
	filterFieldIds,
	hideable,
	currentSort,
	onSort,
	onFilter,
	onHide,
}: Props<TNode>) {
	const L = useLabels()
	const meta = column.meta ?? {}
	const sortFieldId = meta.sortFieldId
	const filterFieldId = meta.filterFieldId

	const canSort = !!sortFieldId && sortFieldIds.has(sortFieldId)
	const canFilter = !!filterFieldId && filterFieldIds.has(filterFieldId)

	if (!canSort && !canFilter && !hideable) return null

	// Active sort direction for this column (if any) — drives the icon shown.
	const activeSort = sortFieldId
		? currentSort.find((s) => s.fieldId === sortFieldId)
		: undefined
	const sortDir = activeSort?.direction ?? null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<HeaderMenuTrigger sortDir={sortDir} />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="jd:w-44">
				{canSort && sortFieldId && (
					<DropdownMenuGroup>
						<DropdownMenuItem
							onClick={() => onSort({ fieldId: sortFieldId, direction: "asc" })}
							className={cn(sortDir === "asc" && "jd:bg-accent")}
						>
							<ArrowUp className="jd:h-3.5 jd:w-3.5" />
							{L.sortAsc}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onSort({ fieldId: sortFieldId, direction: "desc" })
							}
							className={cn(sortDir === "desc" && "jd:bg-accent")}
						>
							<ArrowDown className="jd:h-3.5 jd:w-3.5" />
							{L.sortDesc}
						</DropdownMenuItem>
						{sortDir && (
							<DropdownMenuItem onClick={() => onSort(null)}>
								<X className="jd:h-3.5 jd:w-3.5" />
								{L.clearSort}
							</DropdownMenuItem>
						)}
					</DropdownMenuGroup>
				)}

				{canSort && (canFilter || hideable) && <DropdownMenuSeparator />}

				{canFilter && filterFieldId && (
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={() => onFilter(filterFieldId)}>
							<Filter className="jd:h-3.5 jd:w-3.5" />
							Filter…
						</DropdownMenuItem>
					</DropdownMenuGroup>
				)}

				{canFilter && hideable && <DropdownMenuSeparator />}

				{hideable && (
					<DropdownMenuGroup>
						<DropdownMenuItem onClick={onHide}>
							<EyeOff className="jd:h-3.5 jd:w-3.5" />
							{L.hideColumn}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
