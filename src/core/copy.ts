/**
 * The always-loaded part of copying: the list of copy formats (menus show it)
 * and `copyText`, which writes to the clipboard. The serializers that turn
 * rows into JSON / CSV / TSV / Markdown / text are in clipboard.ts, loaded on
 * demand.
 */
export const COPY_FORMATS = ["json", "csv", "tsv", "markdown", "text"] as const
export type CopyFormat = (typeof COPY_FORMATS)[number]

/** Old path for pages where the async API is missing or refused (file://, older browsers, no focus). */
function legacyCopy(str: string): boolean {
	if (typeof document === "undefined") return false
	const t = document.createElement("textarea")
	t.value = str
	t.setAttribute("readonly", "")
	t.style.position = "fixed"
	t.style.top = "0"
	t.style.left = "0"
	t.style.opacity = "0"
	document.body.appendChild(t)
	const prev = document.activeElement
	try {
		t.select()
		// execCommand is deprecated but is the only synchronous fallback that works from file:// pages.
		return document.execCommand("copy")
	} catch {
		return false
	} finally {
		t.remove()
		if (prev instanceof HTMLElement) prev.focus()
	}
}

/** Copy text. Resolves true only when the browser reports the copy worked. */
export async function copyText(str: string): Promise<boolean> {
	if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(str)
			return true
		} catch {
			// Refused (permissions, no focus, insecure context): try the old way below.
		}
	}
	return legacyCopy(str)
}
