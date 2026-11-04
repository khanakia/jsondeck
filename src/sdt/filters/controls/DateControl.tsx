import { Calendar } from "@/components/ui/calendar"
import type { ControlProps } from "./types"

/** Single-date filter — picks a calendar day, value is ISO date string. */
export function DateControl({
	value,
	onChange,
	onCommit,
}: ControlProps<string | undefined>) {
	const selected = value ? new Date(value) : undefined

	return (
		<Calendar
			mode="single"
			selected={selected}
			onSelect={(date) => {
				if (!date) {
					onChange(undefined)
					return
				}
				const iso = date.toISOString()
				onChange(iso)
				onCommit?.(iso)
			}}
			autoFocus
		/>
	)
}
