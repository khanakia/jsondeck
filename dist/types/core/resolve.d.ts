/**
 * The one resolve step. Pure: no React. Guessed spec deep-merged with config;
 * everything downstream reads only the resolved spec. Each setting falls back:
 * column config → table config → global config → guess → built-in default.
 * Validation runs here too: bad keys/values become Issues and are skipped,
 * so the rest still renders.
 */
import type { FilterCondition, FilterOperator, SortRule } from "../sdt/types";
import { type Align, type Comparator, type FilterKind, type FormatFn, type ResolvedGuess, type JsonDeckConfig, type Pin, type RenderFn, type Row, type SortKind, type TableConfig, type Theme, type TypeDef, type DetailConfig, type Density, type GroupAggregate, type QuickFilterConfig, type RelationConfig, type RowActionConfig, type ViewsConfig } from "./config";
import { type ClassNames, type ThemeTokens } from "./theme-tokens";
import { type Labels } from "./labels";
import { type Issue } from "./validate";
export declare const DEFAULT_PAGE_SIZES: number[];
export declare const DEFAULT_PAGE_SIZE = 50;
export type ResolvedFilter = false | {
    type: FilterKind;
    options?: {
        value: string;
        label: string;
    }[] | undefined;
    operators?: FilterOperator[] | undefined;
};
export type ResolvedColumn = {
    id: string;
    label: string;
    type: string;
    /** True when the column comes from `value(row)`, not the data. */
    computed: boolean;
    hidden: boolean;
    width: number;
    minWidth?: number | undefined;
    pin?: Pin | undefined;
    align: Align;
    wrap: boolean;
    className?: string | undefined;
    tooltip: boolean | ((value: unknown, row: Row) => string);
    format?: (string | ((value: unknown, row: Row) => string)) | undefined;
    render?: RenderFn | undefined;
    link?: (string | ((row: Row) => string)) | undefined;
    order?: string[] | undefined;
    colors?: Record<string, string> | undefined;
    /** Distinct values (enum/boolean), for filter options. */
    values?: string[] | undefined;
    filter: ResolvedFilter;
    sort: false | SortKind | Comparator;
    search: boolean;
    /** Set when a relation starts at this column: values link to rows of `table` whose `field` matches. */
    relation?: {
        table: string;
        field: string;
    } | undefined;
};
export type ResolvedTable = {
    name: string;
    label: string;
    key?: string | undefined;
    /** Rows with computed column values filled in. */
    rows: Row[];
    /** Display order (pinned-left first, pinned-right last). */
    columns: ResolvedColumn[];
    pageSize: number;
    pageSizes: number[];
    search: false | {
        columns: string[];
    };
    filters: boolean;
    views: false | ViewsConfig;
    defaultSort: SortRule[];
    defaultFilters: FilterCondition[];
    rowClass?: ((row: Row) => string | undefined) | undefined;
    onRowClick?: ((row: Row) => void) | undefined;
    expand: false | "inline" | "drawer";
    /** Expand shows this relation's rows (by label) instead of the field grid. */
    expandRelation?: string | undefined;
    detail?: DetailConfig | undefined;
    groupBy: string[];
    groupAggregates: Record<string, GroupAggregate>;
    quickFilters: QuickFilterConfig[];
    selectable: boolean;
    rowActions: RowActionConfig[];
    density: Density;
    classNames: ClassNames;
    cellClass?: ((row: Row, column: string) => string | undefined) | undefined;
};
export type ResolvedDeck = {
    /** Token overrides per mode (applied as --jds-* on the root). */
    tokens: {
        light: ThemeTokens;
        dark: ThemeTokens;
    };
    classNames: ClassNames;
    palette?: string[] | undefined;
    statusColors: Record<string, string>;
    /** The arrays from config.data, by table name (rows without computed values). */
    datasets: Record<string, Row[]>;
    /** Table configs as written, for per-placement resolution (resolvePlacement). */
    tableConfigs: Record<string, TableConfig>;
    /** The config as given (data resolved), for placements and pages. */
    config: JsonDeckConfig;
    relations: RelationConfig[];
    theme: Theme;
    tables: ResolvedTable[];
    labels: Labels;
    formats: Record<string, FormatFn>;
    renderers: Record<string, RenderFn>;
    types: Record<string, TypeDef>;
    guess: ResolvedGuess;
    acronyms: string[];
    pageSizes: number[];
    issues: Issue[];
};
/** Keep only arrays; a top-level array becomes one table named "rows". */
export declare function toTableData(data: unknown): Record<string, Row[]>;
/** Data + config → the fully resolved deck (plus every config issue found). */
export declare function resolveDeck(config?: Partial<JsonDeckConfig>): ResolvedDeck;
/**
 * The resolved config as plain JSON in the same shape as the input config
 * (functions left out), so it can be copied, edited and passed back.
 */
export declare function describeDeck(d: ResolvedDeck): Record<string, unknown>;
/** Deep-merge a placement's overrides onto the dataset's table config (columns merged per column). */
export declare function mergeTableConfig(base: TableConfig | undefined, over: Partial<TableConfig>): TableConfig;
/**
 * Resolve one placement of a dataset: dataset spec → placement overrides →
 * resolved table. Pure; called once per table component on a page.
 */
export declare function resolvePlacement(deck: ResolvedDeck, table: string, over: Partial<TableConfig>, issues: Issue[], path: string): ResolvedTable | null;
