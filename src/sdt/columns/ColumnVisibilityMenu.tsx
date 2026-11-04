import { CountBadge, ICON_BTN, LABEL_BTN, Tip, useToolbarLabels } from "../../components/Tip"
import { useLabels } from "@/lib/labels"
import { Check, Columns3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { DataTableColumn } from "../types"

type Props<TNode> = {
	/** All columns (in caller-defined order). The menu lists only the
	 *  ones whose `meta.hideable` isn't explicitly false. */
	columns: DataTableColumn<TNode>[]
	/** Currently hidden column ids. */
	hiddenColumns: string[]
	/** Toggle a single column's visibility. */
	onToggle: (columnId: string) => void
	/** Reset to "all visible". */
	onShowAll: () => void
	/** Columns shown in the expanded row detail; with it, each row gets an "In detail" toggle. */
	detailColumns?: string[] | undefined
	onToggleDetail?: ((columnId: string) => void) | undefined
}

/**
 * Toolbar dropdown that lists hideable columns with a checkbox each.
 */
export function ColumnVisibilityMenu<TNode>({
	columns,
	hiddenColumns,
	onToggle,
	onShowAll,
	detailColumns,
	onToggleDetail,
}: Props<TNode>) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	const hideableCols = columns.filter(
		(c) => c.meta?.hideable !== false && c.id !== "__actions",
	)
	const allVisible = hiddenColumns.length === 0

	if (hideableCols.length === 0) return null

	return (
		<DropdownMenu>
			<Tip label={L.columns} hint="c">
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" aria-label={L.columns} data-jd-columns-trigger="true" className={withLabels ? LABEL_BTN : ICON_BTN}>
						<Columns3 className="jd:h-3.5 jd:w-3.5" />
						{withLabels && L.columns}
						<CountBadge n={hiddenColumns.length} />
					</Button>
				</DropdownMenuTrigger>
			</Tip>
			<DropdownMenuContent align="end" className="jd:min-w-44 jd:p-0.5">
				<DropdownMenuGroup>
					{hideableCols.map((col) => {
						const visible = !hiddenColumns.includes(col.id)
						const label =
							col.meta?.label ??
							(typeof col.header === "string" ? col.header : col.id)
						return (
							<DropdownMenuItem
								key={col.id}
								// Keep menu open so users can toggle multiple columns.
								closeOnClick={false}
								onClick={() => onToggle(col.id)}
								className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
							>
								<Check
									className={cn(
										"jd:h-2.5 jd:w-2.5 jd:shrink-0",
										visible ? "jd:opacity-100" : "jd:opacity-0",
									)}
								/>
								<span className="jd:flex-1 jd:truncate">{label}</span>
								{onToggleDetail && (
									<span
										role="button"
										tabIndex={-1}
										data-jd-detail-toggle={col.id}
										aria-pressed={detailColumns?.includes(col.id) ?? false}
										title={L.inDetail}
										onClick={(e) => {
											// The row itself toggles "In table"; this chip toggles "In detail".
											e.stopPropagation()
											onToggleDetail(col.id)
										}}
										className={cn(
											"jd:inline-flex jd:h-5 jd:items-center jd:rounded jd:border jd:px-1 jd:text-[10px]",
											detailColumns?.includes(col.id) ? "jd:bg-primary jd:text-primary-foreground jd:border-primary" : "jd:text-muted-foreground",
										)}
									>
										{L.details}
									</span>
								)}
							</DropdownMenuItem>
						)
					})}
					{!allVisible && (
						<button
							type="button"
							onClick={onShowAll}
							className="jd:hover:bg-accent jd:text-muted-foreground jd:hover:text-foreground jd:mt-0.5 jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-1.5 jd:rounded-sm jd:border-t jd:px-2 jd:text-left jd:text-xs"
						>
							<span className="jd:w-2.5 jd:shrink-0" />
							{L.showAll}
						</button>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
