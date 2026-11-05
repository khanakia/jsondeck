import { type CopyFormat } from "../../core/copy";
import type { ResolvedTable } from "../../core/resolve";
import type { FilterCondition } from "../types";
type QuickProps = {
    table: ResolvedTable;
    conditions: FilterCondition[];
    /** Set (or clear with null) the one condition for a column; ids are stable per column. */
    onSet: (column: string, cond: Omit<FilterCondition, "id"> | null) => void;
};
export declare function QuickFilters({ table, conditions, onSet }: QuickProps): import("react").JSX.Element | null;
export declare function SelectionBar({ count, total, onSelectAll, onCopy, onClear }: {
    count: number;
    total: number;
    onSelectAll: () => void;
    onCopy: (f: CopyFormat) => void;
    onClear: () => void;
}): import("react").JSX.Element | null;
export {};
