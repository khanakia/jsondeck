import { CountBadge, ICON_BTN, LABEL_BTN, Tip, useToolbarLabels } from "../../components/Tip"
import { useLabels } from "@/lib/labels"
import {
	ArrowDown,
	ArrowDownUp,
	ArrowUp,
	ChevronDown,
	ChevronUp,
	Plus,
	X,
} from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../keyboard/useListNavigation"
import type { SortDirection, SortOption, SortRule } from "../types"

type Props = {
	options: SortOption[]
	value: SortRule[]
	onChange: (sort: SortRule[]) => void
}

/**
 * Multi-column sort dropdown.
 *
 * Active rules render at the top in priority order (1., 2., …).
 * Available fields render below — clicking one appends it as the
 * next-lowest priority. Up/down arrows navigate the entire list
 * (active + available); Enter toggles the highlighted item.
 *
 * Uses Popover (not base-ui Menu) so the unified arrow-key nav
 * driven by `useListNavigation` works across our mixed row types.
 */
export function SortDropdown({ options, value, onChange }: Props) {
	const L = useLabels()
	const withLabels = useToolbarLabels()
	const activeMap = React.useMemo(() => {
		const m = new Map<string, { rule: SortRule; index: number }>()
		value.forEach((rule, index) => {
			m.set(rule.fieldId, { rule, index })
		})
		return m
	}, [value])

	const active = value
	const available = options.filter((o) => !activeMap.has(o.fieldId))

	const primary = active[0]
	const primaryLabel = primary
		? options.find((o) => o.fieldId === primary.fieldId)?.label
		: undefined
	const Icon = primary
		? primary.direction === "asc"
			? ArrowUp
			: ArrowDown
		: ArrowDownUp

	const toggleDirection = (fieldId: string) => {
		onChange(
			value.map((r) =>
				r.fieldId === fieldId
					? { ...r, direction: r.direction === "asc" ? "desc" : "asc" }
					: r,
			),
		)
	}

	const removeRule = (fieldId: string) => {
		onChange(value.filter((r) => r.fieldId !== fieldId))
	}

	const addRule = (fieldId: string, dir: SortDirection = "asc") => {
		onChange([...value, { fieldId, direction: dir }])
	}

	const clearAll = () => onChange([])

	/** Move a rule up or down in the priority order (clamps at edges). */
	const moveRule = (fieldId: string, dir: -1 | 1) => {
		const i = value.findIndex((r) => r.fieldId === fieldId)
		if (i < 0) return
		const j = i + dir
		if (j < 0 || j >= value.length) return
		const next = [...value]
		const a = next[i]
		const b = next[j]
		if (!a || !b) return
		next[i] = b
		next[j] = a
		onChange(next)
	}

	// Flat list for arrow-key nav — interleaves active rules and available
	// options in the order they're displayed. Enter on an active rule
	// toggles its direction; Enter on an available field adds it.
	type FlatItem =
		| { kind: "active"; rule: SortRule; index: number }
		| { kind: "available"; opt: SortOption }
	const flat: FlatItem[] = React.useMemo(() => {
		const out: FlatItem[] = []
		active.forEach((rule, index) => {
			out.push({ kind: "active", rule, index })
		})
		for (const opt of available) out.push({ kind: "available", opt })
		return out
	}, [active, available])

	const nav = useListNavigation({
		count: flat.length,
		onSelect: (i) => {
			const item = flat[i]
			if (!item) return
			if (item.kind === "active") {
				toggleDirection(item.rule.fieldId)
			} else {
				addRule(item.opt.fieldId, item.opt.directions?.[0] ?? "asc")
			}
		},
		// Reset highlight when the underlying list shape changes
		resetKey: `${active.length}:${available.length}`,
	})

	return (
		<Popover>
			<Tip label={primary ? `${L.sort}: ${primaryLabel ?? primary.fieldId} ${primary.direction === "asc" ? "↑" : "↓"}` : L.sort} hint="s">
				<PopoverTrigger asChild>
					<Button variant="ghost" size="sm" aria-label={L.sort} data-jd-sort-trigger="true" className={withLabels ? LABEL_BTN : ICON_BTN}>
						<Icon className="jd:h-3.5 jd:w-3.5" />
						{withLabels && (primary ? `${primaryLabel ?? primary.fieldId} ${primary.direction === "asc" ? "↑" : "↓"}` : L.sort)}
						<CountBadge n={active.length} />
					</Button>
				</PopoverTrigger>
			</Tip>
			<PopoverContent
				align="end"
				className="jd:min-w-56 jd:p-0.5"
				// Capture arrow keys at the popover root so navigation works
				// regardless of which child is focused.
				onKeyDown={nav.onKeyDown}
			>
				{active.length === 0 && available.length === 0 ? (
					<div className="jd:text-muted-foreground jd:px-2 jd:py-3 jd:text-center jd:text-xs">
						{L.noSortable}
					</div>
				) : null}

				{(() => {
					let i = -1
					return (
						<>
							{active.length > 0 && (
								<ul className="jd:flex jd:flex-col">
									{active.map((rule) => {
										i += 1
										const idx = i
										const isActive = nav.activeIndex === idx
										const opt = options.find((o) => o.fieldId === rule.fieldId)
										return (
											<li
												key={rule.fieldId}
												ref={nav.getItemRef(idx)}
												onMouseMove={() => nav.setActiveIndex(idx)}
												className={cn(
													"jd:hover:bg-accent jd:flex jd:h-7 jd:items-center jd:gap-1.5 jd:rounded-sm jd:px-2 jd:text-xs",
													isActive && "jd:bg-accent",
												)}
											>
												<span className="jd:text-muted-foreground jd:w-3 jd:shrink-0 jd:tabular-nums">
													{idx + 1}
												</span>
												{/* Reorder priority — visible only when there's
                            more than one active rule so it doesn't add
                            clutter for the single-sort case. */}
												{active.length > 1 && (
													<span className="jd:flex jd:flex-col jd:-my-1">
														<button
															type="button"
															tabIndex={-1}
															onClick={(e) => {
																e.stopPropagation()
																moveRule(rule.fieldId, -1)
															}}
															disabled={idx === 0}
															className="jd:text-muted-foreground jd:hover:text-foreground jd:inline-flex jd:h-3 jd:w-3 jd:items-center jd:justify-center jd:rounded jd:outline-none jd:disabled:opacity-30"
															aria-label="Move up"
														>
															<ChevronUp className="jd:h-2.5 jd:w-2.5" />
														</button>
														<button
															type="button"
															tabIndex={-1}
															onClick={(e) => {
																e.stopPropagation()
																moveRule(rule.fieldId, 1)
															}}
															disabled={idx === active.length - 1}
															className="jd:text-muted-foreground jd:hover:text-foreground jd:inline-flex jd:h-3 jd:w-3 jd:items-center jd:justify-center jd:rounded jd:outline-none jd:disabled:opacity-30"
															aria-label="Move down"
														>
															<ChevronDown className="jd:h-2.5 jd:w-2.5" />
														</button>
													</span>
												)}
												<button
													type="button"
													onClick={() => toggleDirection(rule.fieldId)}
													className="jd:flex-1 jd:truncate jd:text-left jd:outline-none"
													// Skip in tab order — arrow keys drive selection
													tabIndex={-1}
												>
													{opt?.label ?? rule.fieldId}
												</button>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation()
														toggleDirection(rule.fieldId)
													}}
													className="jd:text-muted-foreground jd:hover:text-foreground jd:inline-flex jd:h-5 jd:w-5 jd:items-center jd:justify-center jd:rounded"
													aria-label="Toggle direction"
													tabIndex={-1}
												>
													{rule.direction === "asc" ? (
														<ArrowUp className="jd:h-3 jd:w-3" />
													) : (
														<ArrowDown className="jd:h-3 jd:w-3" />
													)}
												</button>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation()
														removeRule(rule.fieldId)
													}}
													className="jd:text-muted-foreground jd:hover:text-destructive jd:inline-flex jd:h-5 jd:w-5 jd:items-center jd:justify-center jd:rounded"
													aria-label="Remove sort"
													tabIndex={-1}
												>
													<X className="jd:h-3 jd:w-3" />
												</button>
											</li>
										)
									})}
								</ul>
							)}

							{active.length > 0 && available.length > 0 && (
								<div className="jd:bg-border jd:my-0.5 jd:h-px" />
							)}

							{available.length > 0 && (
								<div className="jd:flex jd:flex-col">
									<div className="jd:text-muted-foreground jd:px-2 jd:pb-1 jd:pt-1.5 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">
										{active.length > 0 ? L.addSort : L.sortBy}
									</div>
									{available.map((opt) => {
										i += 1
										const idx = i
										const isActive = nav.activeIndex === idx
										const dirs: SortDirection[] = opt.directions ?? [
											"asc",
											"desc",
										]
										return (
											// Layout row (no handlers → no static-interaction lint). The
											// label and each direction are real <button>s as siblings, so
											// none is nested inside another interactive element.
											<div
												key={opt.fieldId}
												className={cn(
													"jd:hover:bg-accent jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-1.5 jd:rounded-sm jd:px-2 jd:text-xs",
													isActive && "jd:bg-accent",
												)}
											>
												<button
													type="button"
													ref={nav.getItemRef(idx)}
													onMouseMove={() => nav.setActiveIndex(idx)}
													onClick={() => addRule(opt.fieldId, dirs[0] ?? "asc")}
													// Arrow-key driven; don't snare Tab focus or ring.
													tabIndex={-1}
													className="jd:flex jd:min-w-0 jd:flex-1 jd:items-center jd:gap-1.5 jd:text-left jd:outline-none"
												>
													<Plus className="jd:text-muted-foreground jd:h-2.5 jd:w-2.5 jd:shrink-0" />
													<span className="jd:flex-1 jd:truncate">{opt.label}</span>
												</button>
												{dirs.length > 1 && (
													<span className="jd:text-muted-foreground jd:flex jd:items-center jd:gap-0.5">
														<button
															type="button"
															tabIndex={-1}
															onClick={() => addRule(opt.fieldId, "asc")}
															className="jd:hover:text-foreground jd:inline-flex jd:h-5 jd:w-5 jd:items-center jd:justify-center jd:rounded"
															aria-label="Add ascending"
														>
															<ArrowUp className="jd:h-3 jd:w-3" />
														</button>
														<button
															type="button"
															tabIndex={-1}
															onClick={() => addRule(opt.fieldId, "desc")}
															className="jd:hover:text-foreground jd:inline-flex jd:h-5 jd:w-5 jd:items-center jd:justify-center jd:rounded"
															aria-label="Add descending"
														>
															<ArrowDown className="jd:h-3 jd:w-3" />
														</button>
													</span>
												)}
											</div>
										)
									})}
								</div>
							)}

							{active.length > 1 && (
								<>
									<div className="jd:bg-border jd:my-0.5 jd:h-px" />
									<button
										type="button"
										onClick={clearAll}
										className="jd:hover:bg-accent jd:text-muted-foreground jd:hover:text-foreground jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-1.5 jd:rounded-sm jd:px-2 jd:text-xs"
									>
										<X className="jd:h-2.5 jd:w-2.5" />
										{L.clearAll}
									</button>
								</>
							)}
						</>
					)
				})()}
			</PopoverContent>
		</Popover>
	)
}
