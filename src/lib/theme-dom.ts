/**
 * One theme for the whole page, the DOM half (no React): every deck and
 * example box follows `<html data-theme="dark|light">` (or `class="dark"`),
 * else the OS setting. `setTheme` writes the html attribute and remembers the
 * choice. The <script> loader uses this file directly, so the theme applies
 * before the rest of jsondeck has loaded; theme.ts adds the React hooks.
 */
export type PageTheme = "light" | "dark"
export type ThemeChoice = PageTheme | "auto"
/** localStorage key shared with the demo site's navbar. */
export const THEME_KEY = "jsondeck:theme"
export const DARK_QUERY = "(prefers-color-scheme: dark)"

export const hasDom = () => typeof document !== "undefined"

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

