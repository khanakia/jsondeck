// The one handle for the on-demand "popups" chunk (src/popups.ts), shared by
// dropdown-menu.tsx, popover.tsx and dialog.tsx so the chunk loads once.
import { ensureProcessEnv } from "../lib/importmap"
import { deferred } from "./deferred"

export type Popups = typeof import("../popups")

export const popups = deferred(() => {
	// <script> build: Base UI comes from the CDN; start all its files now (no-op elsewhere, removed at build time).
	if (__JSONDECK_EXTERNALS__) {
		ensureProcessEnv() // synchronously, before any Base UI file can run
		void import("../externals/preload-popups").then((m) => m.preload())
	}
	return import("../popups")
})
