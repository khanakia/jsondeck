import type { FilterOperator } from "../../types";
export type ControlProps<TValue = unknown> = {
    operator: FilterOperator;
    value: TValue;
    onChange: (value: TValue) => void;
    /**
     * Called when the user signals "done" (Enter, button click).
     * Auto-commit controls (boolean, single-select) pass the new value here
     * because React state from the just-fired onChange hasn't propagated yet —
     * reading the closure value would be stale.
     */
    onCommit?: ((overrideValue?: TValue) => void) | undefined;
    autoFocus?: boolean | undefined;
};
