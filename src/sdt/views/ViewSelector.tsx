import { ICON_BTN, LABEL_BTN, Tip, useToolbarLabels } from "../../components/Tip"
import { useLabels } from "@/lib/labels"
import {
	Bookmark,
	BookmarkCheck,
	Check,
	Pin,
	PinOff,
	Plus,
	Star,
	StarOff,
	Trash2,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { TableState } from "../types"
import { SaveViewDialog } from "./SaveViewDialog"
import type { SavedView } from "./storage/ViewStorage"

type Props = {
	views: SavedView[]
	activeViewId: string | null
	/** Current state — used to detect "modified" badge and to seed Save */
	state: TableState
	onSelectView: (view: SavedView) => void
	onCreateView: (name: string) => Promise<SavedView>
	onUpdateView: (view: SavedView) => Promise<SavedView>
	onDeleteView: (id: string) => Promise<void>
	onSetDefault: (id: string | null) => Promise<void>
	onSetFavorite: (id: string, favorite: boolean) => Promise<void>
}


export function ViewSelector({
	views,
	activeViewId,
	state,
	onSelectView,
	onCreateView,
	onUpdateView,
	onDeleteView,
	onSetDefault,
	onSetFavorite,
}: Props) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)

	const activeView = views.find((v) => v.id === activeViewId) ?? null
	const modified = isModified(state, activeView)

	return (
		<>
			<DropdownMenu>
				<Tip label={activeView ? `${L.views}: ${activeView.name}` : L.views} hint="v">
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" aria-label={L.views} data-jd-views-trigger="true" className={activeView || withLabels ? LABEL_BTN : ICON_BTN}>
							<Bookmark className="jd:h-3.5 jd:w-3.5" />
							{/* The view name shows only when a view is active (or labels are on). */}
							{(activeView || withLabels) && <span className="jd:max-w-[10rem] jd:truncate">{activeView?.name ?? L.viewsAll}</span>}
							{modified && <span className="jd:bg-primary jd:absolute jd:right-0.5 jd:top-0.5 jd:h-1.5 jd:w-1.5 jd:rounded-full" title={L.unsavedChanges} />}
						</Button>
					</DropdownMenuTrigger>
				</Tip>
				<DropdownMenuContent align="end" className="jd:w-56 jd:p-0.5">
					<DropdownMenuGroup>
						<DropdownMenuItem
							onClick={() =>
								onSelectView({
									id: "",
									name: L.viewsAll,
									state: { search: "", filters: [], sort: [] },
									createdAt: "",
									updatedAt: "",
								})
							}
							className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
						>
							<Check
								className={cn(
									"jd:h-2.5 jd:w-2.5 jd:shrink-0",
									!activeViewId ? "jd:opacity-100" : "jd:opacity-0",
								)}
							/>
							{L.viewsAll}
						</DropdownMenuItem>
					</DropdownMenuGroup>

					{views.length > 0 && <DropdownMenuSeparator className="jd:my-0.5" />}
					{views.length > 0 && (
						<DropdownMenuGroup>
							{views.map((v) => (
								<ViewRow
									key={v.id}
									view={v}
									active={activeViewId === v.id}
									onSelect={() => onSelectView(v)}
									onSetDefault={() => onSetDefault(v.isDefault ? null : v.id)}
									onSetFavorite={() => onSetFavorite(v.id, !v.isFavorite)}
									onDelete={() => onDeleteView(v.id)}
								/>
							))}
						</DropdownMenuGroup>
					)}

					<DropdownMenuSeparator className="jd:my-0.5" />
					<DropdownMenuGroup>
						{modified && activeView && !activeView.isBuiltin && (
							<DropdownMenuItem
								onClick={() =>
									void onUpdateView({
										...activeView,
										state: {
											search: state.search,
											filters: state.filters,
											sort: state.sort,
											hiddenColumns: state.hiddenColumns,
											columnOrder: state.columnOrder,
											columnSizes: state.columnSizes,
										},
										updatedAt: new Date().toISOString(),
									})
								}
								className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
							>
								<BookmarkCheck className="jd:h-3 jd:w-3" />
								{L.saveChanges}
							</DropdownMenuItem>
						)}
						<DropdownMenuItem
							onClick={() => setSaveDialogOpen(true)}
							className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
						>
							<Plus className="jd:h-3 jd:w-3" />
							{L.saveView}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<SaveViewDialog
				open={saveDialogOpen}
				onOpenChange={setSaveDialogOpen}
				onSave={async (name) => {
					await onCreateView(name)
				}}
			/>
		</>
	)
}

// ── Single view row ──────────────────────────────────────────────────────

function ViewRow({
	view,
	active,
	onSelect,
	onSetDefault,
	onSetFavorite,
	onDelete,
}: {
	view: SavedView
	active: boolean
	onSelect: () => void
	onSetDefault: () => void
	onSetFavorite: () => void
	onDelete: () => void
}) {
	const L = useLabels()
	return (
		<>
			<DropdownMenuItem
				onClick={onSelect}
				className="jd:group jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
			>
				<Check
					className={cn(
						"jd:h-2.5 jd:w-2.5 jd:shrink-0",
						active ? "jd:opacity-100" : "jd:opacity-0",
					)}
				/>
				{view.isFavorite && (
					<Star className="jd:text-amber-500 jd:h-2.5 jd:w-2.5 jd:shrink-0 jd:fill-amber-500" />
				)}
				<span className="jd:flex-1 jd:truncate">{view.name}</span>
				{view.isDefault && (
					<span className="jd:text-muted-foreground jd:text-[10px]">default</span>
				)}
				{view.isBuiltin && (
					<span className="jd:text-muted-foreground jd:text-[10px]">built-in</span>
				)}
			</DropdownMenuItem>
			{!view.isBuiltin && (
				<div className="jd:text-muted-foreground jd:flex jd:items-center jd:gap-1 jd:px-6 jd:pb-1 jd:text-[10px]">
					<button
						type="button"
						className="jd:hover:text-foreground jd:transition-colors"
						onClick={(e) => {
							e.stopPropagation()
							onSetFavorite()
						}}
					>
						{view.isFavorite ? (
							<span className="jd:inline-flex jd:items-center jd:gap-0.5">
								<StarOff className="jd:h-2.5 jd:w-2.5" />
								{L.unfavorite}
							</span>
						) : (
							<span className="jd:inline-flex jd:items-center jd:gap-0.5">
								<Star className="jd:h-2.5 jd:w-2.5" />
								{L.favorite}
							</span>
						)}
					</button>
					<span>·</span>
					<button
						type="button"
						className="jd:hover:text-foreground jd:transition-colors"
						onClick={(e) => {
							e.stopPropagation()
							onSetDefault()
						}}
					>
						{view.isDefault ? (
							<span className="jd:inline-flex jd:items-center jd:gap-0.5">
								<PinOff className="jd:h-2.5 jd:w-2.5" />
								{L.unpin}
							</span>
						) : (
							<span className="jd:inline-flex jd:items-center jd:gap-0.5">
								<Pin className="jd:h-2.5 jd:w-2.5" />
								{L.pin}
							</span>
						)}
					</button>
					<span>·</span>
					<button
						type="button"
						className="jd:hover:text-destructive jd:transition-colors"
						onClick={(e) => {
							e.stopPropagation()
							onDelete()
						}}
					>
						<span className="jd:inline-flex jd:items-center jd:gap-0.5">
							<Trash2 className="jd:h-2.5 jd:w-2.5" />
							{L.delete}
						</span>
					</button>
				</div>
			)}
		</>
	)
}

// ── Modified detection ───────────────────────────────────────────────────

function isModified(state: TableState, view: SavedView | null): boolean {
	if (!view) {
		// No view active — "modified" if anything is set
		return (
			state.search !== "" || state.filters.length > 0 || state.sort.length > 0
		)
	}
	const viewHidden = view.state.hiddenColumns ?? []
	const viewOrder = view.state.columnOrder ?? []
	const viewSizes = view.state.columnSizes ?? {}
	return (
		state.search !== view.state.search ||
		!arraysShallowEq(state.filters, view.state.filters, condEq) ||
		!arraysShallowEq(state.sort, view.state.sort, sortEq) ||
		!arraysShallowEq(state.hiddenColumns, viewHidden, strEq) ||
		!arraysShallowEq(state.columnOrder, viewOrder, strEq) ||
		!sizesEq(state.columnSizes, viewSizes)
	)
}

function strEq(a: string, b: string): boolean {
	return a === b
}

function sizesEq(
	a: Record<string, number>,
	b: Record<string, number>,
): boolean {
	const ak = Object.keys(a)
	const bk = Object.keys(b)
	if (ak.length !== bk.length) return false
	for (const k of ak) if (a[k] !== b[k]) return false
	return true
}

function arraysShallowEq<T>(
	a: T[],
	b: T[],
	eq: (x: T, y: T) => boolean,
): boolean {
	if (a.length !== b.length) return false
	const it = b[Symbol.iterator]()
	for (const x of a) {
		const n = it.next()
		if (n.done || !eq(x, n.value)) return false
	}
	return true
	return true
}

function condEq(
	a: { fieldId: string; operator: string; value: unknown },
	b: { fieldId: string; operator: string; value: unknown },
): boolean {
	return (
		a.fieldId === b.fieldId &&
		a.operator === b.operator &&
		JSON.stringify(a.value) === JSON.stringify(b.value)
	)
}

function sortEq(
	a: { fieldId: string; direction: string },
	b: { fieldId: string; direction: string },
): boolean {
	return a.fieldId === b.fieldId && a.direction === b.direction
}
