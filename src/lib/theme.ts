/**
 * One theme for the whole page. Every deck and example box follows
 * `<html data-theme="dark|light">` (or `class="dark"`), else the OS setting.
 * `setTheme` writes the html attribute and remembers the choice; every
 * subscriber re-renders through a MutationObserver on <html>.
 */
import * as React from "react"

export type PageTheme = "light" | "dark"
export type ThemeChoice = PageTheme | "auto"
/** localStorage key shared with the demo site's navbar. */
export const THEME_KEY = "jsondeck:theme"
const DARK_QUERY = "(prefers-color-scheme: dark)"

const hasDom = () => typeof document !== "undefined"

export function systemTheme(): PageTheme {
	return hasDom() && window.matchMedia?.(DARK_QUERY).matches ? "dark" : "light"
}

/** The theme the page asks for: html data-theme, then class="dark", else the OS. */
export function pageTheme(): PageTheme {
	if (!hasDom()) return "light"
	const h = document.documentElement
	const a = h.getAttribute("data-theme")
	if (a === "dark" || a === "light") return a
	if (h.classList.contains("dark")) return "dark"
	return systemTheme()
}

/** Set the page theme for every deck at once; "auto" goes back to the OS. Persisted (try/catch). */
export function setTheme(t: ThemeChoice): void {
	if (!hasDom()) return
	const h = document.documentElement
	if (t === "auto") h.removeAttribute("data-theme")
	else h.setAttribute("data-theme", t)
	h.classList.toggle("dark", t === "dark")
	try {
		if (t === "auto") window.localStorage.removeItem(THEME_KEY)
		else window.localStorage.setItem(THEME_KEY, t)
	} catch {
		// Storage unavailable (private mode, some file:// setups): the theme still applies now.
	}
}

/** Apply a stored choice once, unless the page already set a theme itself. */
export function restoreTheme(): void {
	if (!hasDom() || document.documentElement.hasAttribute("data-theme")) return
	try {
		const t = window.localStorage.getItem(THEME_KEY)
		if (t === "dark" || t === "light") setTheme(t)
	} catch {
		// Nothing stored or storage blocked.
	}
}

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
