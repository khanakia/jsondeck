/**
 * The resolved UI strings, handed to every component through context so
 * `config.labels` reaches the table parts too.
 */
import * as React from "react"
import { DEFAULT_LABELS, type Labels, PRESET_LABEL } from "../core/labels"
import type { FilterOperator } from "../sdt/types"

export const LabelsContext = React.createContext<Labels>(DEFAULT_LABELS)

export function useLabels(): Labels {
	return React.useContext(LabelsContext)
}

/** The label key of a filter operator ("op_contains" → "contains"). */
export function opKey(op: FilterOperator): `op_${FilterOperator}` {
	return `op_${op}`
}

/** A date preset's label, falling back to the preset's own text for unknown ids. */
export function presetLabel(L: Labels, id: string, fallback: string): string {
	const k = PRESET_LABEL[id]
	return k ? L[k] : fallback
}

/** An operator's label for a field type: dates read "before" / "after" instead of < / >. */
export function opLabel(L: Labels, op: FilterOperator, type?: string): string {
	if (type === "date" || type === "date-range") {
		if (op === "lt") return L.op_before
		if (op === "gt") return L.op_after
	}
	return L[opKey(op)]
}
