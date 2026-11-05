/**
 * `toast(message)` for the core: the toast stack and its host (Toast.tsx) are
 * an on-demand chunk, loaded and mounted the first time a toast is shown.
 * Toasts only follow a user action (a copy), so the few milliseconds the chunk
 * takes are not visible.
 */
import type { ToastOptions } from "./Toast"

export function toast(message: string, opts: ToastOptions = {}): void {
	import("./Toast").then(
		(m) => {
			m.ensureToaster()
			m.toast(message, opts)
		},
		(e: unknown) => console.error("[jsondeck] could not load a part of the page:", e),
	)
}
