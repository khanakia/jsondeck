/**
 * On-demand modules for components. `deferred(() => import("./x"))` gives a
 * handle that loads the module once, on the first `load()`, and lets any
 * number of components re-render when it arrives (`use()`). Used for the Base
 * UI popups (menus, popovers, dialogs): their light stand-ins in
 * dropdown-menu.tsx, popover.tsx and dialog.tsx render the trigger as a plain
 * element, start the load on hover / focus / click, and swap in the real
 * component when the chunk is there.
 *
 * In the single-file build (jsondeck.full.js) the import is inlined, so the
 * same code resolves at once and never touches the network.
 */
import * as React from "react"

export type Deferred<M> = {
	/** Start loading (idempotent); resolves with the module. A failed load can be retried. */
	load: () => Promise<M>
	/** The module once loaded; re-renders the caller when it arrives. */
	use: () => M | null
}

export function deferred<M>(importer: () => Promise<M>): Deferred<M> {
	let mod: M | null = null
	let pending: Promise<M> | null = null
	const subscribers = new Set<() => void>()
	const subscribe = (cb: () => void) => {
		subscribers.add(cb)
		return () => {
			subscribers.delete(cb)
		}
	}
	const snapshot = () => mod
	const load = (): Promise<M> => {
		pending ??= importer().then(
			(m) => {
				mod = m
				for (const cb of subscribers) cb()
				return m
			},
			(e: unknown) => {
				// Network hiccup or a missing chunk: report it and let the next hover / click try again.
				pending = null
				console.error("[jsondeck] could not load a part of the page:", e)
				throw e
			},
		)
		return pending
	}
	return { load, use: () => React.useSyncExternalStore(subscribe, snapshot, snapshot) }
}

/** Starts a load and ignores the result (errors are already reported by `deferred`). */
export function preload<M>(d: Deferred<M>): void {
	d.load().catch(() => undefined)
}

/**
 * A component that renders `pick(module)` once the module is loaded and
 * nothing before (starting the load when it first renders). For the parts
 * that only render inside an open popup (items, content, titles), where the
 * module is already there, and for parts with no visible stand-in (filter
 * pills, an opened dialog).
 */
export function lazyPart<M, P extends object>(d: Deferred<M>, pick: (m: M) => (props: P) => React.ReactNode) {
	return function LazyPart(props: P) {
		const m = d.use()
		const loaded = m !== null
		React.useEffect(() => {
			if (!loaded) preload(d)
		}, [loaded])
		if (!m) return null
		const C = pick(m)
		return <C {...props} />
	}
}

/**
 * What a popup root shares with its trigger while the real component is not
 * loaded yet: whether the user already asked to open it (a click on the
 * stand-in) and whether the stand-in had keyboard focus, so the real trigger
 * can take both over the moment it mounts.
 */
type Handoff = { open: boolean; focus: boolean }
const HandoffContext = React.createContext<React.RefObject<Handoff> | null>(null)

/** Base UI roots also take a render function as children (payload API); the stand-in renders only plain children. */
type RootProps = { children?: React.ReactNode | ((...args: never[]) => React.ReactNode) }
type TriggerProps = { children?: React.ReactNode; ref?: React.Ref<HTMLButtonElement> | undefined }

/**
 * A popup Root + Trigger pair that loads on first use. Before the module is
 * there, the Root renders its children as they are and the Trigger renders its
 * child (the toolbar button) unchanged plus the handlers that start the load.
 * Hover and focus preload; a click (or a keyboard shortcut's `.click()`)
 * preloads and asks for the popup to open, which the real trigger replays as
 * a click once it mounts, so a cold first click still opens the popup.
 */
export function deferredRoot<M, R extends RootProps, T extends TriggerProps>(
	d: Deferred<M>,
	pickRoot: (m: M) => (props: R) => React.ReactNode,
	pickTrigger: (m: M) => (props: T) => React.ReactNode,
	haspopup: "menu" | "dialog",
) {
	function Root(props: R) {
		const m = d.use()
		const handoff = React.useRef<Handoff>({ open: false, focus: false })
		// Opened from code (a controlled `open`) before the chunk is there: load it now.
		const wantsOpen = "open" in props && props.open === true
		React.useEffect(() => {
			if (wantsOpen) preload(d)
		}, [wantsOpen])
		const RealRoot = m ? pickRoot(m) : null
		return <HandoffContext.Provider value={handoff}>{RealRoot ? <RealRoot {...props} /> : typeof props.children === "function" ? null : props.children}</HandoffContext.Provider>
	}

	function Trigger(props: T) {
		const m = d.use()
		const handoff = React.useContext(HandoffContext)
		const el = React.useRef<HTMLButtonElement | null>(null)
		React.useEffect(() => {
			const h = handoff?.current
			const node = el.current
			if (!m || !h || !node) return
			if (h.focus || h.open) node.focus()
			if (h.open) node.click()
			h.focus = false
			h.open = false
		}, [m, handoff])
		if (m) {
			const RealTrigger = pickTrigger(m)
			return <RealTrigger {...props} ref={mergeRefs(el, props.ref)} />
		}
		const child = props.children
		const stand = {
			"aria-haspopup": haspopup,
			"aria-expanded": false,
			onPointerEnter: () => preload(d),
			onFocus: () => {
				if (handoff) handoff.current.focus = true
				preload(d)
			},
			onBlur: () => {
				if (handoff) handoff.current.focus = false
			},
			onClick: () => {
				if (handoff) handoff.current.open = true
				preload(d)
			},
		}
		if (React.isValidElement<React.ButtonHTMLAttributes<HTMLButtonElement>>(child)) {
			const own = child.props
			return React.cloneElement(child, {
				...stand,
				onPointerEnter: (e: React.PointerEvent<HTMLButtonElement>) => {
					own.onPointerEnter?.(e)
					stand.onPointerEnter()
				},
				onFocus: (e: React.FocusEvent<HTMLButtonElement>) => {
					own.onFocus?.(e)
					stand.onFocus()
				},
				onBlur: (e: React.FocusEvent<HTMLButtonElement>) => {
					own.onBlur?.(e)
					stand.onBlur()
				},
				onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
					own.onClick?.(e)
					stand.onClick()
				},
			})
		}
		return (
			<button type="button" {...stand}>
				{child}
			</button>
		)
	}

	return { Root, Trigger }
}

function mergeRefs<E>(own: React.RefObject<E | null>, theirs: React.Ref<E> | undefined): React.RefCallback<E> {
	return (node) => {
		own.current = node
		if (typeof theirs === "function") theirs(node)
		else if (theirs) theirs.current = node
	}
}

/**
 * A whole control (trigger + popup + its logic) that lives in an on-demand
 * chunk, with a look-alike `Stand` (the same trigger button, no popup) shown
 * until the chunk is there. Hover or focus preloads; a click before the chunk
 * arrives is remembered and replayed on the real trigger once it mounts, so a
 * cold click (or a keyboard shortcut's `.click()`) still opens the popup.
 * A controlled `open: true` (e.g. the filter picker opened from a column
 * menu) also starts the load.
 *
 * The wrapper is a `display: contents` span, so it adds no box to the toolbar.
 */
export function deferredControl<M, P extends object>(d: Deferred<M>, pick: (m: M) => (props: P) => React.ReactNode, Stand: (props: P) => React.ReactNode) {
	return function DeferredControl(props: P) {
		const m = d.use()
		const box = React.useRef<HTMLSpanElement>(null)
		const handoff = React.useRef<Handoff>({ open: false, focus: false })
		// While the pointer rests on the stand-in, keep it (and its tooltip) until the user clicks or moves away.
		const [hovered, setHovered] = React.useState(false)
		const wantsOpen = "open" in props && props.open === true
		React.useEffect(() => {
			if (wantsOpen) preload(d)
		}, [wantsOpen])
		const swapped = m !== null && (!hovered || wantsOpen)
		React.useEffect(() => {
			const h = handoff.current
			const trigger = box.current?.querySelector("button")
			if (!swapped || !trigger) return
			if (h.focus || h.open) trigger.focus()
			if (h.open) trigger.click()
			h.focus = false
			h.open = false
		}, [swapped])
		const Real = swapped && m ? pick(m) : null
		return (
			<span
				ref={box}
				className="jd:contents"
				onPointerEnter={
					Real
						? undefined
						: () => {
								setHovered(true)
								preload(d)
							}
				}
				onPointerLeave={Real ? undefined : () => setHovered(false)}
				onFocus={
					Real
						? undefined
						: () => {
								handoff.current.focus = true
								preload(d)
							}
				}
				onBlur={
					Real
						? undefined
						: () => {
								handoff.current.focus = false
							}
				}
				onClickCapture={
					Real
						? undefined
						: () => {
								handoff.current.open = true
								setHovered(false)
								preload(d)
							}
				}
			>
				{Real ? <Real {...props} /> : <Stand {...props} />}
			</span>
		)
	}
}
