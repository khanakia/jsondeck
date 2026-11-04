import { presetLabel, useLabels } from "@/lib/labels"
import type { DateRange } from "react-day-picker"
import { ArrowRight, Calendar as CalendarIcon } from "lucide-react"
import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { DateRangeValue } from "../../types"
import { datePresets, rangeToValue, valueToRange } from "./datePresets"
import type { ControlProps } from "./types"

type Props = ControlProps<DateRangeValue | undefined> & {
	showPresets?: boolean | undefined
}

const fmtDate = (d: Date | undefined) =>
	d
		? d.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: ""

type Step = "awaiting-from" | "awaiting-to"

export function DateRangeControl({
	value,
	onChange,
	onCommit,
	showPresets = true,
}: Props) {
	const L = useLabels()
	// Local in-progress range. Separate from `value` so first-click
	// doesn't trigger an upstream commit (which would close the popover).
	const initial = valueToRange(value)
	const [pending, setPending] = React.useState<{
		from: Date | undefined
		to: Date | undefined
	}>({ from: initial.from, to: initial.to })

	// Explicit click-step tracking, because react-day-picker v9 sometimes
	// returns { from: X, to: X } on the FIRST click (treating single click
	// as a complete same-day range) — we don't want to commit then.
	const [step, setStep] = React.useState<Step>(() =>
		initial.from && initial.to ? "awaiting-from" : "awaiting-to",
	)

	const [defaultMonth] = React.useState(() => initial.from ?? new Date())

	const handlePreset = (presetId: string) => {
		const preset = datePresets.find((p) => p.id === presetId)
		if (!preset) return
		const r = preset.range()
		setPending({ from: r.from, to: r.to })
		setStep("awaiting-from")
		const next = rangeToValue(r, presetId)
		onChange(next)
		onCommit?.(next)
	}

	const handleSelect = (
		_r: DateRange | undefined,
		triggerDate: Date,
	) => {
		// We ignore v9's `r` interpretation and drive selection from the
		// single date the user actually clicked + our explicit step state.
		if (step === "awaiting-from") {
			// First click — record `from`, wait for second click
			setPending({ from: triggerDate, to: undefined })
			setStep("awaiting-to")
			return
		}

		// Second click — complete the range (ordering both ends)
		const from = pending.from
		if (!from) {
			// Defensive: shouldn't happen, but if it does, treat as new start
			setPending({ from: triggerDate, to: undefined })
			setStep("awaiting-to")
			return
		}

		const a = from
		const b = triggerDate
		const earlier = a < b ? a : b
		const later = a < b ? b : a

		setPending({ from: earlier, to: later })
		setStep("awaiting-from")

		const next: DateRangeValue = {
			from: earlier.toISOString(),
			to: later.toISOString(),
			preset: null,
		}
		onChange(next)
		onCommit?.(next)
	}

	return (
		<div className="jd:flex">
			{showPresets && (
				<div className="jd:w-32 jd:shrink-0 jd:border-r jd:p-1.5">
					<div className="jd:flex jd:flex-col jd:gap-0.5">
						{datePresets.map((p) => (
							<button
								key={p.id}
								type="button"
								onClick={() => handlePreset(p.id)}
								className={cn(
									"jd:hover:bg-accent jd:rounded-sm jd:px-2 jd:py-1 jd:text-left jd:text-xs",
									value?.preset === p.id && "jd:bg-accent jd:font-medium",
								)}
							>
								{presetLabel(L, p.id, p.label)}
							</button>
						))}
					</div>
				</div>
			)}
			<div className="jd:flex jd:flex-col">
				{/* Read-out header */}
				<div className="jd:text-muted-foreground jd:flex jd:items-center jd:gap-2 jd:border-b jd:px-3 jd:py-2 jd:text-xs">
					<CalendarIcon className="jd:h-3.5 jd:w-3.5" />
					<span className={cn(pending.from && "jd:text-foreground jd:font-medium")}>
						{fmtDate(pending.from) || L.startDate}
					</span>
					<ArrowRight className="jd:h-3 jd:w-3" />
					<span className={cn(pending.to && "jd:text-foreground jd:font-medium")}>
						{fmtDate(pending.to) || L.endDate}
					</span>
				</div>
				<Calendar
					mode="range"
					selected={
						pending.from ? { from: pending.from, to: pending.to } : undefined
					}
					onSelect={handleSelect}
					numberOfMonths={2}
					defaultMonth={defaultMonth}
					autoFocus
				/>
			</div>
		</div>
	)
}
