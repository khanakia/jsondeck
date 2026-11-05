/**
 * One page: the page filter bar, sections (title, description, collapsible,
 * nested, tabs) and the grid of placed components, plus the layout editor
 * (drag to move, span/height buttons, add, remove). Layout edits are pure
 * functions in core/layout.ts; this file only holds state and wires events.
 */
import { ChevronDown, ChevronRight } from "lucide-react"
import * as React from "react"
import { ClassNamesContext, mergeClassNames, useClassNames } from "@/lib/classnames"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { PageConfig } from "../core/config"
import type { ResolvedItem, ResolvedPage, ResolvedSection } from "../core/layout"
import { toText } from "../core/query"
import { EditContext, type LayoutOps } from "./edit-context"
import { ItemView, PageContext } from "./Items"
import { AddItem, ItemTools, OnDemand } from "./lazy"
import { SegmentedTabs } from "./Tabs"

export type { LayoutOps } from "./edit-context"


function gridTemplate(cols: number[]): string {
	return cols.map((r) => `minmax(0, ${r}fr)`).join(" ")
}

function ItemFrame({ item, section, index }: { item: ResolvedItem; section: ResolvedSection; index: number }) {
	const ed = React.useContext(EditContext)
	const [over, setOver] = React.useState(false)
	// The item's own class slots go on top of the global ones, for everything inside it.
	const itemCls = mergeClassNames(useClassNames(), item.spec.classNames)
	const cols = section.columns.length
	const span = Math.min(item.span, cols)
	const edit = ed?.edit === true
	return (
		<div
			data-jd-item={item.id}
			data-jd-kind={item.kind}
			data-jd-table={item.kind === "table" ? item.table : undefined}
			style={{ gridColumn: `span ${span} / span ${span}`, ...(item.height ? { height: item.height } : {}) }}
			data-jd="item"
			className={cn(
				"jd:max-md:col-span-1 jd:flex jd:min-w-0 jd:flex-col jd:rounded-md",
				// Blocks are cards on the page surface (stat and kv tiles draw their own card).
				item.kind !== "stat" && item.kind !== "kv" && item.kind !== "toc" && cn("jd:border-card-border jd:bg-card jd:rounded-lg jd:border jd:p-2 jd:shadow-(--jds-card-shadow)", itemCls.card),
				itemCls.item,
				item.spec.className,
				edit && "jd:outline jd:outline-1 jd:outline-dashed jd:outline-border jd:outline-offset-2",
				over && "jd:outline-primary jd:outline-2",
			)}
			onDragOver={
				edit
					? (e) => {
							e.preventDefault()
							setOver(true)
						}
					: undefined
			}
			onDragLeave={edit ? () => setOver(false) : undefined}
			onDrop={
				edit
					? (e) => {
							e.preventDefault()
							setOver(false)
							const id = e.dataTransfer.getData("text/jd-item")
							if (id && id !== item.id) ed?.ops.move(id, section.path, index)
						}
					: undefined
			}
		>
			{edit && ed && (
				<OnDemand>
					<ItemTools item={item} span={span} cols={cols} ops={ed.ops} />
				</OnDemand>
			)}
			{item.title && (
				<div className={cn("jd:mb-1", itemCls.cardHeader)} data-jd="card-header">
					<div className={cn("jd:text-[12px] jd:font-semibold", itemCls.cardTitle)} data-jd="card-title">
						{item.title}
					</div>
				</div>
			)}
			{/* Fixed-height items never scroll: charts size themselves to this box; text items scroll only vertically. */}
			<div className={cn("jd:min-h-0 jd:min-w-0 jd:flex-1", item.height && (item.kind === "markdown" || item.kind === "facets" ? "jd:overflow-y-auto jd:overflow-x-hidden" : "jd:overflow-hidden"))}>
				<ClassNamesContext.Provider value={itemCls}>
					<ItemView item={item} />
				</ClassNamesContext.Provider>
			</div>
		</div>
	)
}

function Grid({ section }: { section: ResolvedSection }) {
	const ed = React.useContext(EditContext)
	const gridCls = useClassNames().grid
	if (section.items.length === 0 && !ed?.edit) return null
	return (
		<div className={cn("jd:max-md:grid-cols-1 jd:grid jd:gap-2", gridCls)} style={{ gridTemplateColumns: gridTemplate(section.columns) }} data-jd="grid" data-jd-columns={section.columns.join(",")}>
			{section.items.map((it, i) => (
				<ItemFrame key={it.id} item={it} section={section} index={i} />
			))}
			{ed?.edit && (
				<OnDemand>
					<AddItem section={section} />
				</OnDemand>
			)}
		</div>
	)
}

/** Child sections shown as tabs (the default layout uses this: one tab per table). */
function SectionTabs({ sections }: { sections: ResolvedSection[] }) {
	const [active, setActive] = React.useState(0)
	const key = (s: ResolvedSection, i: number) => {
		const only = s.items.length === 1 ? s.items[0] : undefined
		return only?.kind === "table" && only.table ? only.table : `${s.path}-${i}`
	}
	return (
		<div className="jd:flex jd:flex-col jd:gap-2">
			<SegmentedTabs
				dataJd="tabs"
				value={String(active)}
				onChange={(k) => setActive(Number(k))}
				items={sections.map((s, i) => ({ key: String(i), label: s.title ?? `Tab ${i + 1}`, badge: s.badge, attrs: { "data-jd-tab": key(s, i) } }))}
				className="jd:self-start"
			/>
			{sections.map((s, i) => (
				// Inactive tabs stay mounted (hidden) so each keeps its table state.
				<div key={key(s, i)} hidden={i !== active} className={cn(i !== active && "jd:hidden")} data-jd-tabpanel={key(s, i)}>
					<SectionBody section={s} />
				</div>
			))}
		</div>
	)
}

function SectionBody({ section }: { section: ResolvedSection }) {
	return (
		<div className="jd:flex jd:flex-col jd:gap-2">
			<Grid section={section} />
			{section.tabs && section.sections.length > 0 ? (
				<SectionTabs sections={section.sections} />
			) : (
				section.sections.map((s) => <Section key={s.path} section={s} />)
			)}
		</div>
	)
}

function Section({ section }: { section: ResolvedSection }) {
	const [open, setOpen] = React.useState(!section.collapsed)
	const head = section.title || section.description
	const cls_ = useClassNames()
	return (
		<section className={cn("jd:flex jd:flex-col jd:gap-1.5", cls_.section)} data-jd="section" data-jd-section-path={section.path}>
			{head && (
				<div className="jd:flex jd:flex-col">
					{section.title && (
						<button
							type="button"
							disabled={!section.collapsible}
							onClick={() => setOpen((o) => !o)}
							data-jd="section-toggle"
							aria-expanded={open}
							className={cn("jd:flex jd:items-center jd:gap-1 jd:text-left jd:text-[13px] jd:font-semibold", section.collapsible && "jd:cursor-pointer", cls_.sectionTitle)}
						>
							{section.collapsible && (open ? <ChevronDown className="jd:h-3.5 jd:w-3.5" /> : <ChevronRight className="jd:h-3.5 jd:w-3.5" />)}
							{section.title}
						</button>
					)}
					{section.description && open && <p className="jd:text-muted-foreground jd:text-[12px]">{section.description}</p>}
				</div>
			)}
			{open && <SectionBody section={section} />}
		</section>
	)
}

/** Page filter bar: one select per field; applies to every component that has the field. */
function PageFilterBar({ page, values, onChange }: { page: ResolvedPage; values: Record<string, string>; onChange: (field: string, value: string | undefined) => void }) {
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

export function PageView({
	page,
	edit,
	ops,
	pageFilters,
	onPageFilter,
}: {
	page: ResolvedPage
	config: PageConfig
	edit: boolean
	ops: LayoutOps
	pageFilters: Record<string, string>
	onPageFilter: (field: string, value: string | undefined) => void
}) {
	const seq = React.useRef(0)
	const editCtx = React.useMemo(() => ({ edit, ops, nextId: () => `${page.id}/new-${Date.now().toString(36)}-${(seq.current += 1)}` }), [edit, ops, page.id])
	return (
		<EditContext.Provider value={editCtx}>
			<div className={cn("jd:flex jd:flex-col jd:gap-3", useClassNames().page)} data-jd="page" data-jd-page={page.id}>
				<PageFilterBar page={page} values={pageFilters} onChange={onPageFilter} />
				{page.sections.map((s) => (
					<Section key={s.path} section={s} />
				))}
			</div>
		</EditContext.Provider>
	)
}
