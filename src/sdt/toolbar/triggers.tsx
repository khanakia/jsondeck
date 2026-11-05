/**
 * The trigger buttons of the table's popup controls (filter, sort, columns,
 * views, group by, more, export, column header menu, rows per page), shared by
 * two places so they always look the same:
 *  - the real controls (an on-demand chunk, see src/popups.ts), which wrap
 *    them in a Base UI trigger;
 *  - their stand-ins in the core (toolbar/controls.tsx), shown until that
 *    chunk has loaded.
 * Every extra prop goes to the <button>, so a Base UI trigger can add its ref,
 * handlers and aria attributes. The tooltip text helpers live here for the
 * same reason.
 */
import { ArrowDown, ArrowDownUp, ArrowUp, Bookmark, ChevronDown, Columns3, Download, Layers, ListFilter, Loader2, MoreHorizontal } from "lucide-react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { fill, type Labels } from "../../core/labels"
import { CountBadge, ICON_BTN, LABEL_BTN, useToolbarLabels } from "../../components/Tip"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { SortDirection, SortOption, SortRule } from "../types"

/** What a Base UI trigger (or the stand-in wrapper) may add to the button. */
type ButtonRest = Omit<React.ComponentProps<"button">, "children" | "value">

export function FilterTrigger({ activeCount, ...rest }: { activeCount: number } & ButtonRest) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	return (
		<Button variant="ghost" size="sm" aria-label={L.filter} className={withLabels ? LABEL_BTN : ICON_BTN} {...rest}>
			<ListFilter className="jd:h-3.5 jd:w-3.5" />
			{withLabels && L.filter}
			<CountBadge n={activeCount} />
		</Button>
	)
}

function primarySort(options: SortOption[], value: SortRule[]): { label: string; direction: SortDirection } | null {
	const primary = value[0]
	if (!primary) return null
	return { label: options.find((o) => o.fieldId === primary.fieldId)?.label ?? primary.fieldId, direction: primary.direction }
}

/** Sort tooltip: "Sort" or "Sort: Name ↑". */
export function sortTip(L: Labels, options: SortOption[], value: SortRule[]): string {
	const p = primarySort(options, value)
	return p ? `${L.sort}: ${p.label} ${p.direction === "asc" ? "↑" : "↓"}` : L.sort
}

export function SortTrigger({ options, value, ...rest }: { options: SortOption[]; value: SortRule[] } & ButtonRest) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	const p = primarySort(options, value)
	const Icon = p ? (p.direction === "asc" ? ArrowUp : ArrowDown) : ArrowDownUp
	return (
		<Button variant="ghost" size="sm" aria-label={L.sort} data-jd-sort-trigger="true" className={withLabels ? LABEL_BTN : ICON_BTN} {...rest}>
			<Icon className="jd:h-3.5 jd:w-3.5" />
			{withLabels && (p ? `${p.label} ${p.direction === "asc" ? "↑" : "↓"}` : L.sort)}
			<CountBadge n={value.length} />
		</Button>
	)
}

export function ColumnsTrigger({ hiddenCount, ...rest }: { hiddenCount: number } & ButtonRest) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	return (
		<Button variant="ghost" size="sm" aria-label={L.columns} data-jd-columns-trigger="true" className={withLabels ? LABEL_BTN : ICON_BTN} {...rest}>
			<Columns3 className="jd:h-3.5 jd:w-3.5" />
			{withLabels && L.columns}
			<CountBadge n={hiddenCount} />
		</Button>
	)
}

/** Views tooltip: "Views" or "Views: <active view>". */
export function viewsTip(L: Labels, activeName: string | undefined): string {
	return activeName ? `${L.views}: ${activeName}` : L.views
}

export function ViewsTrigger({ activeName, modified, ...rest }: { activeName: string | undefined; modified: boolean } & ButtonRest) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	const showName = activeName !== undefined || withLabels
	return (
		<Button variant="ghost" size="sm" aria-label={L.views} data-jd-views-trigger="true" className={showName ? LABEL_BTN : ICON_BTN} {...rest}>
			<Bookmark className="jd:h-3.5 jd:w-3.5" />
			{/* The view name shows only when a view is active (or labels are on). */}
			{showName && <span className="jd:max-w-[10rem] jd:truncate">{activeName ?? L.viewsAll}</span>}
			{modified && <span className="jd:bg-primary jd:absolute jd:right-0.5 jd:top-0.5 jd:h-1.5 jd:w-1.5 jd:rounded-full" title={L.unsavedChanges} />}
		</Button>
	)
}

/** Group-by tooltip: "Group by" or "Group by: a, b". */
export function groupTip(L: Labels, value: string[]): string {
	return value.length ? `${L.groupBy}: ${value.join(", ")}` : L.groupBy
}

export function GroupTrigger({ value, ...rest }: { value: string[] } & ButtonRest) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	return (
		<Button variant="ghost" size="sm" aria-label={L.groupBy} data-jd="group-by" className={withLabels ? LABEL_BTN : ICON_BTN} {...rest}>
			<Layers className={cn("jd:h-3.5 jd:w-3.5", value.length > 0 && "jd:text-foreground")} />
			{withLabels && L.groupBy}
			{value.length > 0 && <span className="jd:bg-primary jd:absolute jd:right-0.5 jd:top-0.5 jd:h-1.5 jd:w-1.5 jd:rounded-full" />}
		</Button>
	)
}

export function MoreTrigger(rest: ButtonRest) {
	const L = useLabels()
	return (
		<Button variant="ghost" size="sm" aria-label={L.more} data-jd="more-menu" className={ICON_BTN} {...rest}>
			<MoreHorizontal className="jd:h-3.5 jd:w-3.5" />
		</Button>
	)
}

export function ExportTrigger({ label, hideIcon, loading, ...rest }: { label: string; hideIcon?: boolean | undefined; loading?: boolean | undefined } & ButtonRest) {
	const withLabels = useToolbarLabels()
	return (
		<Button variant="ghost" size="sm" aria-label={label} className={withLabels ? LABEL_BTN : ICON_BTN} {...rest}>
			{!hideIcon && (loading ? <Loader2 className="jd:h-3.5 jd:w-3.5 jd:animate-spin" /> : <Download className="jd:h-3.5 jd:w-3.5" />)}
			{withLabels && label}
		</Button>
	)
}

/** The small chevron in a column header; shows the column's sort direction when sorted. */
export function HeaderMenuTrigger({ sortDir, onClick, ...rest }: { sortDir: SortDirection | null } & ButtonRest) {
	return (
		<Button
			variant="ghost"
			size="icon"
			className={cn(
				"jd:text-muted-foreground jd:hover:text-foreground jd:-mr-1 jd:h-5 jd:w-5 jd:shrink-0 jd:opacity-0 jd:transition-opacity",
				"jd:group-hover/header:opacity-100 jd:data-[state=open]:opacity-100",
				sortDir && "jd:text-foreground jd:opacity-100",
			)}
			aria-label="Column menu"
			{...rest}
			// The header cell sorts on click; the menu button must not.
			onClick={(e) => {
				e.stopPropagation()
				onClick?.(e)
			}}
		>
			{sortDir === "asc" ? <ArrowUp className="jd:h-2.5 jd:w-2.5" /> : sortDir === "desc" ? <ArrowDown className="jd:h-2.5 jd:w-2.5" /> : <ChevronDown className="jd:h-2.5 jd:w-2.5" />}
		</Button>
	)
}

export function PageSizeTrigger({ value, ...rest }: { value: number } & ButtonRest) {
	const L = useLabels()
	return (
		<Button variant="ghost" size="sm" className="jd:text-muted-foreground jd:hover:text-foreground jd:h-6 jd:gap-1 jd:px-1.5 jd:text-[11px] jd:tabular-nums" aria-label="Rows per page" {...rest}>
			{fill(L.perPage, { n: value })}
			<ChevronDown className="jd:h-2.5 jd:w-2.5 jd:opacity-60" />
		</Button>
	)
}
