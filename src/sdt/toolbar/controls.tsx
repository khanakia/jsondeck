/**
 * The table's popup controls as the core sees them. Each real control (with
 * its popup, state and logic) is in the on-demand popups chunk (src/popups.ts);
 * until that chunk arrives, its stand-in here renders the very same trigger
 * button (toolbar/triggers.tsx) with the same tooltip and the same early
 * "nothing to show" rules, so the toolbar looks identical and keyboard
 * shortcuts find the same `data-jd-*` attributes. See ui/deferred.tsx for the
 * hand-over (preload on hover / focus, a cold click replayed on the real one).
 */
import type * as React from "react"
import { Tip } from "../../components/Tip"
import { useLabels } from "@/lib/labels"
import { deferredControl, lazyPart } from "@/components/ui/deferred"
import { popups } from "@/components/ui/popups-handle"
import type { Row } from "../../core/query"
import type { ColumnHeaderMenu as RealHeaderMenu } from "../columns/ColumnHeaderMenu"
import type { ColumnVisibilityMenu as RealColumnsMenu } from "../columns/ColumnVisibilityMenu"
import type { FilterPicker as RealFilterPicker } from "../filters/FilterPicker"
import type { ShortcutsHelp as RealShortcutsHelp } from "../keyboard/ShortcutsHelp"
import type { PageSizeSelect as RealPageSize } from "../pagination/PageSizeSelect"
import type { GroupByMenu as RealGroupBy, MoreMenu as RealMore } from "../rows/ToolbarMenus"
import type { SortDropdown as RealSort } from "../sort/SortDropdown"
import type { TableExportButton as RealExport } from "./TableExportButton"
import { ColumnsTrigger, ExportTrigger, FilterTrigger, GroupTrigger, groupTip, HeaderMenuTrigger, MoreTrigger, PageSizeTrigger, SortTrigger, sortTip } from "./triggers"

type FilterPickerProps = React.ComponentProps<typeof RealFilterPicker<unknown>>
type SortProps = React.ComponentProps<typeof RealSort>
type ColumnsProps = React.ComponentProps<typeof RealColumnsMenu<Row>>
type GroupProps = React.ComponentProps<typeof RealGroupBy>
type MoreProps = React.ComponentProps<typeof RealMore>
type ExportProps = React.ComponentProps<typeof RealExport<Row>>
type HeaderProps = React.ComponentProps<typeof RealHeaderMenu<Row>>
type PageSizeProps = React.ComponentProps<typeof RealPageSize>

export const FilterPicker = deferredControl(popups, (m) => m.FilterPicker<unknown>, function FilterPickerStand(p: FilterPickerProps) {
	const L = useLabels()
	return (
		<Tip label={L.filter} hint="f">
			<FilterTrigger activeCount={p.activeCount ?? 0} />
		</Tip>
	)
})

export const SortDropdown = deferredControl(popups, (m) => m.SortDropdown, function SortStand(p: SortProps) {
	const L = useLabels()
	return (
		<Tip label={sortTip(L, p.options, p.value)} hint="s">
			<SortTrigger options={p.options} value={p.value} />
		</Tip>
	)
})

export const ColumnVisibilityMenu = deferredControl(popups, (m) => m.ColumnVisibilityMenu<Row>, function ColumnsStand(p: ColumnsProps) {
	const L = useLabels()
	// Same rule as the real menu: nothing to hide, no button.
	if (!p.columns.some((c) => c.meta?.hideable !== false && c.id !== "__actions")) return null
	return (
		<Tip label={L.columns} hint="c">
			<ColumnsTrigger hiddenCount={p.hiddenColumns.length} />
		</Tip>
	)
})

export const GroupByMenu = deferredControl(popups, (m) => m.GroupByMenu, function GroupStand(p: GroupProps) {
	const L = useLabels()
	return (
		<Tip label={groupTip(L, p.value)}>
			<GroupTrigger value={p.value} />
		</Tip>
	)
})

export const MoreMenu = deferredControl(popups, (m) => m.MoreMenu, function MoreStand(p: MoreProps) {
	const L = useLabels()
	if (p.items.length === 0) return null
	return (
		<Tip label={L.more}>
			<MoreTrigger />
		</Tip>
	)
})

export const TableExportButton = deferredControl(popups, (m) => m.TableExportButton<Row>, function ExportStand(p: ExportProps) {
	const label = p.label ?? "Export"
	return (
		<Tip label={label}>
			<ExportTrigger label={label} hideIcon={p.hideIcon} disabled={p.ctx.isFetching} />
		</Tip>
	)
})

export const ColumnHeaderMenu = deferredControl(popups, (m) => m.ColumnHeaderMenu<Row>, function HeaderStand(p: HeaderProps) {
	const meta = p.column.meta ?? {}
	const canSort = !!meta.sortFieldId && p.sortFieldIds.has(meta.sortFieldId)
	const canFilter = !!meta.filterFieldId && p.filterFieldIds.has(meta.filterFieldId)
	if (!canSort && !canFilter && !p.hideable) return null
	const sortDir = meta.sortFieldId ? (p.currentSort.find((s) => s.fieldId === meta.sortFieldId)?.direction ?? null) : null
	return <HeaderMenuTrigger sortDir={sortDir} />
})

export const PageSizeSelect = deferredControl(popups, (m) => m.PageSizeSelect, function PageSizeStand(p: PageSizeProps) {
	return <PageSizeTrigger value={p.value} />
})

/** Filter pills: only exist once a filter is set; they load (with the popups chunk) the first time one shows. */
export const FilterPill = lazyPart(popups, (m) => m.FilterPill<unknown>)

const RealShortcuts = lazyPart(popups, (m) => m.ShortcutsHelp)
/** The "?" shortcuts dialog: nothing until opened, then loads and shows. */
export function ShortcutsHelp(p: React.ComponentProps<typeof RealShortcutsHelp>) {
	return p.open ? <RealShortcuts {...p} /> : null
}
