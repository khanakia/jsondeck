import * as React from "react"
import { keyboardPart } from "../../components/parts"
import type { ShortcutHandlers } from "./shortcuts"

/** Keys the shortcut layer answers (besides Esc, whose default it leaves alone). */
const FIRST_KEYS = ["/", "f", "F", "v", "V", "c", "C", "s", "S", "?", "ArrowLeft", "ArrowRight"]

/** Typing in a field, or a modifier held: shortcuts stay out of the way. */
export function ignoredKey(e: Pick<KeyboardEvent, "target" | "metaKey" | "ctrlKey" | "altKey">): boolean {
	const t = e.target
	if (t instanceof HTMLElement && (t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return true
	return e.metaKey || e.ctrlKey || e.altKey
}

/**
 * The table's keyboard shortcuts (the layer itself is the on-demand chunk
 * keyboard/shortcuts.ts). Until it has loaded, a small first-key listener
 * stands in: "/" focuses search at once (so it works on the very first
 * press), the other shortcut keys have their browser default stopped, and the
 * key is handed to the layer as soon as it arrives. Off when `enabled` is
 * false (a hidden tab's table).
 */
export function useShortcuts(handlers: ShortcutHandlers & { enabled?: boolean | undefined }) {
	const ref = React.useRef(handlers)
	ref.current = handlers
	const layer = keyboardPart.use()
	const enabled = handlers.enabled ?? true
	// Keys pressed before the layer arrived, replayed one per render so each sees the state the one before left (two quick → keys move two pages).
	const pending = React.useRef<string[]>([])
	const [replayed, setReplayed] = React.useState(0)
	React.useEffect(() => {
		if (!enabled) return
		if (layer) return layer.listenShortcuts(() => ref.current)
		const onFirst = (e: KeyboardEvent) => {
			if (ignoredKey(e)) return
			const key = e.key
			const slash = key === "/" ? ref.current.onSlash : undefined
			if (slash) slash()
			else pending.current.push(key)
			if (FIRST_KEYS.includes(key)) e.preventDefault()
			keyboardPart.load().catch(() => undefined)
		}
		window.addEventListener("keydown", onFirst)
		return () => window.removeEventListener("keydown", onFirst)
	}, [enabled, layer])
	React.useEffect(() => {
		if (!layer || !enabled) return
		const key = pending.current.shift()
		if (key === undefined) return
		layer.runShortcut(key, ref.current, () => undefined)
		if (pending.current.length > 0) setReplayed((n) => n + 1)
	}, [layer, enabled, replayed])
}
