import type { FilterFieldDef, FilterOperator } from "../types";
type Props<TWhere> = {
    field: FilterFieldDef<TWhere>;
    operator: FilterOperator;
    value: unknown;
    onChange: (v: unknown) => void;
    onCommit: (overrideValue?: unknown) => void;
    /** Called by relation controls to report value→label mappings so the
     *  parent can persist them on the FilterCondition (survives URL roundtrip). */
    onLabelsChange?: ((labels: Record<string, string>) => void) | undefined;
};
/**
 * Renders the right control for the field's type. Used by both the
 * FilterPicker (new filter flow) and FilterValuePopover (pill edit).
 *
 * For `select` / `relation` fields, the operator decides whether the
 * control renders as single-pick (`eq`/`neq`) or multi-pick (`in`/`notIn`).
 */
export declare function ControlSwitch<TWhere>({ field, operator, value, onChange, onCommit, onLabelsChange, }: Props<TWhere>): import("react").JSX.Element;
/** Default value to seed when adding a new filter of this type/operator pair.
 *  select/relation default to single (undefined); when paired with in/notIn,
 *  they default to an empty array so the multi-pick control renders correctly. */
export declare function defaultValueForType(type: FilterFieldDef<unknown>["type"], operator?: FilterOperator): unknown;
/** Whether this field type requires an explicit Apply button (no auto-commit).
 *  For select/relation, also true when the operator is multi (in/notIn). */
export declare function needsApplyButton(type: FilterFieldDef<unknown>["type"], operator?: FilterOperator): boolean;
export {};
