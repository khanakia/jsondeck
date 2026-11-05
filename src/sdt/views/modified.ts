/**
 * Whether the table state differs from the active saved view (or, with no
 * view, whether anything is set). Shared by the view selector and its
 * stand-in trigger, which both show the "unsaved changes" dot.
 */
import type { TableState } from "../types"
import type { SavedView } from "./storage/ViewStorage"

export function isModified(state: TableState, view: SavedView | null): boolean {
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
