import type { FilterFieldType, FilterOperator } from "../types"

/** Value arity per operator: 0 = no value (e.g. isNull), 1 = single, 2 = range */
export const operatorArity: Record<FilterOperator, 0 | 1 | 2> = {
	eq: 1,
	neq: 1,
	contains: 1,
	notContains: 1,
	startsWith: 1,
	endsWith: 1,
	gt: 1,
	gte: 1,
	lt: 1,
	lte: 1,
	between: 2,
	in: 1,
	notIn: 1,
	isNull: 0,
	isNotNull: 0,
	is: 1,
	isNot: 1,
}

export const operatorLabel: Record<FilterOperator, string> = {
	eq: "is",
	neq: "is not",
	contains: "contains",
	notContains: "does not contain",
	startsWith: "starts with",
	endsWith: "ends with",
	gt: ">",
	gte: "≥",
	lt: "<",
	lte: "≤",
	between: "between",
	in: "is any of",
	notIn: "is none of",
	isNull: "is empty",
	isNotNull: "is not empty",
	is: "is",
	isNot: "is not",
}

/** Default operator allowlist per field type, in display order. */
export const defaultOperatorsForType: Record<
	FilterFieldType,
	FilterOperator[]
> = {
	text: [
		"contains",
		"notContains",
		"eq",
		"neq",
		"startsWith",
		"endsWith",
		"isNull",
		"isNotNull",
	],
	number: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "isNull", "isNotNull"],
	boolean: ["is"],
	select: ["eq", "neq", "in", "notIn"],
	"multi-select": ["in", "notIn"],
	relation: ["eq", "neq", "in", "notIn"],
	"relation-multi": ["in", "notIn"],
	date: ["eq", "gt", "gte", "lt", "lte"],
	// Dates: a range (with presets), or before / after one day.
	"date-range": ["between", "lt", "gt"],
}

/** The "smart default" — the most common operator picked auto on field select. */
export const smartDefaultOperator: Record<FilterFieldType, FilterOperator> = {
	text: "contains",
	number: "eq",
	boolean: "is",
	select: "in",
	"multi-select": "in",
	relation: "eq",
	"relation-multi": "in",
	date: "eq",
	"date-range": "between",
}

/** Resolve which operators to show for a given field. */
export function operatorsForField(
	type: FilterFieldType,
	override?: FilterOperator[],
): FilterOperator[] {
	if (override && override.length > 0) return override
	return defaultOperatorsForType[type]
}
