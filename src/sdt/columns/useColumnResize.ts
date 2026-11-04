import * as React from "react"

type Options = {
	/** Current width map (id → px). */
	sizes: Record<string, number>
	/** Commit a new width map. */
	onSizesChange: (sizes: Record<string, number>) => void
	/** Default starting width when no override exists for a column. */
	defaultSize?: number | undefined
}

/**
 * Custom column-resize hook.
 *
 * Returns a function `startResize(columnId, event)` for header resize
 * handles to wire up. While the user drags, we attach mousemove/mouseup
 * listeners on document and call `onSizesChange` on every move.
 *
 * Why a custom impl? The table owns its own column model (no table library),
 * so we do the bookkeeping here in ~30 lines.
 */
export function useColumnResize({
	sizes,
	onSizesChange,
	defaultSize = 160,
}: Options) {
	// Latest values held in refs so handlers don't capture stale state.
	const sizesRef = React.useRef(sizes)
	sizesRef.current = sizes
	const onChangeRef = React.useRef(onSizesChange)
	onChangeRef.current = onSizesChange

	const startResize = React.useCallback(
		(columnId: string, e: React.MouseEvent | React.TouchEvent) => {
			e.preventDefault()
			e.stopPropagation()
			const startX =
				"touches" in e ? (e.touches[0]?.clientX ?? 0) : e.clientX
			const startWidth = sizesRef.current[columnId] ?? defaultSize

			const onMove = (ev: MouseEvent | TouchEvent) => {
				const x =
					"touches" in ev ? (ev.touches[0]?.clientX ?? 0) : ev.clientX
				// 60px floor protects against accidentally-zero columns.
				const next = Math.max(60, startWidth + x - startX)
				onChangeRef.current({ ...sizesRef.current, [columnId]: next })
			}
			const onEnd = () => {
				document.removeEventListener("mousemove", onMove)
				document.removeEventListener("mouseup", onEnd)
				document.removeEventListener("touchmove", onMove)
				document.removeEventListener("touchend", onEnd)
				document.body.style.cursor = ""
				document.body.style.userSelect = ""
			}
			// Lock the cursor + disable text selection during drag for clean UX.
			document.body.style.cursor = "col-resize"
			document.body.style.userSelect = "none"
			document.addEventListener("mousemove", onMove)
			document.addEventListener("mouseup", onEnd)
			document.addEventListener("touchmove", onMove)
			document.addEventListener("touchend", onEnd)
		},
		[defaultSize],
	)

	return { startResize }
}
