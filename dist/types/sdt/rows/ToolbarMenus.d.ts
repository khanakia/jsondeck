import type { ResolvedColumn } from "../../core/resolve";
export declare function GroupByMenu({ columns, value, onChange }: {
    columns: ResolvedColumn[];
    value: string[];
    onChange: (v: string[]) => void;
}): import("react").JSX.Element;
export declare function MoreMenu({ items }: {
    items: {
        label: string;
        onSelect: () => void;
        id: string;
    }[];
}): import("react").JSX.Element | null;
