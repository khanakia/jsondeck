import * as React from "react"

type Handlers = {
	/** Focus the search input */
	onSlash?: (() => void) | undefined
	/** Open filter picker */
	onF?: (() => void) | undefined
	/** Open views menu */
	onV?: (() => void) | undefined
	/** Open column visibility menu */
	onC?: (() => void) | undefined
	/** Open sort dropdown */
	onS?: (() => void) | undefined
	/** Open the keyboard-shortcuts help dialog */
	onQuestion?: (() => void) | undefined
	/** Previous / next page */
	onArrowLeft?: (() => void) | undefined
	onArrowRight?: (() => void) | undefined
	/** Esc outside an input (e.g. clear search) */
	onEscape?: (() => void) | undefined
	/** Off = listener not attached (e.g. a hidden tab's table). Default true. */
	enabled?: boolean | undefined
}

/**
 * Global keyboard shortcuts. Only fires when focus is NOT inside an input
 * or contenteditable element so we don't intercept normal typing.
 *
 * Shortcuts:
 *   /  → focus search
 *   f  → open filter picker
 *   v  → open views menu
 *   c  → open column visibility
 */
export function useShortcuts(handlers: Handlers) {
	const handlersRef = React.useRef(handlers)
	handlersRef.current = handlers

	const enabled = handlers.enabled ?? true
	React.useEffect(() => {
		if (!enabled) return
		const onKeyDown = (e: KeyboardEvent) => {
			// Skip when typing in inputs / textareas / contenteditable
			const target = e.target as HTMLElement | null
			if (target) {
				const tag = target.tagName
				if (
					tag === "INPUT" ||
					tag === "TEXTAREA" ||
					tag === "SELECT" ||
					target.isContentEditable
				) {
					return
				}
			}
			// Skip when modifier keys involved (cmd/ctrl/alt)
			if (e.metaKey || e.ctrlKey || e.altKey) return

			const h = handlersRef.current
			switch (e.key) {
				case "/":
					if (h.onSlash) {
						e.preventDefault()
						h.onSlash()
					}
					break
				case "f":
				case "F":
					if (h.onF) {
						e.preventDefault()
						h.onF()
					}
					break
				case "v":
				case "V":
					if (h.onV) {
						e.preventDefault()
						h.onV()
					}
					break
				case "c":
				case "C":
					if (h.onC) {
						e.preventDefault()
						h.onC()
					}
					break
				case "s":
				case "S":
					if (h.onS) {
						e.preventDefault()
						h.onS()
					}
					break
				case "ArrowLeft":
					if (h.onArrowLeft) {
						e.preventDefault()
						h.onArrowLeft()
					}
					break
				case "ArrowRight":
					if (h.onArrowRight) {
						e.preventDefault()
						h.onArrowRight()
					}
					break
				case "Escape":
					h.onEscape?.()
					break
				case "?":
					if (h.onQuestion) {
						e.preventDefault()
						h.onQuestion()
					}
					break
			}
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [enabled])
}
