import * as React from "react";
import type { FilterFieldDef, FilterOperator } from "../types";
type Props<TWhere> = {
    field: FilterFieldDef<TWhere>;
    initialOperator: FilterOperator;
    initialValue: unknown;
    /** When true, caller controls open state via `open`/`onOpenChange`. */
    controlled?: boolean | undefined;
    open?: boolean | undefined;
    onOpenChange?: ((open: boolean) => void) | undefined;
    trigger?: React.ReactNode | undefined;
    onApply: (cond: {
        operator: FilterOperator;
        value: unknown;
        labels?: Record<string, string> | undefined;
    }) => void;
    onCancel?: (() => void) | undefined;
};
/**
 * Standalone operator + value editor popover. Used to edit an existing
 * filter pill (the pill itself is the trigger).
 *
 * For the "new filter" flow, `FilterPicker` does the same job inline
 * within its own popover so it can show the field-picker first.
 */
export declare function FilterValuePopover<TWhere>({ field, initialOperator, initialValue, controlled, open: openProp, onOpenChange, trigger, onApply, onCancel, }: Props<TWhere>): React.JSX.Element;
export {};
