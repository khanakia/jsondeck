import type { ReactNode } from "react"

// ──────────────────────────────────────────────────────────────────────────
// Column model — fully standalone (no third-party table library)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Per-column behavior + presentation hints. All optional.
 * Defaults are described inline.
 */
export type ColumnMeta = {
	/** CSS class applied to the column's header AND body cells. */
	className?: string | undefined
	/** Display label for the visibility menu / column-header menu.
	 *  Falls back to the column id when omitted. */
	label?: string | undefined
	/** SortOption fieldId this column corresponds to. When set, the
	 *  column-header chevron menu shows ascending/descending items. */
	sortFieldId?: string | undefined
	/** FilterFieldDef.id this column corresponds to. When set, the
	 *  column-header menu shows a "Filter…" item that opens the picker
	 *  pre-seeded with this field. */
	filterFieldId?: string | undefined
	/** Whether this column can be hidden via the visibility menu.
	 *  Default: true. Set to false for action / row-number columns. */
	hideable?: boolean | undefined
	/** Whether this column can be drag-resized.
	 *  Default: inherits the table-level `enableColumnResize`. */
	resizable?: boolean | undefined
	/** Whether this column can be drag-reordered.
	 *  Default: inherits the table-level `enableColumnReorder`. */
	draggable?: boolean | undefined
}

/**
 * Header label or a function returning a custom React node.
 * Strings render as-is; functions can return any JSX (icons, badges, etc.).
 */
export type ColumnHeaderRender = string | (() => ReactNode)

/**
 * Cell renderer for body rows. Receives the row data and the row's
 * 0-based index within the current page.
 */
export type ColumnCellRender<TNode> = (
	row: TNode,
	rowIndex: number,
) => ReactNode

/**
 * The single column definition shape consumed by DataTable.
 * No third-party table types involved — this component owns its
 * own column model.
 */
export type DataTableColumn<TNode> = {
	/** Stable id. Used as React key, visibility key, ordering key, etc. */
	id: string
	/** Header content. */
	header: ColumnHeaderRender
	/** Cell renderer. */
	cell: ColumnCellRender<TNode>
	/** Default width in px. Used as starting width before resize. Default: 160. */
	size?: number | undefined
	/** Min width during resize. Default: 60. */
	minSize?: number | undefined
	/** Max width during resize. Default: 800. */
	maxSize?: number | undefined
	/** Per-column behavior overrides. */
	meta?: ColumnMeta | undefined
}

// ──────────────────────────────────────────────────────────────────────────
// Sort
// ──────────────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc"

export type SortRule = {
	/** Caller-defined ID. Must match the value the caller maps to its OrderField enum. */
	fieldId: string
	direction: SortDirection
}

export type SortOption<TFieldId extends string = string> = {
	/** Stable ID matching the caller's OrderField enum value. When a union
	 *  (e.g. the SDK's `AiModelOrderField` enum) is supplied as the generic,
	 *  this field autocompletes against it and rejects unknown ids. */
	fieldId: TFieldId
	label: string
	/** Which directions are offered. Defaults to both. */
	directions?: SortDirection[] | undefined
}

// ──────────────────────────────────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────────────────────────────────

export type PaginationDirection = "forward" | "backward"

export type PaginationState = {
	direction: PaginationDirection
	cursor: string | null
	/** 1-indexed page number, for display only */
	page: number
}

export type PageInfo = {
	hasNextPage?: boolean | null | undefined
	hasPreviousPage?: boolean | null | undefined
	startCursor?: string | null | undefined
	endCursor?: string | null | undefined
}

export type Connection<TNode> = {
	edges?: Array<{ node?: TNode | null; cursor?: string | null } | null> | null | undefined
	pageInfo?: PageInfo | null | undefined
	totalCount?: number | null | undefined
}

// ──────────────────────────────────────────────────────────────────────────
// Filters (Phase 1: types only — UI lands in Phase 2)
// ──────────────────────────────────────────────────────────────────────────

export type FilterOperator =
	| "eq"
	| "neq"
	| "contains"
	| "notContains"
	| "startsWith"
	| "endsWith"
	| "gt"
	| "gte"
	| "lt"
	| "lte"
	| "between"
	| "in"
	| "notIn"
	| "isNull"
	| "isNotNull"
	| "is"
	| "isNot"

export type FilterCondition = {
	/** Stable id, used as React key */
	id: string
	/** References a FilterFieldDef.id */
	fieldId: string
	operator: FilterOperator
	value: unknown
	/**
	 * Display labels for relation values (value-id → label).
	 * Stored alongside the condition so labels survive URL roundtrips
	 * and page reloads without an extra fetch. Populated by the
	 * RelationControl when the user picks an option.
	 */
	labels?: Record<string, string> | undefined
}

/**
 * Per-field-type condition narrowing.
 *
 * The UI stores every condition as `FilterCondition` (`value: unknown`), but
 * the `toWhere` callback on each concrete field variant is typed so that
 * `operator` narrows `value` for the caller — no `as` casts required.
 *
 * Engine (see `buildWhere`) casts once at the boundary to bridge the stored
 * `unknown` shape onto these narrow types.
 */
type TypedCondition<Op extends FilterOperator, V> = {
	id: string
	fieldId: string
	operator: Op
	value: V
}

export type TextFilterCondition =
	| TypedCondition<
			"contains" | "notContains" | "eq" | "neq" | "startsWith" | "endsWith",
			string
	  >
	| TypedCondition<"isNull" | "isNotNull", null>

export type NumberFilterCondition =
	| TypedCondition<"eq" | "neq" | "gt" | "gte" | "lt" | "lte", number>
	| TypedCondition<"between", [number, number]>
	| TypedCondition<"isNull" | "isNotNull", null>

export type BooleanFilterCondition = TypedCondition<"is" | "isNot", boolean>

export type SelectFilterCondition =
	| TypedCondition<"eq" | "neq", string>
	| TypedCondition<"in" | "notIn", string[]>

export type MultiSelectFilterCondition = TypedCondition<
	"in" | "notIn",
	string[]
>

export type RelationFilterCondition =
	| TypedCondition<"eq" | "neq", string>
	| TypedCondition<"in" | "notIn", string[]>

export type RelationMultiFilterCondition = TypedCondition<
	"in" | "notIn",
	string[]
>

export type DateFilterCondition = TypedCondition<
	"eq" | "gt" | "gte" | "lt" | "lte",
	string
>

export type DateRangeFilterCondition = TypedCondition<"between", DateRangeValue>

export type FilterOption = {
	value: string
	label: string
	icon?: React.ComponentType<{ className?: string }> | undefined
}

type BaseFilterField<
	TWhere,
	TCond = FilterCondition,
	TId extends string = string,
> = {
	/** Stable id; matches FilterCondition.fieldId. When a model-type generic
	 *  is supplied to `defineFilterFields`, this is constrained to the model's
	 *  field names — typos on hardcoded ids become compile errors. */
	id: TId
	label: string
	icon?: React.ComponentType<{ className?: string }> | undefined
	/** Group label in the field picker (e.g. "Common", "Dates", "Relations") */
	group?: string | undefined
	/** Operator allowlist; defaults derived from `type` if omitted */
	operators?: FilterOperator[] | undefined
	/**
	 * Translate a condition into a partial WhereInput.
	 * The engine merges all returned partials into a single WhereInput.
	 *
	 * The condition is narrowed based on field type so `operator` discriminates
	 * `value` — e.g. for `select`, `cond.operator === "in"` implies
	 * `cond.value: string[]`, while `"eq"` implies `cond.value: string`.
	 */
	toWhere?: ((cond: TCond) => Partial<TWhere>) | undefined
}

export type TextFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, TextFilterCondition, TId> & {
	type: "text"
	placeholder?: string | undefined
}

export type NumberFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, NumberFilterCondition, TId> & {
	type: "number"
	placeholder?: string | undefined
}

export type BooleanFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, BooleanFilterCondition, TId> & {
	type: "boolean"
	/** Optional custom labels — defaults to "True" / "False" */
	trueLabel?: string | undefined
	falseLabel?: string | undefined
}

export type SelectFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, SelectFilterCondition, TId> & {
	type: "select"
	options: FilterOption[]
}

export type MultiSelectFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, MultiSelectFilterCondition, TId> & {
	type: "multi-select"
	options: FilterOption[]
}

/** Server-side option loader — caller supplies the gqlkit query. */
export type LoadOptionsFn = (query: string) => Promise<FilterOption[]>

export type RelationFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, RelationFilterCondition, TId> & {
	type: "relation"
	loadOptions: LoadOptionsFn
	/** Resolve a stored value (id) back into a label without a roundtrip.
	 * Called when rendering a pill for a known id. Falls back to the id
	 * if not provided. */
	resolveLabel?: ((value: string) => string | Promise<string>) | undefined
	searchPlaceholder?: string | undefined
}

export type RelationMultiFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, RelationMultiFilterCondition, TId> & {
	type: "relation-multi"
	loadOptions: LoadOptionsFn
	resolveLabel?: ((value: string) => string | Promise<string>) | undefined
	searchPlaceholder?: string | undefined
}

export type DateFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, DateFilterCondition, TId> & {
	type: "date"
}

export type DateRangeFilterField<
	TWhere,
	TId extends string = string,
> = BaseFilterField<TWhere, DateRangeFilterCondition, TId> & {
	type: "date-range"
	/** Whether to show the relative-presets sidebar. Default true. */
	showPresets?: boolean | undefined
}

/** ISO 8601 date-time string */
export type DateRangeValue = {
	from: string | null
	to: string | null
	/** Identifies a relative preset like "last_7d" so we can re-render the
	 * pill label without recomputing. null = custom range. */
	preset?: string | null | undefined
}

export type FilterFieldDef<TWhere, TId extends string = string> =
	| TextFilterField<TWhere, TId>
	| NumberFilterField<TWhere, TId>
	| BooleanFilterField<TWhere, TId>
	| SelectFilterField<TWhere, TId>
	| MultiSelectFilterField<TWhere, TId>
	| RelationFilterField<TWhere, TId>
	| RelationMultiFilterField<TWhere, TId>
	| DateFilterField<TWhere, TId>
	| DateRangeFilterField<TWhere, TId>

export type FilterFieldType = FilterFieldDef<unknown>["type"]

// ──────────────────────────────────────────────────────────────────────────
// Derived typing — narrow `fieldId`, `operator`, `value` against the caller's
// filterFields / sortOptions. Used by `defaultSort` and `views.builtinViews`
// so hardcoded literals get verified at compile time.
// ──────────────────────────────────────────────────────────────────────────

/** Maps a field `type` literal to its narrow condition union (operator+value). */
type ConditionForType<T extends FilterFieldType> = T extends "text"
	? TextFilterCondition
	: T extends "number"
		? NumberFilterCondition
		: T extends "boolean"
			? BooleanFilterCondition
			: T extends "select"
				? SelectFilterCondition
				: T extends "multi-select"
					? MultiSelectFilterCondition
					: T extends "relation"
						? RelationFilterCondition
						: T extends "relation-multi"
							? RelationMultiFilterCondition
							: T extends "date"
								? DateFilterCondition
								: T extends "date-range"
									? DateRangeFilterCondition
									: never

/** Picks each field in `Fields` and pins `fieldId` to that field's id. */
type NarrowedConditionForField<
	F extends { id: string; type: FilterFieldType },
> = Omit<ConditionForType<F["type"]>, "fieldId"> & { fieldId: F["id"] }

/**
 * Given a caller's `filterFields` tuple, produces the narrow
 * `FilterCondition` union where `fieldId`, `operator`, and `value` all
 * correlate — so `{ fieldId: "status", operator: "is", value: true }`
 * type-checks, but `{ fieldId: "status", operator: "eq", value: "x" }`
 * does not.
 */
export type FilterConditionFor<
	Fields extends readonly { id: string; type: FilterFieldType }[],
> = Fields extends readonly (infer F)[]
	? F extends { id: string; type: FilterFieldType }
		? NarrowedConditionForField<F>
		: never
	: never

/** Narrow sort rule — `fieldId` must be one of the caller's sortOptions ids. */
export type SortRuleFor<Opts extends readonly { fieldId: string }[]> = {
	fieldId: Opts[number]["fieldId"]
	direction: SortDirection
}

/** String-literal union of all filter field ids in the tuple. */
export type FilterFieldId<Fields extends readonly { id: string }[]> =
	Fields[number]["id"]

/** String-literal union of all sort option field ids in the tuple. */
export type SortFieldId<Opts extends readonly { fieldId: string }[]> =
	Opts[number]["fieldId"]

/**
 * A `SavedView` (for `views.builtinViews`) narrowed against the caller's
 * filter fields + sort options — so view state is validated at compile time.
 */
export type TypedSavedView<
	Fields extends readonly { id: string; type: FilterFieldType }[],
	Opts extends readonly { fieldId: string }[],
> = {
	id: string
	name: string
	icon?: string | undefined
	isDefault?: boolean | undefined
	isFavorite?: boolean | undefined
	isBuiltin?: boolean | undefined
	state: {
		search: string
		filters: FilterConditionFor<Fields>[]
		sort: SortRuleFor<Opts>[]
	}
	createdAt: string
	updatedAt: string
}

/** Optional full-text search config — renders a prominent always-on input */
export type SearchConfig<TWhere> = {
	placeholder?: string | undefined
	toWhere?: ((query: string) => Partial<TWhere>) | undefined
}

// ──────────────────────────────────────────────────────────────────────────
// Row actions
// ──────────────────────────────────────────────────────────────────────────

export type ActionMutationConfig = {
	/** React Query mutation key */
	key: string[]
	fn: () => Promise<unknown>
	confirmTitle?: string | undefined
	confirmMessage?: string | undefined
	confirmButtonLabel?: string | undefined
	onSuccess?: (() => void) | undefined
	onError?: ((err: Error) => void) | undefined
}

export type ActionItem =
	| {
			label: string
			icon?: React.ComponentType<{ className?: string }> | undefined
			onAction: () => void
			disabled?: boolean | undefined
			destructive?: boolean | undefined
	  }
	| {
			label: string
			icon?: React.ComponentType<{ className?: string }> | undefined
			url: string
			disabled?: boolean | undefined
			destructive?: boolean | undefined
	  }
	| {
			label: string
			icon?: React.ComponentType<{ className?: string }> | undefined
			mutation: ActionMutationConfig
			disabled?: boolean | undefined
			destructive?: boolean | undefined
	  }

/** Context handed to row-action factories — gives access to refetch */
export type TableCtx = {
	refetch: () => void
}

/**
 * Rich context exposed to custom toolbar render functions.
 * Lets callers build pluggable toolbar items (Export, Bulk action,
 * Refresh button, etc.) that need access to data + filter state.
 */
export type ToolbarCtx<TNode, TWhere = unknown> = {
	/** Rows currently rendered (this page only). */
	nodes: TNode[]
	/** Total row count when the backend exposes it on the connection. */
	totalCount: number | null
	/** Composed WhereInput from filters + search (matches what the
	 *  current query is using). */
	where: TWhere | undefined
	/** OrderBy array as the queryFn would receive it. */
	orderBy: QueryOrderBy[]
	/** Live `TableState` snapshot. */
	state: TableState
	/** Refetch the current page. */
	refetch: () => void
	/**
	 * Imperatively fetch ALL rows matching the current filters/sort,
	 * paging through cursors internally. Use this for CSV/JSON export.
	 *
	 * @param batchSize  page size used for the iteration, default 100
	 * @param maxRows    hard cap; stops fetching once accumulated rows hit it
	 * @param signal     optional AbortSignal to cancel mid-fetch
	 */
	fetchAll: (options?: {
		batchSize?: number | undefined
		maxRows?: number | undefined
		signal?: AbortSignal | undefined
	}) => Promise<TNode[]>
	/** Whether a network request is in flight right now. */
	isFetching: boolean
}

/** Toolbar slot — either static JSX or a function rendered with the live ctx. */
export type ToolbarRender<TNode, TWhere = unknown> =
	| React.ReactNode
	| ((ctx: ToolbarCtx<TNode, TWhere>) => React.ReactNode)

// ──────────────────────────────────────────────────────────────────────────
// Layouts — pluggable data presentation (table / cards / custom)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Context handed to a custom layout's render function.
 * Everything the layout needs to draw a row + react to load/empty states.
 */
export type LayoutCtx<TNode> = {
	/** Current page rows. */
	nodes: TNode[]
	/** Visible columns, in user-applied order. Layouts can use these for
	 *  field-driven rendering or ignore them and render bespoke content. */
	columns: DataTableColumn<TNode>[]
	/** True only on the very first load when there's no data yet. */
	isLoading: boolean
	/** True for any in-flight network request (initial OR re-fetch). */
	isFetching: boolean
	/** True when search/filter has reduced the result set (drives empty UX). */
	isFiltered: boolean
	/** Stable row id (for React keys and Copy ID). */
	getRowId: (row: TNode) => string
	/** Build action items for a row. May return [] to hide actions. */
	rowActions?: ((row: TNode) => ActionItem[]) | undefined
	/** Pre-built EmptyState element to render when nodes.length === 0. */
	emptyState: React.ReactNode
	/** Pre-built loading skeleton element to render while isLoading. */
	loadingState: React.ReactNode
	/** "compact" | "comfortable" — useful for cards/list layouts. */
	density: "compact" | "comfortable"
}

/**
 * One renderable layout.
 *
 * The built-in "table" layout (Excel-grid) is always present implicitly.
 * Pass extra layouts via the `layouts` prop to enable a layout switcher
 * in the toolbar — e.g. cards, compact list, kanban, gallery.
 */
export type DataTableLayout<TNode> = {
	/** Stable id ("cards", "kanban", etc.). Reserved: "table". */
	id: string
	label: string
	icon?: React.ComponentType<{ className?: string }> | undefined
	render: (ctx: LayoutCtx<TNode>) => React.ReactNode
}

// ──────────────────────────────────────────────────────────────────────────
// Query args
// ──────────────────────────────────────────────────────────────────────────

export type QueryOrderBy = {
	direction: "ASC" | "DESC"
	field: string
}

export type QueryArgs<TWhere> = {
	where: TWhere | undefined
	orderBy: QueryOrderBy[]
	first?: number | null | undefined
	last?: number | null | undefined
	after?: string | null | undefined
	before?: string | null | undefined
}

export type QueryFn<TNode, TWhere> = (
	args: QueryArgs<TWhere>,
) => Promise<Connection<TNode>>

// ──────────────────────────────────────────────────────────────────────────
// Table state — single source of truth
// ──────────────────────────────────────────────────────────────────────────

export type TableState = {
	search: string
	filters: FilterCondition[]
	sort: SortRule[]
	pagination: PaginationState
	/** Active saved view id, if any */
	viewId: string | null
	/** Column ids the user has hidden. New columns default visible. */
	hiddenColumns: string[]
	/** Per-column width override (px). Empty = auto-sizing. */
	columnSizes: Record<string, number>
	/** Explicit column order. Empty = caller-defined order. */
	columnOrder: string[]
	/** Rows per page. Defaults to DataTableConfig.pageSize. */
	pageSize: number
	/** Active layout id ("table" or any caller-provided layout id). */
	layoutId: string
	/** Group-by columns (in order). */
	groupBy: string[]
	/** Columns shown in the expanded row detail; null = the config default. */
	detailColumns: string[] | null
}

// ──────────────────────────────────────────────────────────────────────────
// Top-level config
// ──────────────────────────────────────────────────────────────────────────

export type DataTableConfig<
	TNode,
	TWhere,
	/**
	 * Caller's `filterFields` tuple — inferred via the `const` generic
	 * modifier on `DataTable`. When literal ids/types are preserved,
	 * `views.builtinViews` filters are verified against them.
	 */
	FFields extends
		readonly FilterFieldDef<TWhere>[] = readonly FilterFieldDef<TWhere>[],
	/**
	 * Caller's `sortOptions` tuple — inferred via the `const` generic
	 * modifier. Narrows `defaultSort` and `views.builtinViews` sort rules.
	 */
	SOpts extends readonly SortOption[] = readonly SortOption[],
> = {
	/** Stable cache key prefix, e.g. "aiModels" */
	queryKey: string
	/** Build & execute the query for the given state args. */
	queryFn: QueryFn<TNode, TWhere>
	/** Data-aware polling: return an interval in ms while any visible row needs
	 * live updates (e.g. a queued/running run), false to stop. Omit = no poll. */
	refetchInterval?: ((nodes: TNode[]) => number | false) | undefined
	/** Column definitions. See `DataTableColumn`. */
	columns: DataTableColumn<TNode>[]

	/** Optional caller-supplied function to build a unique row id */
	getRowId?: ((row: TNode) => string) | undefined

	/**
	 * Per-row class string. Receives the row + index, returns extra classes
	 * applied to the `<tr>` — useful for left-border accents that signal
	 * row category (parent vs variant, status, etc.) without adding a column.
	 */
	rowClassName?: (row: TNode, rowIndex: number) => string | undefined

	/** Filter field definitions — when provided, renders the filter bar */
	filterFields?: FFields | undefined

	/** Full-text search — renders a prominent always-on input */
	search?: SearchConfig<TWhere> | undefined

	/** Sort options — when provided, renders the sort dropdown */
	sortOptions?: SOpts | undefined
	/** Initial sort applied on mount — `fieldId` must be one of `sortOptions`. */
	defaultSort?: readonly SortRuleFor<SOpts>[] | undefined

	/** Default page size for cursor pagination. Default 20. */
	pageSize?: number | undefined

	/** Options shown in the page-size selector. Default [10, 20, 50, 100]. */
	pageSizeOptions?: number[] | undefined

	/** Row actions — render dropdown on each row */
	rowActions?: ((row: TNode, ctx: TableCtx) => ActionItem[]) | undefined

	/** Empty/loading/error UX */
	emptyMessage?: string | undefined
	emptyDescription?: string | undefined
	emptyAction?: ReactNode | undefined

	/** Visual tuning */
	density?: "compact" | "comfortable" | undefined
	stickyHeader?: boolean | undefined
	className?: string | undefined

	/** Allow drag-to-resize on column borders. Default: true. */
	enableColumnResize?: boolean | undefined
	/** Allow drag-to-reorder column headers. Default: true. */
	enableColumnReorder?: boolean | undefined

	/** Saved views config — when provided, renders the views dropdown.
	 *  `builtinViews` filters/sort are narrowed against `filterFields` /
	 *  `sortOptions` when those literals are preserved. */
	views?: ViewsConfig<FFields, SOpts> | undefined

	/** URL state sync via react-router useSearchParams. Default: true. */
	urlState?: boolean | { namespace?: string } | undefined

	/**
	 * Pluggable toolbar slot. Renders to the left of Sort/Columns/Views.
	 * Pass a function to receive the live table context — useful for
	 * Export buttons, refresh actions, bulk operations, etc.
	 *
	 * @example
	 *   toolbar={(ctx) => (
	 *     <Button onClick={async () => downloadCsv(await ctx.fetchAll())}>
	 *       Export
	 *     </Button>
	 *   )}
	 */
	toolbar?: ToolbarRender<TNode, TWhere> | undefined

	/**
	 * Extra layouts that callers can switch to. The built-in "table" layout
	 * is always available — `layouts` adds to it.
	 * When set (and non-empty), a layout switcher renders in the toolbar.
	 */
	layouts?: DataTableLayout<TNode>[] | undefined

	/**
	 * Initial layout id. Default: "table". Set to a custom layout id to
	 * have the page open in cards/grid/kanban etc. by default.
	 */
	defaultLayout?: string | undefined
}

/** Saved views config — see ./views/storage/ViewStorage */
export type ViewsConfig<
	FFields extends
		readonly FilterFieldDef<unknown>[] = readonly FilterFieldDef<unknown>[],
	SOpts extends readonly SortOption[] = readonly SortOption[],
> = {
	/** Custom storage adapter; defaults to LocalStorageViewStorage */
	storage?: import("./views/storage/ViewStorage").ViewStorage | undefined
	/** Override the storage scope key (defaults to queryKey) */
	scope?: string | undefined
	/**
	 * Built-in views shipped via config (always present, can't be deleted).
	 * Filters and sort rules are narrowed against the caller's `filterFields`
	 * and `sortOptions` when those literals are preserved (via the `const`
	 * generic on `DataTable`).
	 */
	builtinViews?: TypedSavedView<FFields, SOpts>[] | undefined
}
