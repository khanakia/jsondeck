import type { FilterFieldType, FilterOperator } from "../types";
/** Value arity per operator: 0 = no value (e.g. isNull), 1 = single, 2 = range */
export declare const operatorArity: Record<FilterOperator, 0 | 1 | 2>;
export declare const operatorLabel: Record<FilterOperator, string>;
/** Default operator allowlist per field type, in display order. */
export declare const defaultOperatorsForType: Record<FilterFieldType, FilterOperator[]>;
/** The "smart default" — the most common operator picked auto on field select. */
export declare const smartDefaultOperator: Record<FilterFieldType, FilterOperator>;
/** Resolve which operators to show for a given field. */
export declare function operatorsForField(type: FilterFieldType, override?: FilterOperator[]): FilterOperator[];
