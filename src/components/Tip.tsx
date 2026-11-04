/**
 * Toolbar polish: a small dark tooltip (label + key hint) that shows on hover
 * after a short delay and on keyboard focus, portalled to <body> on the
 * overlay z-layer so it sits above everything; plus the toolbar style switch
 * (icons only by default, `toolbarLabels: true` brings the text back) and the
 * count badge icon buttons carry.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { usePageTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/** Hover delay before a tooltip shows (focus shows at once). */
const SHOW_DELAY_MS = 350
/** Gap between the trigger and the tooltip. */
const GAP = 6
/** Same overlay layer as popups and the drawer, one above them. */
const TIP_Z = 2147483002

/** Icons only (default) or icons + text labels in the toolbar. */
export const ToolbarLabelsContext = React.createContext(false)
export function useToolbarLabels(): boolean {
	return React.useContext(ToolbarLabelsContext)
}

export function Tip({ label, hint, children }: { label: string; hint?: string | undefined; children: React.ReactNode }) {
	const ref = React.useRef<HTMLSpanElement>(null)
	const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
	const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null)
	const dark = usePageTheme() === "dark"
	const show = (delay: number) => {
		if (timer.current) clearTimeout(timer.current)
		timer.current = setTimeout(() => {
			const r = ref.current?.getBoundingClientRect()
			if (r) setPos({ x: r.left + r.width / 2, y: r.bottom + GAP })
		}, delay)
	}
	const hide = () => {
		if (timer.current) clearTimeout(timer.current)
		setPos(null)
	}
	React.useEffect(() => () => hide(), [])
	return (
		<span
			ref={ref}
			className="jd:inline-flex"
			onPointerEnter={() => show(SHOW_DELAY_MS)}
			onPointerLeave={hide}
			onPointerDown={hide}
			onFocus={() => show(0)}
			onBlur={hide}
		>
			{children}
			{pos &&
				typeof document !== "undefined" &&
				createPortal(
					<div
						role="tooltip"
						data-jd="tooltip"
						className={cn(
							"jd-root",
							dark && "jd-dark",
							"jd:pointer-events-none jd:fixed jd:flex jd:-translate-x-1/2 jd:items-center jd:gap-1.5 jd:whitespace-nowrap jd:rounded-md jd:bg-primary jd:px-2 jd:py-1 jd:text-xs jd:text-primary-foreground jd:shadow-sm",
						)}
						style={{ left: pos.x, top: pos.y, zIndex: TIP_Z }}
					>
						{label}
						{hint && <span className="jd:font-mono jd:text-[10px] jd:opacity-60">{hint.toUpperCase()}</span>}
					</div>,
					document.body,
				)}
		</span>
	)
}

/** Small count shown on an icon button (active filters, sort rules, hidden columns). */
export function CountBadge({ n }: { n: number }) {
	if (n <= 0) return null
	return (
		<span className="jd:absolute jd:-right-1 jd:-top-1 jd:inline-flex jd:h-3.5 jd:min-w-3.5 jd:items-center jd:justify-center jd:rounded-full jd:bg-primary jd:px-1 jd:text-[9px] jd:font-medium jd:leading-none jd:text-primary-foreground jd:tabular-nums" data-jd="count-badge">
			{n}
		</span>
	)
}

/** Classes for a square ghost icon button in the toolbar (relative, for the badge). */
export const ICON_BTN = "jd-toolbar-btn jd:relative jd:h-7 jd:w-7 jd:p-0 jd:text-muted-foreground jd:hover:text-foreground"
/** Classes when labels are on: a compact ghost button with text. */
export const LABEL_BTN = "jd:relative jd:h-7 jd:gap-1.5 jd:px-2 jd:text-xs"
