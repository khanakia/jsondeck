/**
 * Column resize and drag-reorder, an on-demand chunk. The table preloads it
 * when the pointer enters the header and loads it on the first press of a
 * resize handle or the first drag of a column label, so the very first use
 * works even if it is not there yet.
 */

/** Narrowest a column can be dragged to (protects against accidentally-zero columns). */
const MIN_WIDTH = 60

type Point = { clientX: number } | { touches: ArrayLike<{ clientX: number }> }
const xOf = (e: Point): number => ("touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX)

/** Where the pointer went while this chunk was loading (the table records it from the press on). */
export type EarlyDrag = { x: number; released: boolean }

/**
 * Follow the pointer from a press on a resize handle until release, sending
 * the column's new width on every move. `startWidth` is the column's width
 * when pressed; `startX` the press position. `early` is what happened between
 * the press and this chunk arriving: the width catches up with it at once,
 * and a drag that already ended is simply applied.
 */
export function trackResize(startX: number, startWidth: number, onWidth: (width: number) => void, early: EarlyDrag): void {
	const widthAt = (x: number) => Math.max(MIN_WIDTH, startWidth + x - startX)
	if (early.x !== startX) onWidth(widthAt(early.x))
	if (early.released) return
	const onMove = (ev: MouseEvent | TouchEvent) => onWidth(widthAt(xOf(ev)))
	const onEnd = () => {
		document.removeEventListener("mousemove", onMove)
		document.removeEventListener("mouseup", onEnd)
		document.removeEventListener("touchmove", onMove)
		document.removeEventListener("touchend", onEnd)
		document.body.style.cursor = ""
		document.body.style.userSelect = ""
	}
	// Lock the cursor and text selection while dragging.
	document.body.style.cursor = "col-resize"
	document.body.style.userSelect = "none"
	document.addEventListener("mousemove", onMove)
	document.addEventListener("mouseup", onEnd)
	document.addEventListener("touchmove", onMove)
	document.addEventListener("touchend", onEnd)
}

/** The column order after dropping `dragged` onto `target` (null when nothing moves). */
export function reorder(ids: readonly string[], dragged: string, target: string): string[] | null {
	if (!dragged || dragged === target) return null
	const from = ids.indexOf(dragged)
	const to = ids.indexOf(target)
	if (from < 0 || to < 0) return null
	const next = [...ids]
	next.splice(from, 1)
	next.splice(to, 0, dragged)
	return next
}
