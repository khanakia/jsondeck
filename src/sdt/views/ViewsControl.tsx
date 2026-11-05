/**
 * Saved views for one table, as an on-demand chunk: the storage, the list,
 * applying the default view, and the Views toolbar control with its create /
 * update / delete / default / favourite handlers. ClientDataTable shows a
 * look-alike trigger until this arrives (on hover, focus or click of the
 * Views button), or has it loaded before its first render when a default view
 * is stored (components/first-paint.ts), so the table opens on that view with
 * no flash.
 */
import * as React from "react"
import { useLabels } from "@/lib/labels"
import { deferredControl } from "@/components/ui/deferred"
import { popups } from "@/components/ui/popups-handle"
import { Tip } from "../../components/Tip"
import { initialTableState } from "../state/reducer"
import { ViewsTrigger, viewsTip } from "../toolbar/triggers"
import type { TableState } from "../types"
import type { ViewSelector as RealViews } from "./ViewSelector"
import { isModified } from "./modified"
import { LocalStorageViewStorage } from "./storage/LocalStorageViewStorage"
import type { SavedView, ViewStorage } from "./storage/ViewStorage"
import { useSavedViews } from "./useSavedViews"

/** The stored default view of a scope, read synchronously (built-in localStorage storage only). */
export function readDefaultView(scope: string): SavedView | null {
	return new LocalStorageViewStorage(scope).read().find((v) => v.isDefault) ?? null
}

/** The table state a view opens on (page size kept; grouping falls back to the table's own). */
export function viewState(view: SavedView, groupBy: string[], pageSize: number): TableState {
	return initialTableState({
		search: view.state.search,
		filters: view.state.filters,
		sort: view.state.sort,
		hiddenColumns: view.state.hiddenColumns ?? [],
		columnOrder: view.state.columnOrder ?? [],
		columnSizes: view.state.columnSizes ?? {},
		groupBy: view.state.groupBy ?? groupBy,
		detailColumns: view.state.detailColumns ?? null,
		pageSize,
		viewId: view.id || null,
	})
}

type ViewsProps = React.ComponentProps<typeof RealViews>

/** The real views menu (popups chunk), with its look-alike trigger until that chunk arrives. */
const ViewSelector = deferredControl(popups, (m) => m.ViewSelector, function ViewsStand(p: ViewsProps) {
	const L = useLabels()
	const active = p.views.find((v) => v.id === p.activeViewId) ?? null
	return (
		<Tip label={viewsTip(L, active?.name)} hint="v">
			<ViewsTrigger activeName={active?.name} modified={isModified(p.state, active)} />
		</Tip>
	)
})

export type ViewsControlProps = {
	/** Storage scope (`jsondeck:<instance id>`). */
	scope: string
	/** A custom ViewStorage from config; default localStorage. */
	storage: ViewStorage | undefined
	state: TableState
	replaceState: (s: TableState) => void
	setViewId: (id: string | null) => void
	/** The table's configured grouping (a view without grouping falls back to it). */
	groupBy: string[]
	/** True when the table already opened on the default view (its first render read it). */
	openedOnDefault: boolean
}

/** Generate a stable id for a newly-saved view. */
function makeViewId(): string {
	return `v_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`
}

export function ViewsControl({ scope, storage, state, replaceState, setViewId, groupBy, openedOnDefault }: ViewsControlProps) {
	const { views, save, remove, setDefault, setFavorite } = useSavedViews({ scope, storage })

	// Apply the default view once, when storage has loaded (a custom storage, or a default set elsewhere since).
	const didApply = React.useRef(openedOnDefault)
	const pageSize = state.pageSize
	React.useEffect(() => {
		if (didApply.current) return
		const def = views.find((v) => v.isDefault)
		if (def) {
			didApply.current = true
			replaceState(viewState(def, groupBy, pageSize))
		} else if (views.length > 0) didApply.current = true
	}, [views, replaceState, pageSize, groupBy])

	const onSelectView = React.useCallback((v: SavedView) => replaceState(viewState(v, groupBy, pageSize)), [replaceState, groupBy, pageSize])

	return (
		<ViewSelector
			views={views}
			activeViewId={state.viewId}
			state={state}
			onSelectView={onSelectView}
			onCreateView={async (name) => {
				const now = new Date().toISOString()
				const v = await save({
					id: makeViewId(),
					name,
					state: {
						search: state.search,
						filters: state.filters,
						sort: state.sort,
						hiddenColumns: state.hiddenColumns,
						columnOrder: state.columnOrder,
						columnSizes: state.columnSizes,
						groupBy: state.groupBy,
						detailColumns: state.detailColumns,
					},
					createdAt: now,
					updatedAt: now,
				})
				setViewId(v.id)
				return v
			}}
			onUpdateView={async (v) => save(v)}
			onDeleteView={async (id) => {
				await remove(id)
				if (state.viewId === id) setViewId(null)
			}}
			onSetDefault={setDefault}
			onSetFavorite={setFavorite}
		/>
	)
}
