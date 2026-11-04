import { useLabels } from "@/lib/labels"
import { Check, Loader2, Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { FilterOption, LoadOptionsFn } from "../../types"
import type { ControlProps } from "./types"

type Mode = "single" | "multi"

type Props<TValue> = ControlProps<TValue> & {
	loadOptions: LoadOptionsFn
	mode: Mode
	searchPlaceholder?: string | undefined
	/** Render an item in the picker. Default: label only. */
	renderOption?: ((option: FilterOption) => React.ReactNode) | undefined
	/** Report value→label map so the parent can persist on the condition. */
	onLabelsChange?: ((labels: Record<string, string>) => void) | undefined
}

/**
 * Server-side combobox shared between single and multi relation pickers.
 * - 300ms debounced search query → calls loadOptions(query)
 * - Caches results per query string for the lifetime of the picker
 * - Single mode: click → onChange(value) + onCommit(value), closes picker
 * - Multi mode: click → toggle, Apply commits the array
 */
function RelationControlBase<TValue>({
	value,
	onChange,
	onCommit,
	loadOptions,
	mode,
	searchPlaceholder = "Search…",
	onLabelsChange,
}: Props<TValue>) {
	const L = useLabels()
	const [query, setQuery] = React.useState("")
	const [debounced, setDebounced] = React.useState("")
	const [options, setOptions] = React.useState<FilterOption[]>([])
	const [loading, setLoading] = React.useState(true)
	// Accumulates value→label as user picks options. Reported to parent via
	// onLabelsChange so labels can be persisted on the FilterCondition.
	const labelsRef = React.useRef<Record<string, string>>({})
	const cacheRef = React.useRef(new Map<string, FilterOption[]>())
	// In-flight promise map — dedupes concurrent requests for the same query
	// (handles React 18 StrictMode double-mount without double-fetching).
	const inflightRef = React.useRef(new Map<string, Promise<FilterOption[]>>())

	// Stable ref for loadOptions so the fetch effect only re-fires on
	// debounced query changes, not on identity changes of the callback
	// (e.g. when `useAdminClient()` creates a new GraphQLClient per render).
	const loadOptionsRef = React.useRef(loadOptions)
	loadOptionsRef.current = loadOptions

	// Debounce search query
	React.useEffect(() => {
		const t = setTimeout(() => setDebounced(query), 300)
		return () => clearTimeout(t)
	}, [query])

	// Fetch options on debounced change.
	React.useEffect(() => {
		let cancelled = false
		const cached = cacheRef.current.get(debounced)
		if (cached) {
			setOptions(cached)
			setLoading(false)
			return
		}
		setLoading(true)

		// Reuse an in-flight promise for the same query so React 18 StrictMode
		// double-mount sends only one network request.
		let promise = inflightRef.current.get(debounced)
		if (!promise) {
			promise = loadOptionsRef.current(debounced)
			inflightRef.current.set(debounced, promise)
			promise.finally(() => inflightRef.current.delete(debounced))
		}

		promise
			.then((opts) => {
				cacheRef.current.set(debounced, opts)
				if (cancelled) return
				setOptions(opts)
			})
			.catch(() => {
				if (cancelled) return
				setOptions([])
			})
			.finally(() => {
				if (cancelled) return
				setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [debounced])

	// TValue is a per-mode runtime shape the generic parameter can't encode:
	// `string` in single mode, `string[]` in multi. Read it via `unknown` (a
	// safe widening — no cast) and narrow by shape; `selectedValues` is the
	// multi-mode array (empty in single mode).
	const rawValue: unknown = value
	const selectedValues: string[] = Array.isArray(rawValue)
		? rawValue.map(String)
		: []

	// emit is the ONE irreducible bridge: producing the opaque generic TValue
	// from a concrete string / string[] has no safe assignment form (a plain
	// `as TValue` doesn't compile for an unconstrained generic), so the single
	// documented `as unknown as TValue` lives here and nowhere else.
	const emit = (next: string | string[], commit = false) => {
		const tv = next as unknown as TValue
		onChange(tv)
		if (commit) onCommit?.(tv)
	}

	const isSelected = (optValue: string) => {
		if (mode === "single") return rawValue === optValue
		return selectedValues.includes(optValue)
	}

	const handlePick = (opt: FilterOption) => {
		// Track the label for this value.
		labelsRef.current[opt.value] = opt.label
		onLabelsChange?.({ ...labelsRef.current })

		if (mode === "single") {
			emit(opt.value, true)
			return
		}
		// multi: toggle
		const next = selectedValues.includes(opt.value)
			? selectedValues.filter((v) => v !== opt.value)
			: [...selectedValues, opt.value]
		emit(next)
	}

	const selectedCount = mode === "multi" ? selectedValues.length : 0

	// Arrow nav: in multi mode, Enter = apply (commit), Space = toggle.
	// In single mode, Enter = pick (already commits via handlePick).
	const nav = useListNavigation({
		count: options.length,
		onSelect: (i) => {
			// Enter in single mode → pick & commit. In multi mode this is
			// overridden by the keydown handler below (Enter → apply).
			if (mode === "single") {
				const opt = options[i]
				if (opt) handlePick(opt)
			} else {
				// Multi: Enter → commit the current selection.
				onCommit?.()
			}
		},
		resetKey: debounced,
	})

	// Forward keyboard nav (arrows + Enter + Esc) from the search input.
	// We deliberately do NOT intercept Space — the input must be able to
	// accept spaces in multi-word queries like "iphone 17". Toggling
	// individual options happens via mouse click; Enter commits the
	// current multi selection (handled by nav.onSelect above).
	const handleKeyDown = nav.onKeyDown

	return (
		<div className="jd:flex jd:flex-col">
			<div className="jd:border-b jd:px-2 jd:py-1.5">
				<div className="jd:flex jd:items-center jd:gap-2">
					<Search className="jd:text-muted-foreground jd:h-3.5 jd:w-3.5" />
					<Input
						autoFocus
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={searchPlaceholder}
						className="jd:h-7 jd:border-0 jd:px-0 jd:shadow-none jd:focus-visible:ring-0"
						onKeyDown={handleKeyDown}
					/>
					{loading && (
						<Loader2 className="jd:text-muted-foreground jd:h-3.5 jd:w-3.5 jd:animate-spin" />
					)}
				</div>
			</div>
			<div className="jd:max-h-64 jd:overflow-y-auto jd:p-1">
				{!loading && options.length === 0 ? (
					<div className="jd:text-muted-foreground jd:px-2 jd:py-3 jd:text-center jd:text-sm">
						{debounced ? L.noMatches : L.typeToSearch}
					</div>
				) : (
					options.map((opt, i) => {
						const Icon = opt.icon
						const isSel = isSelected(opt.value)
						const isActive = nav.activeIndex === i
						return (
							<button
								key={opt.value}
								ref={nav.getItemRef(i)}
								type="button"
								onClick={() => handlePick(opt)}
								onMouseMove={() => nav.setActiveIndex(i)}
								className={cn(
									"jd:hover:bg-accent jd:flex jd:w-full jd:items-center jd:gap-2 jd:rounded-sm jd:px-2 jd:py-1.5 jd:text-left jd:text-sm",
									isActive && "jd:bg-accent",
								)}
							>
								{mode === "multi" ? (
									<span
										className={cn(
											"jd:border-input jd:flex jd:h-4 jd:w-4 jd:shrink-0 jd:items-center jd:justify-center jd:rounded-[3px] jd:border",
											isSel && "jd:bg-primary jd:border-primary",
										)}
									>
										{isSel && (
											<Check className="jd:text-primary-foreground jd:h-3 jd:w-3" />
										)}
									</span>
								) : null}
								{Icon && <Icon className="jd:h-4 jd:w-4" />}
								<span className="jd:flex-1 jd:truncate">{opt.label}</span>
								{mode === "single" && isSel && (
									<Check className="jd:h-3.5 jd:w-3.5" />
								)}
							</button>
						)
					})
				)}
			</div>
			{/* Apply button is rendered by the parent (FilterPicker / FilterValuePopover)
          via needsApplyButton — no need to duplicate it here. We only show the
          selection count as a hint. */}
			{mode === "multi" && selectedCount > 0 && (
				<div className="jd:border-t jd:px-2 jd:py-1.5">
					<span className="jd:text-muted-foreground jd:text-xs">
						{selectedCount} selected
					</span>
				</div>
			)}
		</div>
	)
}

export function RelationControl({
	value,
	onChange,
	onCommit,
	loadOptions,
	searchPlaceholder,
	onLabelsChange,
}: ControlProps<string | undefined> & {
	loadOptions: LoadOptionsFn
	searchPlaceholder?: string | undefined
	onLabelsChange?: ((labels: Record<string, string>) => void) | undefined
}) {
	return (
		<RelationControlBase
			mode="single"
			value={value}
			onChange={onChange}
			onCommit={onCommit}
			loadOptions={loadOptions}
			searchPlaceholder={searchPlaceholder}
			onLabelsChange={onLabelsChange}
			operator={"eq"}
		/>
	)
}

export function RelationMultiControl({
	value,
	onChange,
	onCommit,
	loadOptions,
	searchPlaceholder,
	onLabelsChange,
}: ControlProps<string[]> & {
	loadOptions: LoadOptionsFn
	searchPlaceholder?: string | undefined
	onLabelsChange?: ((labels: Record<string, string>) => void) | undefined
}) {
	return (
		<RelationControlBase
			mode="multi"
			value={value}
			onChange={onChange}
			onCommit={onCommit}
			loadOptions={loadOptions}
			onLabelsChange={onLabelsChange}
			searchPlaceholder={searchPlaceholder}
			operator={"in"}
		/>
	)
}
