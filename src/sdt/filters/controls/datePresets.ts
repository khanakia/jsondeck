import type { DateRangeValue } from "../../types"

export type DatePreset = {
	id: string
	label: string
	range: () => { from: Date; to: Date }
}

const startOfDay = (d: Date) => {
	const x = new Date(d)
	x.setHours(0, 0, 0, 0)
	return x
}
const endOfDay = (d: Date) => {
	const x = new Date(d)
	x.setHours(23, 59, 59, 999)
	return x
}
const addDays = (d: Date, n: number) => {
	const x = new Date(d)
	x.setDate(x.getDate() + n)
	return x
}
const startOfMonth = (d: Date) => {
	const x = new Date(d.getFullYear(), d.getMonth(), 1)
	return startOfDay(x)
}
const startOfQuarter = (d: Date) => {
	const q = Math.floor(d.getMonth() / 3)
	return startOfDay(new Date(d.getFullYear(), q * 3, 1))
}
const startOfYear = (d: Date) => startOfDay(new Date(d.getFullYear(), 0, 1))

export const datePresets: DatePreset[] = [
	{
		id: "today",
		label: "Today",
		range: () => {
			const now = new Date()
			return { from: startOfDay(now), to: endOfDay(now) }
		},
	},
	{
		id: "yesterday",
		label: "Yesterday",
		range: () => {
			const y = addDays(new Date(), -1)
			return { from: startOfDay(y), to: endOfDay(y) }
		},
	},
	{
		id: "last_7d",
		label: "Last 7 days",
		range: () => {
			const now = new Date()
			return { from: startOfDay(addDays(now, -6)), to: endOfDay(now) }
		},
	},
	{
		id: "last_30d",
		label: "Last 30 days",
		range: () => {
			const now = new Date()
			return { from: startOfDay(addDays(now, -29)), to: endOfDay(now) }
		},
	},
	{
		id: "mtd",
		label: "Month to date",
		range: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }),
	},
	{
		id: "qtd",
		label: "Quarter to date",
		range: () => ({
			from: startOfQuarter(new Date()),
			to: endOfDay(new Date()),
		}),
	},
	{
		id: "ytd",
		label: "Year to date",
		range: () => ({ from: startOfYear(new Date()), to: endOfDay(new Date()) }),
	},
]

export function getPresetById(id: string): DatePreset | undefined {
	return datePresets.find((p) => p.id === id)
}

export function rangeToValue(
	range: { from: Date; to: Date },
	presetId: string | null,
): DateRangeValue {
	return {
		from: range.from.toISOString(),
		to: range.to.toISOString(),
		preset: presetId,
	}
}

export function valueToRange(value: DateRangeValue | undefined): {
	from: Date | undefined
	to: Date | undefined
} {
	return {
		from: value?.from ? new Date(value.from) : undefined,
		to: value?.to ? new Date(value.to) : undefined,
	}
}

export function formatRangeLabel(value: DateRangeValue | undefined): string {
	if (!value?.from || !value.to) return ""
	if (value.preset) {
		const p = getPresetById(value.preset)
		if (p) return p.label
	}
	const fmt = (iso: string) =>
		new Date(iso).toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year: "numeric",
		})
	return `${fmt(value.from)} – ${fmt(value.to)}`
}
