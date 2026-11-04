/**
 * Segmented tabs: a rounded pill of tabs, the active one a
 * raised chip. Used for every tab row (deck tabs, section tabs, page nav,
 * Preview | Code). Roving tabindex: arrow keys / Home / End move between
 * tabs; a visible focus ring. Scrolls sideways only, never wraps.
 */
import * as React from "react"
import { useClassNames } from "@/lib/classnames"
import { cn } from "@/lib/utils"

export type TabItem = {
	key: string
	label: React.ReactNode
	/** Small round count badge next to the label. */
	badge?: number | undefined
	/** Render as a link (page nav keeps working without JS and in new tabs). */
	href?: string | undefined
	/** Extra data-* attributes for the tab element. */
	attrs?: Record<string, string> | undefined
}

export function SegmentedTabs({
	items,
	value,
	onChange,
	surface = "page",
	label,
	className,
	dataJd,
}: {
	items: TabItem[]
	value: string
	onChange: (key: string) => void
	/** The pill is a shade darker on the page than inside a card, so it stays visible on both. */
	surface?: "page" | "card"
	label?: string | undefined
	className?: string | undefined
	dataJd?: string | undefined
}) {
	const refs = React.useRef<(HTMLElement | null)[]>([])
	const cls_ = useClassNames()
	const onKey = (e: React.KeyboardEvent, i: number) => {
		const last = items.length - 1
		const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1
		if (next < 0) return
		e.preventDefault()
		// Arrows only move between tabs: keep the table's own ←/→ paging from firing too.
		e.stopPropagation()
		const it = items[next]
		if (!it) return
		onChange(it.key)
		refs.current[next]?.focus()
	}
	return (
		<div
			role="tablist"
			data-jd-slot="tabs"
			aria-label={label}
			data-jd={dataJd}
			className={cn(
				"jd:inline-flex jd:max-w-full jd:items-center jd:gap-0.5 jd:overflow-x-auto jd:overflow-y-hidden jd:whitespace-nowrap jd:rounded-lg jd:p-[3px]",
				surface === "card" ? "jd:bg-tabs-card" : "jd:bg-tabs",
				cls_.tabs,
				className,
			)}
		>
			{items.map((it, i) => {
				const on = it.key === value
				const cls = cn(
					"jd:inline-flex jd:h-7 jd:shrink-0 jd:cursor-pointer jd:items-center jd:gap-1.5 jd:rounded-md jd:px-2.5 jd:text-[13px] jd:outline-none jd:transition-colors",
					"jd:focus-visible:ring-2 jd:focus-visible:ring-ring",
					on ? "jd:bg-card jd:text-foreground jd:font-medium" : "jd:text-muted-foreground jd:hover:text-foreground",
					cls_.tab,
					on && cls_.tabActive,
				)
				const content = (
					<>
						{it.label}
						{it.badge !== undefined && (
							<span className="jd:bg-tab-badge jd:text-foreground/80 jd:inline-flex jd:h-[18px] jd:min-w-[18px] jd:items-center jd:justify-center jd:rounded-full jd:px-1 jd:text-[11px] jd:font-normal jd:tabular-nums">
								{it.badge}
							</span>
						)}
					</>
				)
				const common = {
					role: "tab",
					"aria-selected": on,
					tabIndex: on ? 0 : -1,
					className: cls,
					onKeyDown: (e: React.KeyboardEvent) => onKey(e, i),
					...(it.attrs ?? {}),
				}
				return it.href ? (
					<a
						key={it.key}
						ref={(el) => {
							refs.current[i] = el
						}}
						href={it.href}
						aria-current={on ? "page" : undefined}
						onClick={(e) => {
							e.preventDefault()
							onChange(it.key)
						}}
						{...common}
					>
						{content}
					</a>
				) : (
					<button
						key={it.key}
						ref={(el) => {
							refs.current[i] = el
						}}
						type="button"
						onClick={() => onChange(it.key)}
						{...common}
					>
						{content}
					</button>
				)
			})}
		</div>
	)
}
