/**
 * The layout editor tools, loaded when edit mode is first switched on: the
 * per-item toolbar (drag handle, size, narrower / wider, shorter / taller,
 * remove) and the "add a component" control at the end of each section.
 * Page.tsx keeps the drop targets; the edits themselves are pure functions in
 * core/layout.ts applied by Deck.
 */
import { Check, Copy, GripVertical, Minus, MoveHorizontal, MoveVertical, Plus, RotateCcw, X } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { COMPONENTS, TABLELESS, type ComponentKind, type ResolvedItem, type ResolvedSection } from "../core/layout"
import { starterItem } from "../core/layout-edit"
import { EditContext, type LayoutOps } from "./edit-context"
import { PageContext } from "./Items"
import { ICON_BTN, LABEL_BTN, Tip, useToolbarLabels } from "./Tip"

/** Height step for the taller/shorter buttons, and the floor. */
const HEIGHT_STEP = 80
const MIN_HEIGHT = 120
/** Item height used when "taller" is pressed on an auto-height item. */
const START_HEIGHT = 320


export function ItemTools({ item, span, cols, ops }: { item: ResolvedItem; span: number; cols: number; ops: LayoutOps }) {
	const L = useLabels()
	return (
		<div className="jd:mb-1 jd:flex jd:items-center jd:gap-0.5 jd:text-[11px]" data-jd="item-tools">
			<span
				draggable
				onDragStart={(e) => {
					e.dataTransfer.setData("text/jd-item", item.id)
					e.dataTransfer.effectAllowed = "move"
				}}
				title={L.moveHandle}
				data-jd="drag-handle"
				className="jd:text-muted-foreground jd:flex jd:cursor-grab jd:items-center jd:gap-1"
			>
				<GripVertical className="jd:h-3.5 jd:w-3.5" />
				{item.kind}
				{item.table ? ` · ${item.table}` : ""}
			</span>
			<span className="jd:flex-1" />
			<span className="jd:text-muted-foreground jd:mr-1 jd:tabular-nums" data-jd="item-size">
				{span}/{cols}
				{item.height ? ` · ${item.height}px` : ""}
			</span>
			<Button variant="ghost" size="icon-sm" aria-label={L.narrower} onClick={() => ops.update(item.id, { span: Math.max(1, item.span - 1) })}>
				<Minus />
			</Button>
			<MoveHorizontal className="jd:text-muted-foreground jd:h-3 jd:w-3" />
			<Button variant="ghost" size="icon-sm" aria-label={L.wider} onClick={() => ops.update(item.id, { span: Math.min(cols, item.span + 1) })}>
				<Plus />
			</Button>
			<Button variant="ghost" size="icon-sm" aria-label={L.shorter} onClick={() => ops.update(item.id, { height: item.height ? (item.height - HEIGHT_STEP < MIN_HEIGHT ? undefined : item.height - HEIGHT_STEP) : undefined })}>
				<Minus />
			</Button>
			<MoveVertical className="jd:text-muted-foreground jd:h-3 jd:w-3" />
			<Button variant="ghost" size="icon-sm" aria-label={L.taller} onClick={() => ops.update(item.id, { height: (item.height ?? START_HEIGHT - HEIGHT_STEP) + HEIGHT_STEP })}>
				<Plus />
			</Button>
			<Button variant="ghost" size="icon-sm" aria-label={L.remove} onClick={() => ops.remove(item.id)}>
				<X />
			</Button>
		</div>
	)
}

/** "Add" control at the end of a section in edit mode. */
export function AddItem({ section }: { section: ResolvedSection }) {
	const ed = React.useContext(EditContext)
	const ctx = React.useContext(PageContext)
	const L = useLabels()
	const [kind, setKind] = React.useState<ComponentKind>("chart")
	const [table, setTable] = React.useState(ctx?.deck.tables[0]?.name ?? "")
	const [over, setOver] = React.useState(false)
	if (!ed?.edit || !ctx) return null
	const sel = "jd:h-6 jd:rounded jd:border jd:border-input jd:bg-background jd:px-1 jd:text-[11px]"
	return (
		<div
			data-jd="add-item"
			data-jd-section={section.path}
			className={cn("jd:col-span-full jd:flex jd:items-center jd:gap-1 jd:rounded jd:border jd:border-dashed jd:p-1 jd:text-[11px]", over && "jd:border-primary")}
			onDragOver={(e) => {
				e.preventDefault()
				setOver(true)
			}}
			onDragLeave={() => setOver(false)}
			onDrop={(e) => {
				e.preventDefault()
				setOver(false)
				const id = e.dataTransfer.getData("text/jd-item")
				if (id) ed.ops.move(id, section.path, section.items.length)
			}}
		>
			<span className="jd:text-muted-foreground jd:mr-1">{L.dropHere} ·</span>
			<select aria-label="Component" data-jd="add-kind" className={sel} value={kind} onChange={(e) => setKind(COMPONENTS.find((c) => c === e.target.value) ?? "table")}>
				{COMPONENTS.map((c) => (
					<option key={c} value={c}>
						{c}
					</option>
				))}
			</select>
			{!TABLELESS.includes(kind) && (
				<select aria-label="Table" data-jd="add-table" className={sel} value={table} onChange={(e) => setTable(e.target.value)}>
					{ctx.deck.tables.map((t) => (
						<option key={t.name} value={t.name}>
							{t.label}
						</option>
					))}
				</select>
			)}
			<Button variant="outline" size="xs" data-jd="add-button" onClick={() => ed.ops.add(section.path, starterItem(ctx.deck, kind, table, ed.nextId()))}>
				<Plus />
				{L.addItem}
			</Button>
		</div>
	)
}


/** Copy config / Reset layout buttons in the deck header while editing. */
export function DeckEditTools({ copied, onCopy, onReset }: { copied: boolean; onCopy: () => void; onReset: () => void }) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	return (
		<>
			<Tip label={copied ? L.copied : L.copyConfig}>
				<Button variant="ghost" size="sm" aria-label={L.copyConfig} className={withLabels ? LABEL_BTN : ICON_BTN} data-jd="copy-config" onClick={onCopy}>
					{copied ? <Check className="jd:h-3.5 jd:w-3.5" /> : <Copy className="jd:h-3.5 jd:w-3.5" />}
					{withLabels && (copied ? L.copied : L.copyConfig)}
				</Button>
			</Tip>
			<Tip label={L.resetLayout}>
				<Button variant="ghost" size="sm" aria-label={L.resetLayout} className={withLabels ? LABEL_BTN : ICON_BTN} data-jd="reset-layout" onClick={onReset}>
					<RotateCcw className="jd:h-3.5 jd:w-3.5" />
					{withLabels && L.resetLayout}
				</Button>
			</Tip>
		</>
	)
}
