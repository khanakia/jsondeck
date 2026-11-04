import { useLabels } from "@/lib/labels"
import { Check, Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { FilterOption } from "../../types"
import type { ControlProps } from "./types"

type MultiSelectControlProps = ControlProps<string[]> & {
	options: FilterOption[]
	searchable?: boolean | undefined
}

export function MultiSelectControl({
	value,
	onChange,
	onCommit,
	options,
	searchable,
}: MultiSelectControlProps) {
	const L = useLabels()
	const [query, setQuery] = React.useState("")
	// Always show search when there are 4+ options.
	const showSearch = (searchable ?? options.length > 3) && options.length > 0
	const selected = value ?? []

	const filtered = React.useMemo(() => {
		if (!query) return options
		const q = query.toLowerCase()
		return options.filter((o) => o.label.toLowerCase().includes(q))
	}, [options, query])

	// useCallback so the memoized keydown handler below has a stable `toggle`
	// dependency (otherwise it'd be rebuilt on every render).
	const toggle = React.useCallback(
		(val: string) => {
			if (selected.includes(val)) {
				onChange(selected.filter((v) => v !== val))
			} else {
				onChange([...selected, val])
			}
		},
		[selected, onChange],
	)

	// Arrow nav: Space toggles the highlighted option, Enter applies.
	const nav = useListNavigation({
		count: filtered.length,
		onSelect: () => {
			// Enter → commit the current multi-selection.
			onCommit?.()
		},
		resetKey: query,
	})

	// Two handlers because Space means different things in different
	// focus contexts:
	//   • search input → spaces are part of multi-word queries like
	//     "iphone 17"; intercepting them here would block the user from
	//     typing. So this handler only forwards arrows / Enter / Esc.
	//   • list container (no search) → arrow-key navigation is the only
	//     way to move highlight, and Space-to-toggle is the standard
	//     listbox shortcut, so we intercept it.
	const handleInputKeyDown = nav.onKeyDown
	const handleListKeyDown = React.useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === " ") {
				e.preventDefault()
				const opt = filtered[nav.activeIndex]
				if (opt) toggle(opt.value)
				return
			}
			nav.onKeyDown(e)
		},
		[filtered, nav, toggle],
	)

	// Auto-focus the list container when there's no search input so
	// arrows + Space/Enter work immediately.
	const containerRef = React.useRef<HTMLDivElement>(null)
	// Snapshot showSearch so the mount-only focus doesn't re-fire on later
	// renders — a ref read keeps the empty dep list exhaustive.
	const showSearchRef = React.useRef(showSearch)
	React.useEffect(() => {
		if (!showSearchRef.current)
			containerRef.current?.focus({ preventScroll: true })
	}, [])

	return (
		<div className="jd:flex jd:flex-col">
			{showSearch && (
				<div className="jd:border-b jd:px-2 jd:py-1.5">
					<div className="jd:flex jd:items-center jd:gap-2">
						<Search className="jd:text-muted-foreground jd:h-3.5 jd:w-3.5" />
						<Input
							autoFocus
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder={L.searchOptions}
							className="jd:h-7 jd:border-0 jd:px-0 jd:shadow-none jd:focus-visible:ring-0"
							onKeyDown={handleInputKeyDown}
						/>
					</div>
				</div>
			)}
			<div
				ref={containerRef}
				role="listbox"
				aria-label="Options"
				aria-multiselectable="true"
				className="jd:max-h-64 jd:overflow-y-auto jd:p-1 jd:outline-none"
				tabIndex={showSearch ? -1 : 0}
				onKeyDown={showSearch ? undefined : handleListKeyDown}
			>
				{filtered.length === 0 ? (
					<div className="jd:text-muted-foreground jd:px-2 jd:py-3 jd:text-center jd:text-sm">
						{L.noOptions}
					</div>
				) : (
					filtered.map((opt, i) => {
						const Icon = opt.icon
						const isSelected = selected.includes(opt.value)
						const isActive = nav.activeIndex === i
						return (
							<button
								key={opt.value}
								ref={nav.getItemRef(i)}
								type="button"
								onClick={() => toggle(opt.value)}
								onMouseMove={() => nav.setActiveIndex(i)}
								className={cn(
									"jd:hover:bg-accent jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-1.5 jd:rounded-sm jd:px-2 jd:text-left jd:text-xs",
									isActive && "jd:bg-accent",
								)}
							>
								<span
									className={cn(
										"jd:border-input jd:flex jd:h-3 jd:w-3 jd:shrink-0 jd:items-center jd:justify-center jd:rounded-[3px] jd:border",
										isSelected && "jd:bg-primary jd:border-primary",
									)}
								>
									{isSelected && (
										<Check className="jd:text-primary-foreground jd:h-2 jd:w-2" />
									)}
								</span>
								{Icon && <Icon className="jd:h-3 jd:w-3" />}
								<span className="jd:flex-1 jd:truncate">{opt.label}</span>
							</button>
						)
					})
				)}
			</div>
			{/* Apply button is rendered by the parent (FilterPicker / FilterValuePopover)
          via needsApplyButton — only show selection count here. */}
			{selected.length > 0 && (
				<div className="jd:border-t jd:px-2 jd:py-1.5">
					<span className="jd:text-muted-foreground jd:text-xs">
						{selected.length} selected
					</span>
				</div>
			)}
		</div>
	)
}
