import type { DateRangeValue, FilterFieldDef, FilterOperator } from "../types"
import { BooleanControl } from "./controls/BooleanControl"
import { DateControl } from "./controls/DateControl"
import { DateRangeControl } from "./controls/DateRangeControl"
import { MultiSelectControl } from "./controls/MultiSelectControl"
import { NumberControl } from "./controls/NumberControl"
import { NumberRangeControl } from "./controls/NumberRangeControl"
import {
	RelationControl,
	RelationMultiControl,
} from "./controls/RelationControl"
import { SelectControl } from "./controls/SelectControl"
import { TextControl } from "./controls/TextControl"

type Props<TWhere> = {
	field: FilterFieldDef<TWhere>
	operator: FilterOperator
	value: unknown
	onChange: (v: unknown) => void
	onCommit: (overrideValue?: unknown) => void
	/** Called by relation controls to report value→label mappings so the
	 *  parent can persist them on the FilterCondition (survives URL roundtrip). */
	onLabelsChange?: ((labels: Record<string, string>) => void) | undefined
}

/**
 * `in` / `notIn` operators take an array value — when a `select` or
 * `relation` field is paired with one of these operators, we render the
 * multi-pick control so users can stack values into an IN clause.
 */
const isMultiOperator = (op: FilterOperator) => op === "in" || op === "notIn"

/**
 * Renders the right control for the field's type. Used by both the
 * FilterPicker (new filter flow) and FilterValuePopover (pill edit).
 *
 * For `select` / `relation` fields, the operator decides whether the
 * control renders as single-pick (`eq`/`neq`) or multi-pick (`in`/`notIn`).
 */
export function ControlSwitch<TWhere>({
	field,
	operator,
	value,
	onChange,
	onCommit,
	onLabelsChange,
}: Props<TWhere>) {
	switch (field.type) {
		case "text":
			return (
				<TextControl
					autoFocus
					operator={operator}
					value={(value as string) ?? ""}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
				/>
			)
		case "number":
			if (operator === "between")
				return (
					<NumberRangeControl
						autoFocus
						operator={operator}
						value={Array.isArray(value) ? [value[0] ?? "", value[1] ?? ""] : ["", ""]}
						onChange={(v) => onChange(v)}
						onCommit={(v) => onCommit(v)}
					/>
				)
			return (
				<NumberControl
					autoFocus
					operator={operator}
					value={(value as number | string) ?? ""}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
				/>
			)
		case "boolean":
			return (
				<BooleanControl
					operator={operator}
					value={value as boolean | undefined}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
					trueLabel={field.trueLabel}
					falseLabel={field.falseLabel}
				/>
			)
		case "select":
			// Operator determines single vs multi.
			if (isMultiOperator(operator)) {
				return (
					<MultiSelectControl
						operator={operator}
						value={(value as string[]) ?? []}
						onChange={(v) => onChange(v)}
						onCommit={(v) => onCommit(v)}
						options={field.options}
					/>
				)
			}
			return (
				<SelectControl
					operator={operator}
					value={value as string | undefined}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
					options={field.options}
				/>
			)
		case "multi-select":
			return (
				<MultiSelectControl
					operator={operator}
					value={(value as string[]) ?? []}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
					options={field.options}
				/>
			)
		case "relation":
			// Operator determines single vs multi.
			if (isMultiOperator(operator)) {
				return (
					<RelationMultiControl
						operator={operator}
						value={(value as string[]) ?? []}
						onChange={(v) => onChange(v)}
						onCommit={(v) => onCommit(v)}
						loadOptions={field.loadOptions}
						searchPlaceholder={field.searchPlaceholder}
						onLabelsChange={onLabelsChange}
					/>
				)
			}
			return (
				<RelationControl
					operator={operator}
					value={value as string | undefined}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
					loadOptions={field.loadOptions}
					searchPlaceholder={field.searchPlaceholder}
					onLabelsChange={onLabelsChange}
				/>
			)
		case "relation-multi":
			return (
				<RelationMultiControl
					operator={operator}
					value={(value as string[]) ?? []}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
					loadOptions={field.loadOptions}
					searchPlaceholder={field.searchPlaceholder}
					onLabelsChange={onLabelsChange}
				/>
			)
		case "date":
			return (
				<DateControl
					operator={operator}
					value={value as string | undefined}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
				/>
			)
		case "date-range":
			// Before / after one day uses the single-date picker.
			if (operator === "lt" || operator === "gt")
				return (
					<DateControl
						operator={operator}
						value={typeof value === "string" ? value : undefined}
						onChange={(v) => onChange(v)}
						onCommit={(v) => onCommit(v)}
					/>
				)
			return (
				<DateRangeControl
					operator={operator}
					value={value as DateRangeValue | undefined}
					onChange={(v) => onChange(v)}
					onCommit={(v) => onCommit(v)}
					showPresets={field.showPresets}
				/>
			)
	}
}

/** Default value to seed when adding a new filter of this type/operator pair.
 *  select/relation default to single (undefined); when paired with in/notIn,
 *  they default to an empty array so the multi-pick control renders correctly. */
export function defaultValueForType(
	type: FilterFieldDef<unknown>["type"],
	operator?: FilterOperator,
): unknown {
	switch (type) {
		case "text":
		case "number":
			return ""
		case "multi-select":
		case "relation-multi":
			return []
		case "select":
		case "relation":
			return operator && isMultiOperator(operator) ? [] : undefined
		default:
			return undefined
	}
}

/** Whether this field type requires an explicit Apply button (no auto-commit).
 *  For select/relation, also true when the operator is multi (in/notIn). */
export function needsApplyButton(
	type: FilterFieldDef<unknown>["type"],
	operator?: FilterOperator,
): boolean {
	if (
		type === "text" ||
		type === "number" ||
		type === "multi-select" ||
		type === "relation-multi" ||
		type === "date-range"
	) {
		return true
	}
	// select/relation with in/notIn → multi UI → needs Apply
	if (
		(type === "select" || type === "relation") &&
		operator &&
		isMultiOperator(operator)
	) {
		return true
	}
	return false
}
