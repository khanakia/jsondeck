import { type CopyFormat } from "../../core/copy";
import { type Labels } from "../../core/labels";
import { type Row } from "../../core/query";
import type { ResolvedTable } from "../../core/resolve";
import type { FilterCondition, FilterFieldDef } from "../types";
export type RowMenuProps = {
    x: number;
    y: number;
    row: Row;
    /** The column under the pointer (none from the keyboard). */
    col?: string | undefined;
    table: ResolvedTable;
    labels: Labels;
    selection: ReadonlySet<Row>;
    filterFields: FilterFieldDef<unknown>[];
    addFilter: (f: FilterCondition) => void;
    /** Inline expand is on: offer expand / collapse. */
    expandInline: boolean;
    expanded: boolean;
    toggleExpand: (row: Row) => void;
    onRowOpen?: ((row: Row) => void) | undefined;
    copyRows: (list: Row[], fmt: CopyFormat) => void;
    onClose: () => void;
};
export declare function RowMenu(p: RowMenuProps): import("react").JSX.Element;
