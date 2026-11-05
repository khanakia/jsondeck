/**
 * Tiny toast stack. `toast(msg)` works from anywhere (no React context): it
 * writes to a module-level store, and every mounted <Toaster /> renders it
 * through useSyncExternalStore. One <Toaster /> per page, mounted on the first
 * toast (ensureToaster). An on-demand chunk: callers use toast-api.ts, which
 * loads this module the first time a toast is shown.
 * Bottom-centre, auto-hides, announced politely to screen readers.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { createRoot } from "react-dom/client"
import { usePageTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

export const TOAST_KINDS = ["default", "success", "error"] as const
export type ToastKind = (typeof TOAST_KINDS)[number]
export type ToastItem = { id: number; message: string; kind: ToastKind }
export type ToastOptions = { kind?: ToastKind | undefined; duration?: number | undefined }

/** How long a toast stays, in ms. */
export const TOAST_DURATION_MS = 1800
/** At most this many on screen; older ones drop off first. */
const MAX_TOASTS = 3
/** Same overlay layer as menus and tooltips. */
const TOAST_Z = 2147483002

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function emit(next: ToastItem[]) {
	items = next // a new array each time, so useSyncExternalStore sees the change
	for (const l of listeners) l()
}

/** Remove one toast now. */
export function dismissToast(id: number): void {
	const t = timers.get(id)
	if (t) clearTimeout(t)
	timers.delete(id)
	emit(items.filter((i) => i.id !== id))
}

/** Show a message. Returns its id (for dismissToast). */
export function toast(message: string, opts: ToastOptions = {}): number {
	const id = nextId++
	const kept = items.slice(-(MAX_TOASTS - 1))
	for (const old of items) if (!kept.includes(old)) dismissTimer(old.id)
	emit([...kept, { id, message, kind: opts.kind ?? "default" }])
	timers.set(id, setTimeout(() => dismissToast(id), opts.duration ?? TOAST_DURATION_MS))
	return id
}

function dismissTimer(id: number) {
	const t = timers.get(id)
	if (t) clearTimeout(t)
	timers.delete(id)
}

function subscribe(l: () => void): () => void {
	listeners.add(l)
	return () => listeners.delete(l)
}
const getSnapshot = () => items
const EMPTY: ToastItem[] = []
const getServerSnapshot = () => EMPTY

/** Read the store from React (exported for custom renderers). */
export function useToasts(): ToastItem[] {
	return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function Toaster() {
	const list = useToasts()
	const dark = usePageTheme() === "dark"
	if (typeof document === "undefined") return null
	return createPortal(
		<div
			className={cn("jd-root", dark && "jd-dark")}
			style={{ position: "fixed", left: "50%", bottom: 16, transform: "translateX(-50%)", zIndex: TOAST_Z, background: "transparent" }}
			role="status"
			aria-live="polite"
			data-jd="toaster"
		>
			<div className="jd:flex jd:flex-col jd:items-center jd:gap-1.5">
				{list.map((t) => (
					<div
						key={t.id}
						className={cn(
							"jd:flex jd:max-w-[min(28rem,calc(100vw-2rem))] jd:items-center jd:gap-2 jd:rounded-md jd:border jd:border-border jd:bg-popover jd:px-3 jd:py-1.5 jd:text-[13px] jd:text-popover-foreground jd:shadow-md",
							t.kind === "error" && "jd:border-destructive/40 jd:text-destructive",
						)}
						data-jd="toast"
					>
						{t.kind === "success" && <span aria-hidden="true">✓</span>}
						<span className="jd:truncate">{t.message}</span>
					</div>
				))}
			</div>
		</div>,
		document.body,
	)
}

/** One toast host for the whole page, created on the first toast. */
let toasterMounted = false
export function ensureToaster(): void {
	if (toasterMounted || typeof document === "undefined") return
	toasterMounted = true
	const host = document.createElement("div")
	host.setAttribute("data-jd", "toaster-host")
	document.body.appendChild(host)
	createRoot(host).render(<Toaster />)
}
