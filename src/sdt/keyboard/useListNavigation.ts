import * as React from "react"

type Options = {
	/** Total navigable item count. */
	count: number
	/** Called when the user presses Enter on a highlighted item. */
	onSelect: (index: number) => void
	/** Reset the highlighted index when this changes. Typically the
	 *  filtered list reference or query string. */
	resetKey?: unknown | undefined
	/** Wrap around at boundaries (top → bottom and vice versa). Default true. */
	wrap?: boolean | undefined
	/**
	 * Which arrow keys move the highlight.
	 * - "vertical"   ↑/↓ (default — long lists)
	 * - "horizontal" ←/→ (button rows, segmented controls)
	 * - "both"       all four arrows respond
	 */
	orientation?: "vertical" | "horizontal" | "both" | undefined
}

/**
 * Drop-in arrow-key navigation for any list-like dropdown.
 *
 * Returns:
 *   - `activeIndex`     — currently highlighted item
 *   - `setActiveIndex`  — set on hover so mouse + keyboard stay in sync
 *   - `onKeyDown`       — spread on the input/container to capture arrows
 *   - `getItemRef(i)`   — pass to each item so we can scroll it into view
 *
 * Wire up from any popover with a search input + scrollable list:
 *   const nav = useListNavigation({ count: items.length, onSelect, resetKey: query })
 *   <Input onKeyDown={nav.onKeyDown} … />
 *   {items.map((it, i) => (
 *     <button ref={nav.getItemRef(i)}
 *             onMouseMove={() => nav.setActiveIndex(i)}
 *             className={cn(nav.activeIndex === i && "bg-accent")} />
 *   ))}
 */
export function useListNavigation({
	count,
	onSelect,
	resetKey,
	wrap = true,
	orientation = "vertical",
}: Options) {
	const [activeIndex, setActiveIndex] = React.useState(0)
	const itemRefs = React.useRef<Array<HTMLElement | null>>([])

	// Keep the ref array sized to the current item count.
	itemRefs.current.length = count

	// Reset highlight to the top when the underlying list changes (e.g. the user
	// typed a new query and the filtered list updated). Done in render via a
	// previous-value compare rather than an effect — it's synchronous (no flash
	// of a stale highlight) and `resetKey` is a real read, not a trigger-only dep.
	const [prevResetKey, setPrevResetKey] = React.useState(resetKey)
	if (prevResetKey !== resetKey) {
		setPrevResetKey(resetKey)
		setActiveIndex(0)
	}

	// Clamp if items shrank below the active index.
	React.useEffect(() => {
		if (activeIndex >= count) setActiveIndex(Math.max(0, count - 1))
	}, [activeIndex, count])

	// Scroll the active item into view whenever it changes.
	React.useEffect(() => {
		const el = itemRefs.current[activeIndex]
		el?.scrollIntoView({ block: "nearest" })
	}, [activeIndex])

	const onKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (count === 0) return
			const next = () =>
				setActiveIndex((i) => {
					const n = i + 1
					if (n >= count) return wrap ? 0 : count - 1
					return n
				})
			const prev = () =>
				setActiveIndex((i) => {
					const p = i - 1
					if (p < 0) return wrap ? count - 1 : 0
					return p
				})
			const vertical = orientation === "vertical" || orientation === "both"
			const horizontal = orientation === "horizontal" || orientation === "both"

			switch (e.key) {
				case "ArrowDown":
					if (!vertical) return
					e.preventDefault()
					next()
					break
				case "ArrowUp":
					if (!vertical) return
					e.preventDefault()
					prev()
					break
				case "ArrowRight":
					if (!horizontal) return
					e.preventDefault()
					next()
					break
				case "ArrowLeft":
					if (!horizontal) return
					e.preventDefault()
					prev()
					break
				case "Home":
					e.preventDefault()
					setActiveIndex(0)
					break
				case "End":
					e.preventDefault()
					setActiveIndex(count - 1)
					break
				case "Enter":
					e.preventDefault()
					onSelect(activeIndex)
					break
			}
		},
		[count, wrap, orientation, onSelect, activeIndex],
	)

	const getItemRef = React.useCallback(
		(i: number) => (el: HTMLElement | null) => {
			itemRefs.current[i] = el
		},
		[],
	)

	return { activeIndex, setActiveIndex, onKeyDown, getItemRef }
}
