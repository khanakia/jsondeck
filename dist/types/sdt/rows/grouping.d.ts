import type { ColumnMetaX } from "../../auto";
import type { FormatFn } from "../../core/config";
import type { GroupNode } from "../../core/group";
import type { ResolvedTable } from "../../core/resolve";
export { flattenGroups, groupRows } from "../../core/group";
export type GroupRowProps = {
    node: GroupNode;
    path: string;
    open: boolean;
    table: ResolvedTable;
    columns: {
        id: string;
    }[];
    specs: Map<string, ColumnMetaX>;
    /** Chevron / checkbox columns before the data columns. */
    specialCols: number;
    /** Row height classes for the density. */
    cellClass: string;
    rowClass: string | undefined;
    alignClass: (id: string) => string | undefined;
    formats: Record<string, FormatFn>;
    onToggle: (path: string) => void;
};
/** A group header: "field: value (count)" with a chevron, then the group's aggregates under their columns. */
export declare function GroupRow({ node: g, path, open, table, columns, specs, specialCols, cellClass, rowClass, alignClass, formats, onToggle }: GroupRowProps): import("react").JSX.Element;
