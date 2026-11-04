/**
 * Right-click menu. Presentational: items in, `onSelect` / `onClose` out; it
 * knows nothing about tables. Portalled to <body> on the overlay layer (with
 * the jd-root class and the page theme, so tokens and the scoped reset apply),
 * kept inside the viewport (flips near the right / bottom edge).
 *
 * Keyboard: ↑/↓ (skip separators and disabled), Home/End, Enter/Space, → opens
 * a submenu, ← closes it, Esc closes everything, typing jumps to a label.
 * Closes on an outside pointer-down, any scroll, a resize, or Esc.
 *
 * Keys are read by a capture listener on the document (the deepest open
 * level owns them), not through focus: a right-click's own mouse-up can move
 * focus to <body> right after the menu opens. Handled keys are stopped, so
 * the table's shortcuts (← → pagination, / search) do not also fire.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { usePageTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

export type MenuAction = {
	label: string
	icon?: React.ReactNode | undefined
	/** Key hint shown muted on the right (display only; the caller binds the key). */
	kbd?: string | undefined
	onSelect: () => void
	disabled?: boolean | undefined
	danger?: boolean | undefined
}
export type MenuSeparator = { separator: true }
export type MenuSubmenu = {
	label: string
	icon?: React.ReactNode | undefined
	submenu: MenuItem[]
	disabled?: boolean | undefined
}
export type MenuItem = MenuAction | MenuSeparator | MenuSubmenu

export type ContextMenuProps = {
	/** Viewport coordinates (clientX / clientY of the contextmenu event). */
	x: number
	y: number
	items: MenuItem[]
	onClose: () => void
	/** Accessible name of the menu. */
	label?: string | undefined
}

/** Same overlay layer as Tip: above popups and the drawer. */
const MENU_Z = 2147483002
/** Keep this far from the viewport edge. */
const EDGE = 4
/** Typeahead buffer resets after this pause. */
const TYPEAHEAD_MS = 600

const isSeparator = (i: MenuItem): i is MenuSeparator => "separator" in i
const isSubmenu = (i: MenuItem): i is MenuSubmenu => "submenu" in i
const isEnabled = (i: MenuItem) => !isSeparator(i) && !i.disabled

/** Next enabled index from `from` in direction `dir`, wrapping; -1 when none. */
function step(items: MenuItem[], from: number, dir: 1 | -1): number {
	const n = items.length
	for (let k = 1; k <= n; k++) {
		const i = (((from + dir * k) % n) + n) % n
		const it = items[i]
		if (it && isEnabled(it)) return i
	}
	return -1
}

export function ContextMenu({ x, y, items, onClose, label }: ContextMenuProps) {
	const dark = usePageTheme() === "dark"
	const rootRef = React.useRef<HTMLDivElement>(null)

	React.useEffect(() => {
		const prev = document.activeElement
		const outside = (e: PointerEvent) => {
			const t = e.target
			if (t instanceof Node && rootRef.current?.contains(t)) return
			onClose()
		}
		const close = () => onClose()
		document.addEventListener("pointerdown", outside, true)
		window.addEventListener("scroll", close, true)
		window.addEventListener("resize", close)
		window.addEventListener("blur", close)
		return () => {
			document.removeEventListener("pointerdown", outside, true)
			window.removeEventListener("scroll", close, true)
			window.removeEventListener("resize", close)
			window.removeEventListener("blur", close)
			// Give focus back to whatever had it before the menu opened.
			if (prev instanceof HTMLElement) prev.focus()
		}
	}, [onClose])

	if (typeof document === "undefined") return null
	return createPortal(
		<div ref={rootRef} className={cn("jd-root", dark && "jd-dark")} style={{ position: "fixed", inset: 0, width: 0, height: 0, background: "transparent", zIndex: MENU_Z }} data-jd="context-menu">
			<MenuPanel items={items} x={x} y={y} onClose={onClose} label={label} />
		</div>,
		document.body,
	)
}

type PanelProps = {
	items: MenuItem[]
	x: number
	y: number
	/** Submenus: the parent item's box, so the panel can flip to its left side. */
	parentRect?: DOMRect | undefined
	onClose: () => void
	/** Submenus: close just this level (←). */
	onBack?: (() => void) | undefined
	label?: string | undefined
}

function MenuPanel({ items, x, y, parentRect, onClose, onBack, label }: PanelProps) {
	const ref = React.useRef<HTMLDivElement>(null)
	const itemRefs = React.useRef<(HTMLDivElement | null)[]>([])
	const [pos, setPos] = React.useState({ left: x, top: y, ready: false })
	const [active, setActive] = React.useState(() => step(items, -1, 1))
	const [openSub, setOpenSub] = React.useState<{ index: number; rect: DOMRect } | null>(null)
	const typed = React.useRef({ text: "", at: 0 })

	// Measure, then flip / clamp into the viewport before the first paint.
	React.useLayoutEffect(() => {
		const el = ref.current
		if (!el) return
		const w = el.offsetWidth
		const h = el.offsetHeight
		const vw = window.innerWidth
		const vh = window.innerHeight
		let left = x
		let top = y
		if (left + w > vw - EDGE) left = parentRect ? parentRect.left - w : x - w
		if (top + h > vh - EDGE) top = parentRect ? parentRect.bottom - h : y - h
		setPos({ left: Math.max(EDGE, Math.min(left, vw - w - EDGE)), top: Math.max(EDGE, Math.min(top, vh - h - EDGE)), ready: true })
		el.focus({ preventScroll: true })
	}, [x, y, parentRect])

	const openSubmenu = (i: number) => {
		const box = itemRefs.current[i]?.getBoundingClientRect()
		if (box) setOpenSub({ index: i, rect: box })
	}
	const activate = (i: number) => {
		const it = items[i]
		if (!it || !isEnabled(it) || isSeparator(it)) return
		if (isSubmenu(it)) return openSubmenu(i)
		onClose()
		it.onSelect()
	}

	const onKeyDown = (e: KeyboardEvent) => {
		const handled = () => {
			e.preventDefault()
			e.stopPropagation()
		}
		switch (e.key) {
			case "ArrowDown":
				handled()
				setActive((a) => step(items, a, 1))
				return
			case "ArrowUp":
				handled()
				setActive((a) => step(items, a < 0 ? 0 : a, -1))
				return
			case "Home":
				handled()
				setActive(step(items, -1, 1))
				return
			case "End":
				handled()
				setActive(step(items, items.length, -1))
				return
			case "Enter":
			case " ":
				handled()
				activate(active)
				return
			case "ArrowRight": {
				const it = items[active]
				handled()
				if (it && isSubmenu(it) && !it.disabled) openSubmenu(active)
				return
			}
			case "ArrowLeft":
				handled()
				onBack?.()
				return
			case "Escape":
				handled()
				onClose()
				return
		}
		// Typeahead: printable keys build a prefix and jump to the next matching label.
		if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
			handled()
			const now = Date.now()
			typed.current = { text: (now - typed.current.at > TYPEAHEAD_MS ? "" : typed.current.text) + e.key.toLowerCase(), at: now }
			const q = typed.current.text
			const n = items.length
			for (let k = 1; k <= n; k++) {
				const i = (((active + (q.length === 1 ? k : k - 1)) % n) + n) % n
				const it = items[i]
				if (it && isEnabled(it) && !isSeparator(it) && it.label.toLowerCase().startsWith(q)) {
					setActive(i)
					break
				}
			}
		}
	}

	// Only the deepest open level listens; the latest handler is read through a ref so the listener is not re-added per render.
	const keyRef = React.useRef(onKeyDown)
	React.useLayoutEffect(() => {
		keyRef.current = onKeyDown
	})
	React.useEffect(() => {
		if (openSub) return
		const h = (e: KeyboardEvent) => keyRef.current(e)
		document.addEventListener("keydown", h, true)
		return () => document.removeEventListener("keydown", h, true)
	}, [openSub])

	return (
		<>
			<div
				ref={ref}
				role="menu"
				aria-label={label}
				tabIndex={-1}
				onContextMenu={(e) => e.preventDefault()}
				className="jd:fixed jd:min-w-44 jd:max-w-80 jd:select-none jd:overflow-hidden jd:rounded-md jd:border jd:border-border jd:bg-popover jd:p-1 jd:text-[13px] jd:text-popover-foreground jd:shadow-md jd:outline-none"
				style={{ left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }}
				data-jd="menu"
			>
				{items.map((it, i) => {
					if (isSeparator(it)) return <div key={`sep${i}`} role="separator" className="jd:-mx-1 jd:my-1 jd:h-px jd:bg-border" />
					const sub = isSubmenu(it)
					const on = i === active
					return (
						<div
							key={`${it.label}${i}`}
							ref={(el) => {
								itemRefs.current[i] = el
							}}
							role="menuitem"
							aria-disabled={it.disabled || undefined}
							aria-haspopup={sub ? "menu" : undefined}
							aria-expanded={sub ? openSub?.index === i : undefined}
							data-active={on || undefined}
							className={cn(
								"jd:flex jd:h-7 jd:cursor-default jd:items-center jd:gap-2 jd:rounded-sm jd:px-2 jd:whitespace-nowrap",
								on && "jd:bg-accent jd:text-accent-foreground",
								it.disabled && "jd:pointer-events-none jd:opacity-50",
								!sub && it.danger && "jd:text-destructive",
							)}
							onPointerEnter={() => {
								if (!it.disabled) setActive(i)
								if (sub && !it.disabled) openSubmenu(i)
								else setOpenSub(null)
							}}
							onClick={() => activate(i)}
						>
							<span className="jd:flex jd:size-4 jd:shrink-0 jd:items-center jd:justify-center jd:text-muted-foreground">{it.icon}</span>
							<span className="jd:min-w-0 jd:flex-1 jd:truncate">{it.label}</span>
							{!sub && it.kbd && <kbd className="jd:ml-4 jd:text-[11px] jd:tracking-wide jd:text-muted-foreground">{it.kbd}</kbd>}
							{sub && (
								<svg viewBox="0 0 16 16" className="jd:ml-4 jd:size-3 jd:text-muted-foreground" aria-hidden="true">
									<path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							)}
						</div>
					)
				})}
			</div>
			{openSub &&
				(() => {
					const it = items[openSub.index]
					if (!it || !isSubmenu(it)) return null
					return (
						<MenuPanel
							key={openSub.index}
							items={it.submenu}
							x={openSub.rect.right + 2}
							y={openSub.rect.top - 5}
							parentRect={openSub.rect}
							onClose={onClose}
							onBack={() => {
								setOpenSub(null)
								ref.current?.focus({ preventScroll: true })
							}}
							label={it.label}
						/>
					)
				})()}
		</>
	)
}
