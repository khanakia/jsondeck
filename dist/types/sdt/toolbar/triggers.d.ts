import type * as React from "react";
import { type Labels } from "../../core/labels";
import type { SortDirection, SortOption, SortRule } from "../types";
/** What a Base UI trigger (or the stand-in wrapper) may add to the button. */
type ButtonRest = Omit<React.ComponentProps<"button">, "children" | "value">;
export declare function FilterTrigger({ activeCount, ...rest }: {
    activeCount: number;
} & ButtonRest): React.JSX.Element;
/** Sort tooltip: "Sort" or "Sort: Name ↑". */
export declare function sortTip(L: Labels, options: SortOption[], value: SortRule[]): string;
export declare function SortTrigger({ options, value, ...rest }: {
    options: SortOption[];
    value: SortRule[];
} & ButtonRest): React.JSX.Element;
export declare function ColumnsTrigger({ hiddenCount, ...rest }: {
    hiddenCount: number;
} & ButtonRest): React.JSX.Element;
/** Views tooltip: "Views" or "Views: <active view>". */
export declare function viewsTip(L: Labels, activeName: string | undefined): string;
export declare function ViewsTrigger({ activeName, modified, ...rest }: {
    activeName: string | undefined;
    modified: boolean;
} & ButtonRest): React.JSX.Element;
/** Group-by tooltip: "Group by" or "Group by: a, b". */
export declare function groupTip(L: Labels, value: string[]): string;
export declare function GroupTrigger({ value, ...rest }: {
    value: string[];
} & ButtonRest): React.JSX.Element;
export declare function MoreTrigger(rest: ButtonRest): React.JSX.Element;
export declare function ExportTrigger({ label, hideIcon, loading, ...rest }: {
    label: string;
    hideIcon?: boolean | undefined;
    loading?: boolean | undefined;
} & ButtonRest): React.JSX.Element;
/** The small chevron in a column header; shows the column's sort direction when sorted. */
export declare function HeaderMenuTrigger({ sortDir, onClick, ...rest }: {
    sortDir: SortDirection | null;
} & ButtonRest): React.JSX.Element;
export declare function PageSizeTrigger({ value, ...rest }: {
    value: number;
} & ButtonRest): React.JSX.Element;
export {};
