/**
 * The whole public config surface of jsondeck, as types. Every key is
 * optional: anything not set falls back to column config → table config →
 * global config → the guess → the built-in default (see resolve.ts).
 * Pure types and key lists only; no React.
 */
import type { FilterOperator } from "../sdt/types";
import type { ChartSpec } from "../viz/Chart";
import type { KVSpec } from "../viz/KeyValueCard";
import type { StatSpec } from "../viz/StatTile";
import type { Labels } from "./labels";
import type { ClassNames, ThemeTokens } from "./theme-tokens";
export type Row = Record<string, unknown>;
/** The column types jsondeck knows out of the box. `types` can add more. */
export declare const BUILTIN_TYPES: readonly ["text", "longtext", "number", "date", "datetime", "url", "ip", "email", "boolean", "enum", "json", "mono"];
export type BuiltinType = (typeof BUILTIN_TYPES)[number];
/** Config aliases that read naturally but map to a real type. */
export declare const TYPE_ALIASES: Record<string, BuiltinType>;
/** Named badge colours; any CSS colour string works too. */
export declare const TONES: readonly ["red", "orange", "amber", "green", "blue", "violet", "cyan", "pink", "slate"];
export type Tone = (typeof TONES)[number];
export declare const ALIGNS: readonly ["left", "center", "right"];
export type Align = (typeof ALIGNS)[number];
export declare const PINS: readonly ["left", "right"];
export type Pin = (typeof PINS)[number];
/** "inherit" (default) follows the page theme; "auto" follows the OS; light/dark pin this deck. */
export declare const THEMES: readonly ["inherit", "auto", "light", "dark"];
export type Theme = (typeof THEMES)[number];
/** Filter controls the table can show for a column. */
export declare const FILTER_KINDS: readonly ["text", "number", "boolean", "select", "multi-select", "date", "date-range"];
export type FilterKind = (typeof FILTER_KINDS)[number];
/** How a column sorts: by number, by text, by enum order, or a comparator of raw values. */
export type SortKind = "number" | "text" | "order";
export type Comparator = Bivariant<(a: unknown, b: unknown) => number>;
/**
 * A cell renderer. Return a string/number (shown as text), a DOM Node
 * (inserted as is; you own its safety), or a React element (ESM users).
 */
/**
 * Callbacks that receive a row are declared bivariantly (the method-signature
 * trick React uses), so a config typed with your own row type through
 * defineConfig() is assignable to this untyped JsonDeckConfig without a cast.
 */
export type Bivariant<F extends (...args: never[]) => unknown> = {
    bivarianceHack(...args: Parameters<F>): ReturnType<F>;
}["bivarianceHack"];
export type RowFn<R, T> = Bivariant<(row: R) => T>;
export type RenderFn<R = Row, V = unknown> = Bivariant<(value: V, row: R) => unknown>;
/** A named format: `format: "currency:EUR"` calls formats.currency(value, "EUR", row). */
export type FormatFn<R = Row> = Bivariant<(value: unknown, arg: string | undefined, row: R) => string>;
/** A custom type detector; runs before the built-in checks on the non-empty sample values. */
export type Detector = {
    type: string;
    test: (values: unknown[]) => boolean;
};
/** Register a new column type or replace a built-in one. */
export type TypeDef = {
    render?: RenderFn | undefined;
    filter?: FilterKind | false | undefined;
    sort?: SortKind | Comparator | false | undefined;
    align?: Align | undefined;
    format?: string | FormatFn | undefined;
    width?: number | undefined;
};
export type GuessOptions = {
    /** An enum has at most this many distinct values (default 12). */
    enumMaxDistinct?: number | undefined;
    /** … and distinct values are at most this share of non-empty values (default 0.34). */
    enumMaxRatio?: number | undefined;
    /** Enum values longer than this are prose, not categories (default 32). */
    enumMaxLen?: number | undefined;
    /** Text whose longest value passes this is long text (default 80). */
    longTextLen?: number | undefined;
    /** Rows looked at when guessing (default 2000). */
    sampleSize?: number | undefined;
    /** Value sets with a natural order (default: critical…none, p0…p4). */
    knownOrders?: string[][] | undefined;
    /** Custom detectors, tried in order before the built-in checks. */
    detectors?: Detector[] | undefined;
};
/** GuessOptions with every field filled in (what resolve uses). */
export type ResolvedGuess = {
    [K in keyof GuessOptions]-?: Exclude<GuessOptions[K], undefined>;
};
export type ColumnFilterConfig = false | FilterKind | {
    type?: FilterKind | undefined;
    options?: (string | {
        value: string;
        label: string;
    })[] | undefined;
    operators?: FilterOperator[] | undefined;
};
export type ColumnConfig = {
    /** A built-in type, an alias ("badge"), or a type registered in `types`. */
    type?: string | undefined;
    label?: string | undefined;
    hidden?: boolean | undefined;
    width?: number | undefined;
    minWidth?: number | undefined;
    pin?: Pin | undefined;
    align?: Align | undefined;
    /** Wrap long text instead of truncating it. */
    wrap?: boolean | undefined;
    className?: string | undefined;
    /** true = the cell's text; a function = your text; false = none. */
    tooltip?: boolean | Bivariant<(value: unknown, row: Row) => string> | undefined;
    /** Computed column: a column id not in the data plus `value` makes a new column. */
    value?: RowFn<Row, unknown> | undefined;
    /** A format name with an optional argument ("currency:USD", "number:2", "bytes", "percent", "relative") or a function. */
    format?: string | Bivariant<(value: unknown, row: Row) => string> | undefined;
    render?: RenderFn | undefined;
    /** URL template ("https://x/{id}") filled from the row, or a function. */
    link?: string | RowFn<Row, string> | undefined;
    /** Enum: the order values sort in and list in the filter. */
    order?: string[] | undefined;
    /** Enum: value → tone name or CSS colour. Unset values get a calm neutral. */
    colors?: Record<string, string> | undefined;
    filter?: ColumnFilterConfig | undefined;
    /** false = not sortable; a function = comparator of raw values. */
    sort?: false | Comparator | undefined;
    /** false = global search skips this column. */
    search?: false | undefined;
};
/** "severity" (asc), "-launched" (desc), or an object. */
export type SortConfig = string | {
    column: string;
    direction?: "asc" | "desc" | undefined;
};
export type FilterConfig = {
    column: string;
    operator?: FilterOperator | undefined;
    value?: unknown;
};
export declare const DENSITIES: readonly ["compact", "comfortable"];
export type Density = (typeof DENSITIES)[number];
export declare const GROUP_AGGREGATES: readonly ["count", "sum", "avg", "min", "max"];
export type GroupAggregate = (typeof GROUP_AGGREGATES)[number];
export type DetailConfig = {
    fields?: string[] | undefined;
    /** Columns of the field grid (1–4, default 3). */
    columns?: 1 | 2 | 3 | 4 | undefined;
    render?: RenderFn<Row, Row> | undefined;
    /** Show related rows (relations) as nested tables, recursively. */
    related?: boolean | undefined;
};
export declare const QUICK_FILTER_KINDS: readonly ["range", "chips", "toggle", "search"];
export type QuickFilterConfig = {
    column: string;
    kind: (typeof QUICK_FILTER_KINDS)[number];
    label?: string | undefined;
};
export type RowActionConfig = {
    label: string;
    icon?: string | undefined;
    onSelect: Bivariant<(row: Row, rows: Row[]) => void>;
};
export type TableConfig = {
    label?: string | undefined;
    /** true = drop the table. */
    hidden?: boolean | undefined;
    /** Row id column (stable row keys). */
    key?: string | undefined;
    columns?: Record<string, ColumnConfig | string> | undefined;
    /** Computed columns: name → column config with value(row). Same as a `columns` entry whose name is not in the data. */
    computed?: Record<string, ColumnConfig> | undefined;
    /** Columns listed here come first, the rest follow in data order. */
    columnOrder?: string[] | undefined;
    /** Only these columns (plus computed ones). */
    include?: string[] | undefined;
    exclude?: string[] | undefined;
    defaultSort?: SortConfig[] | undefined;
    defaultFilters?: FilterConfig[] | undefined;
    pageSize?: number | undefined;
    /** false = no search box; { columns } = search only these. */
    search?: false | {
        columns: string[];
    } | undefined;
    /** false = no filter button. */
    filters?: false | undefined;
    views?: false | ViewsConfig | undefined;
    rowClass?: RowFn<Row, string | undefined> | undefined;
    onRowClick?: RowFn<Row, void> | undefined;
    /** Row expansion: inline detail panel (chevron column), the drawer, or off. Default: "inline" when `detail` is set. */
    expand?: false | "inline" | "drawer" | {
        relation: string;
    } | undefined;
    /** What the expanded row shows. Without `fields`: every column hidden in the table. */
    detail?: DetailConfig | undefined;
    /** Group rows by one or more columns (collapsible group rows). */
    groupBy?: string | string[] | undefined;
    /** Aggregates shown in each group row, per column. */
    groupAggregates?: Record<string, GroupAggregate> | undefined;
    /** One-row filter strip above the table, synced with the filter pills. */
    quickFilters?: QuickFilterConfig[] | undefined;
    /** Checkbox column + selection bar (copy / clear). */
    selectable?: boolean | undefined;
    /** Per-slot class names for this table (merged onto the global ones). */
    classNames?: ClassNames | undefined;
    /** Class names for a cell, per row and column. */
    cellClass?: Bivariant<(row: Row, column: string) => string | undefined> | undefined;
    /** Row height: compact (28px, default) or comfortable (36px). Overrides the global setting. */
    density?: Density | undefined;
    /** Extra right-click menu items. `rows` = the selected rows (or just this row). */
    rowActions?: RowActionConfig[] | undefined;
};
/** Saved views; `storage` must implement the ViewStorage interface (list/get/save/delete/setDefault/setFavorite). */
export type ViewsConfig = {
    storage?: unknown;
};
/** Fields every placed component has. `id` keys its state and saved views (default: page/section/index). */
export type ComponentBase = {
    /** Extra class names on the item frame (applied as given). */
    className?: string | undefined;
    /** Per-slot class names for this item (and the table inside it). */
    classNames?: ClassNames | undefined;
    id?: string | undefined;
    title?: string | undefined;
    span?: number | undefined;
    height?: number | undefined;
    /** Wrap the item in a Preview / Code box: true = its own config as source, a string = that code. */
    code?: boolean | string | undefined;
};
/** Table-level settings a placement may override. */
export type TableOverrides = Omit<TableConfig, "hidden">;
export type TableItem = ComponentBase & TableOverrides & {
    component: "table";
    table: string;
    export?: boolean | undefined;
    facets?: string[] | undefined;
    /** Master–detail: the id of a table item on this page; selecting rows there filters this table to related rows. */
    master?: string | undefined;
    /** Which relation links the two (its label); default: any relation between the tables. */
    via?: string | undefined;
    /** With nothing selected in the master: show all rows (default) or none. */
    whenEmpty?: "all" | "none" | undefined;
};
/** A chart over a dataset (see viz ChartSpec); clicking a bar/slice filters `targets` (default: tables of the same dataset on the page). */
export type ChartItem = ComponentBase & Omit<ChartSpec, "title" | "height" | "groupBy" | "series"> & {
    component: "chart";
    table: string;
    groupBy?: string | RowFn<Row, unknown>;
    series?: string | RowFn<Row, unknown>;
    targets?: string[] | undefined;
    /** Colours in order for this chart (overrides the global palette). */
    palette?: string[] | undefined;
};
export type StatItem = ComponentBase & Omit<StatSpec, "label"> & {
    component: "stat";
    table: string;
    label?: string | undefined;
};
export type KVItem = ComponentBase & Omit<KVSpec, "title"> & {
    component: "kv";
    table: string;
    key?: unknown;
};
export type MarkdownItem = ComponentBase & {
    component: "markdown";
    text: string;
};
/** Count-per-value sidebar; clicking a value filters `targets` (default: tables of the same dataset on the page). */
export type FacetsItem = ComponentBase & {
    component: "facets";
    table: string;
    fields: string[];
    targets?: string[] | undefined;
};
/** "On this page": the headings of the page's markdown items, with scroll-spy. Sticky (see the sticky-top token). */
export type TocItem = ComponentBase & {
    component: "toc";
};
export type PageItem = TableItem | ChartItem | StatItem | KVItem | MarkdownItem | FacetsItem | TocItem;
export type SectionConfig = {
    title?: string | undefined;
    description?: string | undefined;
    collapsible?: boolean | undefined;
    collapsed?: boolean | undefined;
    /** Grid: a column count, or ratios like [2, 1]. Stacks on narrow screens. */
    columns?: number | number[] | undefined;
    items?: PageItem[] | undefined;
    sections?: SectionConfig[] | undefined;
    /** Show the child sections as tabs. */
    tabs?: boolean | undefined;
};
export type PageConfig = {
    /** URL hash id (`#/servers`); default: from the title. */
    id?: string | undefined;
    title: string;
    /** Sidebar group heading (nav: "sidebar"); pages with the same group are listed together. */
    group?: string | undefined;
    /** Page-level filter bar: `table.field` or a bare field shared by components. */
    filters?: string[] | undefined;
    sections: SectionConfig[];
};
export type RelationConfig = {
    from: string;
    to: string;
    label?: string | undefined;
    reverseLabel?: string | undefined;
};
export type ThemeConfigObject = {
    mode?: Theme | undefined;
    light?: ThemeTokens | undefined;
    dark?: ThemeTokens | undefined;
};
export type JsonDeckConfig = {
    /** Object of named arrays, or a selector of a <script type="application/json"> tag holding one. */
    data: Record<string, unknown> | unknown[] | string;
    tables?: Record<string, TableConfig> | undefined;
    /** Tab order; tables not listed follow in data order. */
    tableOrder?: string[] | undefined;
    /** Mode ("inherit" | "auto" | "light" | "dark"), or tokens per mode: { mode?, light?: {...}, dark?: {...} } (see THEME_TOKENS). */
    theme?: Theme | ThemeConfigObject | undefined;
    pageSize?: number | undefined;
    pageSizes?: number[] | undefined;
    views?: false | ViewsConfig | undefined;
    /** Replace the renderer of a type (built-in or registered). */
    renderers?: Record<string, RenderFn> | undefined;
    /** Add or replace named formats. */
    formats?: Record<string, FormatFn> | undefined;
    /** Every UI string. Templates use {from} {to} {total} {n} {shown} {table}. */
    labels?: Partial<Labels> | undefined;
    /** Words shown in capitals in generated labels (replaces the default list). */
    acronyms?: string[] | undefined;
    guess?: GuessOptions | undefined;
    types?: Record<string, TypeDef> | undefined;
    /** `table.column` → `table.column` links (cells become links; the row drawer shows related rows). */
    relations?: RelationConfig[] | undefined;
    /** Page layouts. Without it: one page, one tab per table. */
    pages?: PageConfig[] | undefined;
    /** Page navigation style. */
    nav?: "tabs" | "sidebar" | undefined;
    /** Search across pages (titles, headings, text, table rows): ⌘K / Ctrl+K, or "/" on a page without a table. Default: on with nav "sidebar". */
    search?: boolean | undefined;
    /** Allow drag-and-drop layout editing (default true when `pages` is set). */
    editable?: boolean | undefined;
    /** Per-slot class names for every element of that kind (applied as given, not prefixed). */
    classNames?: ClassNames | undefined;
    /** Chart colours in order (replaces the default palette for values without an explicit colour). */
    palette?: string[] | undefined;
    /** Badge colours for status values: value → tone name or CSS colour ("open": "red", "fixed": "#16a34a"). */
    statusColors?: Record<string, string> | undefined;
    /** Show a theme toggle in this deck (default false: the page theme is site-wide, see JsonDeck.setTheme). */
    themeToggle?: boolean | undefined;
    /** Show text labels next to the toolbar icons (default false: icons + tooltips). */
    toolbarLabels?: boolean | undefined;
    /** Row height for every table: compact (28px, default) or comfortable (36px). */
    density?: Density | undefined;
};
/** Known keys per level, for validation ("did you mean …"). */
export declare const GLOBAL_KEYS: string[];
export declare const TABLE_KEYS: string[];
export declare const COLUMN_KEYS: string[];
export declare const GUESS_KEYS: string[];
export declare const TYPEDEF_KEYS: string[];
