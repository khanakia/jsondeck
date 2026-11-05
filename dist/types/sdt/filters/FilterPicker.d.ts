import * as React from "react";
import type { FilterCondition, FilterFieldDef } from "../types";
type Props<TWhere> = {
    fields: FilterFieldDef<TWhere>[];
    onAdd: (cond: FilterCondition) => void;
    /** Controlled open state (used when triggered from a column-header menu) */
    open?: boolean | undefined;
    onOpenChange?: ((open: boolean) => void) | undefined;
    /** When the picker opens with this set, jump straight to the value editor
     *  for the matching field. Resets to null after the picker closes. */
    initialField?: string | null | undefined;
    onInitialFieldConsumed?: (() => void) | undefined;
    /** Active filter count, shown as a badge on the icon button. */
    activeCount?: number | undefined;
};
/**
 * Single popover with two stages:
 * 1. Field picker (fuzzy-searchable, grouped)
 * 2. Inline value editor for the picked field
 *
 * Anchored to the "+ Filter" button, so the popover stays in place
 * while transitioning between stages.
 */
export declare function FilterPicker<TWhere>({ fields, onAdd, open: openProp, onOpenChange, initialField, onInitialFieldConsumed, activeCount, }: Props<TWhere>): React.JSX.Element;
export {};
