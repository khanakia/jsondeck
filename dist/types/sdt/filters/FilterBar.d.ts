import type { FilterCondition, FilterFieldDef, SearchConfig } from "../types";
type Props<TWhere> = {
    fields: FilterFieldDef<TWhere>[];
    conditions: FilterCondition[];
    search?: SearchConfig<TWhere> | undefined;
    searchValue: string;
    onSearchChange: (value: string) => void;
    onAddFilter: (cond: FilterCondition) => void;
    onUpdateFilter: (cond: FilterCondition) => void;
    onRemoveFilter: (id: string) => void;
    onClearFilters: () => void;
    /** Right-side toolbar slot for the sort dropdown / view selector */
    rightSlot?: React.ReactNode | undefined;
    /** Imperative open of the filter picker (for keyboard / column header) */
    pickerOpen?: boolean | undefined;
    onPickerOpenChange?: ((open: boolean) => void) | undefined;
    pickerInitialField?: string | null | undefined;
    onPickerInitialFieldConsumed?: (() => void) | undefined;
    /** Search input ref for keyboard `/` shortcut */
    searchInputRef?: React.Ref<HTMLInputElement> | undefined;
};
export declare function FilterBar<TWhere>({ fields, conditions, search, searchValue, onSearchChange, onAddFilter, onUpdateFilter, onRemoveFilter, onClearFilters, rightSlot, pickerOpen, onPickerOpenChange, pickerInitialField, onPickerInitialFieldConsumed, searchInputRef, }: Props<TWhere>): import("react").JSX.Element;
export {};
