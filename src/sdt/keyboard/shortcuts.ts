/**
 * The table's keyboard shortcuts, an on-demand chunk loaded on the first key
 * press (ClientDataTable's first-key listener handles "/" itself at once, so
 * search focuses on the very first press, and hands any other first key to
 * `runShortcut` once this arrives). Only fires when focus is not in an input
 * or contenteditable element, and never with cmd / ctrl / alt held.
 *
 *   /  focus search        f  filter picker     v  views menu
 *   c  columns menu        s  sort menu         ?  shortcuts help
 *   ←  previous page       →  next page         Esc  clear search
 */
import { ignoredKey } from "./useShortcuts"

export type ShortcutHandlers = {
	onSlash?: (() => void) | undefined
	onF?: (() => void) | undefined
	onV?: (() => void) | undefined
	onC?: (() => void) | undefined
	onS?: (() => void) | undefined
	onQuestion?: (() => void) | undefined
	onArrowLeft?: (() => void) | undefined
	onArrowRight?: (() => void) | undefined
	onEscape?: (() => void) | undefined
}

/** Key → handler name. Esc is the one key whose default is left alone. */
const KEYS: Record<string, keyof ShortcutHandlers> = {
	"/": "onSlash",
	f: "onF",
	F: "onF",
	v: "onV",
	V: "onV",
	c: "onC",
	C: "onC",
	s: "onS",
	S: "onS",
	"?": "onQuestion",
	ArrowLeft: "onArrowLeft",
	ArrowRight: "onArrowRight",
	Escape: "onEscape",
}

/** Run the shortcut for a key; true when one ran. `preventDefault` is called for every key but Esc. */
export function runShortcut(key: string, h: ShortcutHandlers, preventDefault: () => void): boolean {
	const name = KEYS[key]
	const fn = name ? h[name] : undefined
	if (!fn) return false
	if (key !== "Escape") preventDefault()
	fn()
	return true
}

/** Listen on the window until the returned function is called; `get` returns the current handlers. */
export function listenShortcuts(get: () => ShortcutHandlers): () => void {
	const onKeyDown = (e: KeyboardEvent) => {
		if (!ignoredKey(e)) runShortcut(e.key, get(), () => e.preventDefault())
	}
	window.addEventListener("keydown", onKeyDown)
	return () => window.removeEventListener("keydown", onKeyDown)
}
