import { useLabels } from "@/lib/labels"
import { Check, Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { FilterOption } from "../../types"
import type { ControlProps } from "./types"

type SelectControlProps = ControlProps<string | undefined> & {
	options: FilterOption[]
	searchable?: boolean | undefined
}

export function SelectControl({
	value,
	onChange,
	onCommit,
	options,
	searchable,
}: SelectControlProps) {
	const L = useLabels()
	const [query, setQuery] = React.useState("")
	// Always show search when there are 4+ options (down from 7) so users
	// can filter even short lists; can also be forced via `searchable`.
	const showSearch = (searchable ?? options.length > 3) && options.length > 0

	const filtered = React.useMemo(() => {
		if (!query) return options
		const q = query.toLowerCase()
		return options.filter((o) => o.label.toLowerCase().includes(q))
	}, [options, query])

	const nav = useListNavigation({
		count: filtered.length,
		onSelect: (i) => {
			const opt = filtered[i]
			if (!opt) return
			onChange(opt.value)
			onCommit?.(opt.value)
		},
		resetKey: query,
	})

	// Auto-focus the list container when there's no search input so
	// arrow keys work immediately. With search, the input itself is
	// autoFocused and forwards keydowns to nav via onKeyDown.
	const containerRef = React.useRef<HTMLDivElement>(null)
	// Snapshot showSearch so the mount-only focus doesn't re-fire (and steal
	// focus) on later renders — a ref read keeps the empty dep list exhaustive.
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
							onKeyDown={nav.onKeyDown}
						/>
					</div>
				</div>
			)}
			{/* When there's no search input, the container catches arrow keys. */}
			<div
				ref={containerRef}
				role="listbox"
				aria-label="Options"
				className="jd:max-h-64 jd:overflow-y-auto jd:p-1 jd:outline-none"
				tabIndex={showSearch ? -1 : 0}
				onKeyDown={showSearch ? undefined : nav.onKeyDown}
			>
				{filtered.length === 0 ? (
					<div className="jd:text-muted-foreground jd:px-2 jd:py-3 jd:text-center jd:text-sm">
						{L.noOptions}
					</div>
				) : (
					filtered.map((opt, i) => {
						const Icon = opt.icon
						const isSelected = value === opt.value
						const isActive = nav.activeIndex === i
						return (
							<button
								key={opt.value}
								ref={nav.getItemRef(i)}
								type="button"
								onClick={() => {
									onChange(opt.value)
									onCommit?.(opt.value)
								}}
								onMouseMove={() => nav.setActiveIndex(i)}
								className={cn(
									"jd:hover:bg-accent jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-1.5 jd:rounded-sm jd:px-2 jd:text-left jd:text-xs",
									isActive && "jd:bg-accent",
									isSelected && !isActive && "jd:bg-accent/50",
								)}
							>
								{Icon && <Icon className="jd:h-3 jd:w-3" />}
								<span className="jd:flex-1 jd:truncate">{opt.label}</span>
								{isSelected && <Check className="jd:h-2.5 jd:w-2.5" />}
							</button>
						)
					})
				)}
			</div>
		</div>
	)
}
