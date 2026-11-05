/**
 * The page theme as React hooks: every subscriber re-renders through a
 * MutationObserver on <html> (and the OS setting). The theme itself, and
 * setTheme / pageTheme, are in theme-dom.ts.
 */
import * as React from "react"
import { DARK_QUERY, hasDom, type PageTheme, pageTheme, systemTheme } from "./theme-dom"

export { pageTheme, restoreTheme, setTheme, systemTheme, THEME_KEY, type PageTheme, type ThemeChoice } from "./theme-dom"

function subscribe(cb: () => void): () => void {
	if (!hasDom()) return () => {}
	const mo = new MutationObserver(cb)
	mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] })
	const mq = window.matchMedia?.(DARK_QUERY)
	mq?.addEventListener("change", cb)
	return () => {
		mo.disconnect()
		mq?.removeEventListener("change", cb)
	}
}

/** The current page theme; re-renders when it changes anywhere. */
export function usePageTheme(): PageTheme {
	return React.useSyncExternalStore(subscribe, pageTheme, () => "light")
}

/** The OS theme; re-renders when it changes. */
export function useSystemTheme(): PageTheme {
	return React.useSyncExternalStore(subscribe, systemTheme, () => "light")
}
