/**
 * Typed config for library users. `defineConfig(data, config)` checks table
 * names against the data's keys and column names against each table's row
 * type, and gives row callbacks the real row type. For a typed computed
 * column, add the field to the rows before passing them in
 * (`findings.map((f) => ({ ...f, risk: f.cvss * 2 }))`) so it is part of the
 * row type; `value(row)` in config stays available for plain-JS users. Pure types plus one identity function; plain-JS users get
 * the runtime validator in resolve.ts instead.
 *
 * Works with row types declared as `type` aliases (they are assignable to
 * Record<string, unknown>); an `interface` row type needs an index signature.
 */
import type { ChartSpec } from "../viz/Chart";
import type { KVSpec } from "../viz/KeyValueCard";
import type { StatSpec } from "../viz/StatTile";
import type { FilterOperator } from "../sdt/types";
import type { Bivariant, ColumnConfig, ComponentBase, GroupAggregate, JsonDeckConfig, QuickFilterConfig, RowFn, SectionConfig, TableConfig } from "./config";
import type { Where, WhereClause } from "./aggregate";
import type { ClassNames } from "./theme-tokens";
/** Data: named arrays of row objects. */
export type AnyData = Record<string, readonly object[]>;
export type RowOf<D, N extends keyof D> = D[N] extends readonly (infer R)[] ? R : never;
type KeysOf<R> = Extract<keyof R, string>;
type TableNames<D> = Extract<keyof D, string>;
/** Every column name of table N (computed columns: add them to the rows with withColumns()). */
export type ColumnName<D, N extends keyof D> = KeysOf<RowOf<D, N>>;
/** "table.column" across all tables. */
export type ColumnRef<D> = {
    [N in TableNames<D>]: `${N}.${ColumnName<D, N>}`;
}[TableNames<D>];
type ValueOf<R, K> = K extends keyof R ? R[K] : unknown;
export type TypedColumn<R, K> = Omit<ColumnConfig, "value" | "render" | "link" | "tooltip" | "format" | "sort"> & {
    value?: RowFn<R, unknown> | undefined;
    render?: Bivariant<(value: ValueOf<R, K>, row: R) => unknown> | undefined;
    link?: string | RowFn<R, string> | undefined;
    tooltip?: boolean | Bivariant<(value: ValueOf<R, K>, row: R) => string> | undefined;
    format?: string | Bivariant<(value: ValueOf<R, K>, row: R) => string> | undefined;
    sort?: false | Bivariant<(a: ValueOf<R, K>, b: ValueOf<R, K>) => number> | undefined;
};
/** Data columns (typed from the row) may use the type-name shorthand. */
type TypedColumns<R> = {
    [K in KeysOf<R>]?: TypedColumn<R, K> | string;
};
type SortRef<CN extends string> = CN | `-${CN}` | {
    column: CN;
    direction?: "asc" | "desc" | undefined;
};
/** Table settings shared by `tables.<name>` and a table placed on a page. */
export type TypedTableSettings<D, N extends TableNames<D>> = {
    label?: string | undefined;
    key?: KeysOf<RowOf<D, N>> | undefined;
    columns?: TypedColumns<RowOf<D, N>> | undefined;
    columnOrder?: ColumnName<D, N>[] | undefined;
    include?: ColumnName<D, N>[] | undefined;
    exclude?: ColumnName<D, N>[] | undefined;
    defaultSort?: SortRef<ColumnName<D, N>>[] | undefined;
    defaultFilters?: {
        column: ColumnName<D, N>;
        operator?: FilterOperator | undefined;
        value?: unknown;
    }[] | undefined;
    pageSize?: number | undefined;
    search?: false | {
        columns: ColumnName<D, N>[];
    } | undefined;
    filters?: false | undefined;
    views?: TableConfig["views"];
    rowClass?: RowFn<RowOf<D, N>, string | undefined> | undefined;
    onRowClick?: RowFn<RowOf<D, N>, void> | undefined;
    expand?: false | "inline" | "drawer" | {
        relation: string;
    } | undefined;
    detail?: {
        fields?: ColumnName<D, N>[] | undefined;
        columns?: 1 | 2 | 3 | 4 | undefined;
        render?: RowFn<RowOf<D, N>, unknown> | undefined;
        related?: boolean | undefined;
    } | undefined;
    groupBy?: ColumnName<D, N> | ColumnName<D, N>[] | undefined;
    groupAggregates?: {
        [K in ColumnName<D, N>]?: GroupAggregate;
    } | undefined;
    quickFilters?: {
        column: ColumnName<D, N>;
        kind: QuickFilterConfig["kind"];
        label?: string | undefined;
    }[] | undefined;
    selectable?: boolean | undefined;
    density?: "compact" | "comfortable" | undefined;
    classNames?: ClassNames | undefined;
    cellClass?: Bivariant<(row: RowOf<D, N>, column: ColumnName<D, N>) => string | undefined> | undefined;
    rowActions?: {
        label: string;
        icon?: string | undefined;
        onSelect: Bivariant<(row: RowOf<D, N>, rows: RowOf<D, N>[]) => void>;
    }[] | undefined;
};
export type TypedTable<D, N extends TableNames<D>> = TypedTableSettings<D, N> & {
    hidden?: boolean | undefined;
};
type TypedWhere<D, N extends TableNames<D>> = Partial<Record<ColumnName<D, N>, WhereClause>> & Where;
/** Components placed on a page, discriminated by `component`, with columns checked per table. */
export type TypedItem<D> = {
    [N in TableNames<D>]: ComponentBase & TypedTableSettings<D, N> & {
        component: "table";
        table: N;
        export?: boolean | undefined;
        facets?: ColumnName<D, N>[] | undefined;
        master?: string | undefined;
        via?: string | undefined;
        whenEmpty?: "all" | "none" | undefined;
    };
}[TableNames<D>] | {
    [N in TableNames<D>]: ComponentBase & Omit<ChartSpec, "title" | "height" | "groupBy" | "series" | "where"> & {
        component: "chart";
        table: N;
        groupBy?: ColumnName<D, N> | RowFn<RowOf<D, N>, unknown>;
        series?: ColumnName<D, N> | RowFn<RowOf<D, N>, unknown>;
        where?: TypedWhere<D, N>;
        targets?: string[] | undefined;
        palette?: string[] | undefined;
    };
}[TableNames<D>] | {
    [N in TableNames<D>]: ComponentBase & Omit<StatSpec, "label" | "where" | "compare"> & {
        component: "stat";
        table: N;
        label?: string | undefined;
        where?: TypedWhere<D, N>;
        compare?: TypedWhere<D, N>;
    };
}[TableNames<D>] | {
    [N in TableNames<D>]: ComponentBase & Omit<KVSpec, "title"> & {
        component: "kv";
        table: N;
        key?: unknown;
    };
}[TableNames<D>] | (ComponentBase & {
    component: "markdown";
    text: string;
}) | {
    [N in TableNames<D>]: ComponentBase & {
        component: "facets";
        table: N;
        fields: ColumnName<D, N>[];
        targets?: string[] | undefined;
    };
}[TableNames<D>];
export type TypedSection<D> = Omit<SectionConfig, "items" | "sections"> & {
    items?: TypedItem<D>[] | undefined;
    sections?: TypedSection<D>[] | undefined;
};
export type TypedPage<D> = {
    id?: string | undefined;
    title: string;
    filters?: (ColumnRef<D> | string)[] | undefined;
    sections: TypedSection<D>[];
};
/** The typed config: JsonDeckConfig with names checked against the data D. */
export type Config<D extends AnyData> = Omit<JsonDeckConfig, "data" | "tables" | "tableOrder" | "relations" | "pages"> & {
    tables?: {
        [N in TableNames<D>]?: TypedTable<D, N>;
    } | undefined;
    tableOrder?: TableNames<D>[] | undefined;
    relations?: {
        from: ColumnRef<D>;
        to: ColumnRef<D>;
        label?: string | undefined;
        reverseLabel?: string | undefined;
    }[] | undefined;
    pages?: TypedPage<D>[] | undefined;
};
/**
 * Typed config helper: returns `{ ...config, data }`, ready for `mount`.
 *
 *   const cfg = defineConfig({ findings }, { tables: { findings: { columnOrder: ["id", "severity"] } } })
 *   JsonDeck.mount("#app", cfg)
 */
export declare function defineConfig<D extends AnyData>(data: D, config: Config<D>): Config<D> & {
    data: D;
};
export {};
