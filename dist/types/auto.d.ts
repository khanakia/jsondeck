/**
 * Turns a resolved table into the shapes the table engine
 * expects (DataTableColumn, FilterFieldDef, SortOption) plus the FieldInfo the
 * in-memory query engine needs. Reads only the resolved spec: no defaults here.
 */
import { type RenderCtx } from "./components/cells";
import type { FieldInfo, Row } from "./core/query";
import type { ResolvedColumn, ResolvedTable } from "./core/resolve";
import type { DataTableColumn, FilterFieldDef, SortOption } from "./sdt/types";
export type ColumnMetaX = {
    spec: ResolvedColumn;
    tooltip: (row: Row) => string | undefined;
};
export type AutoTable = {
    columns: DataTableColumn<Row>[];
    filterFields: FilterFieldDef<unknown>[];
    sortOptions: SortOption[];
    fields: FieldInfo[];
    searchFields: string[];
    /** Column specs by id, for pin/align/wrap/tooltip in the table. */
    specs: Map<string, ColumnMetaX>;
};
export declare function buildAuto(t: ResolvedTable, ctx: RenderCtx): AutoTable;
