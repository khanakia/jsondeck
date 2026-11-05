/**
 * The one resolve step. Pure: no React. Guessed spec deep-merged with config;
 * everything downstream reads only the resolved spec. Each setting falls back:
 * column config → table config → global config → guess → built-in default.
 * Validation runs here too: bad keys/values become Issues and are skipped,
 * so the rest still renders.
 */
import type { FilterCondition, FilterOperator, SortRule } from "../sdt/types"
import {
	ALIGNS,
	type Align,
	BUILTIN_TYPES,
	COLUMN_KEYS,
	type ColumnConfig,
	type Comparator,
	FILTER_KINDS,
	type FilterKind,
	type FormatFn,
	GLOBAL_KEYS,
	GUESS_KEYS,
	type ResolvedGuess,
	type JsonDeckConfig,
	PINS,
	type Pin,
	type RenderFn,
	type Row,
	type SortKind,
	TABLE_KEYS,
	type TableConfig,
	THEMES,
	type Theme,
	TYPE_ALIASES,
	TYPEDEF_KEYS,
	type TypeDef,
	type DetailConfig,
	DENSITIES,
	type Density,
	GROUP_AGGREGATES,
	type GroupAggregate,
	QUICK_FILTER_KINDS,
	type QuickFilterConfig,
	type RelationConfig,
	type RowActionConfig,
	type ViewsConfig,
} from "./config"
import { BUILTIN_FORMATS, parseFormat } from "./formats"
import { CLASS_SLOTS, type ClassNames, TOKEN_NAMES, type ThemeTokens } from "./theme-tokens"
import { collectKeys, DEFAULT_GUESS, enumValues, guessType, isEmpty } from "./guess"
import { DEFAULT_ACRONYMS, DEFAULT_LABELS, humanize, type Labels } from "./labels"
import { issue, type RawIssue, sameIssue } from "./validate"

/** Built-in per-type defaults (the last fallback). */
type TypeDefault = { align: Align; filter: FilterKind; sort: SortKind; width?: number; tooltip?: boolean }
const TEXT_DEFAULT: TypeDefault = { align: "left", filter: "text", sort: "text" }
const TYPE_DEFAULTS: Record<string, TypeDefault> = {
	text: TEXT_DEFAULT,
	mono: { align: "left", filter: "text", sort: "text" },
	longtext: { align: "left", filter: "text", sort: "text", width: 320, tooltip: true },
	number: { align: "right", filter: "number", sort: "number", width: 90 },
	date: { align: "left", filter: "date-range", sort: "text", width: 104 },
	datetime: { align: "left", filter: "date-range", sort: "text", width: 140 },
	url: { align: "left", filter: "text", sort: "text", width: 220, tooltip: true },
	ip: { align: "left", filter: "text", sort: "text", width: 130 },
	email: { align: "left", filter: "text", sort: "text", width: 200 },
	boolean: { align: "left", filter: "boolean", sort: "text", width: 80 },
	enum: { align: "left", filter: "multi-select", sort: "text" },
	json: { align: "left", filter: "text", sort: "text", width: 240, tooltip: true },
}
export const DEFAULT_PAGE_SIZES = [25, 50, 100, 250]
export const DEFAULT_PAGE_SIZE = 50
/** Auto width: px per character at 13px, padding + header button, and bounds. */
const AUTO_WIDTH = { charPx: 7, pad: 40, min: 80, max: 260, sample: 500 }
/** Header: uppercase 10px tracked letters (~7.5px each) + sort marker, sort index and column menu (~60px). */
const HEADER_WIDTH = { charPx: 7.5, pad: 60 }
/** Enum badges: ~6.5px per character + badge padding, capped a little wider than text. */
const BADGE_WIDTH = { charPx: 6.8, pad: 52, max: 300 }

export type ResolvedFilter = false | { type: FilterKind; options?: { value: string; label: string }[] | undefined; operators?: FilterOperator[] | undefined }

export type ResolvedColumn = {
	id: string
	label: string
	type: string
	/** True when the column comes from `value(row)`, not the data. */
	computed: boolean
	hidden: boolean
	width: number
	minWidth?: number | undefined
	pin?: Pin | undefined
	align: Align
	wrap: boolean
	className?: string | undefined
	tooltip: boolean | ((value: unknown, row: Row) => string)
	format?: (string | ((value: unknown, row: Row) => string)) | undefined
	render?: RenderFn | undefined
	link?: (string | ((row: Row) => string)) | undefined
	order?: string[] | undefined
	colors?: Record<string, string> | undefined
	/** Distinct values (enum/boolean), for filter options. */
	values?: string[] | undefined
	filter: ResolvedFilter
	sort: false | SortKind | Comparator
	search: boolean
	/** Set when a relation starts at this column: values link to rows of `table` whose `field` matches. */
	relation?: { table: string; field: string } | undefined
}

export type ResolvedTable = {
	name: string
	label: string
	key?: string | undefined
	/** Rows with computed column values filled in. */
	rows: Row[]
	/** Display order (pinned-left first, pinned-right last). */
	columns: ResolvedColumn[]
	pageSize: number
	pageSizes: number[]
	search: false | { columns: string[] }
	filters: boolean
	views: false | ViewsConfig
	defaultSort: SortRule[]
	defaultFilters: FilterCondition[]
	rowClass?: ((row: Row) => string | undefined) | undefined
	onRowClick?: ((row: Row) => void) | undefined
	expand: false | "inline" | "drawer"
	/** Expand shows this relation's rows (by label) instead of the field grid. */
	expandRelation?: string | undefined
	detail?: DetailConfig | undefined
	groupBy: string[]
	groupAggregates: Record<string, GroupAggregate>
	quickFilters: QuickFilterConfig[]
	selectable: boolean
	rowActions: RowActionConfig[]
	density: Density
	classNames: ClassNames
	cellClass?: ((row: Row, column: string) => string | undefined) | undefined
}

export type ResolvedDeck = {
	/** Token overrides per mode (applied as --jds-* on the root). */
	tokens: { light: ThemeTokens; dark: ThemeTokens }
	classNames: ClassNames
	palette?: string[] | undefined
	statusColors: Record<string, string>

	/** The arrays from config.data, by table name (rows without computed values). */
	datasets: Record<string, Row[]>
	/** Table configs as written, for per-placement resolution (resolvePlacement). */
	tableConfigs: Record<string, TableConfig>
	/** The config as given (data resolved), for placements and pages. */
	config: JsonDeckConfig
	relations: RelationConfig[]

	theme: Theme
	tables: ResolvedTable[]
	labels: Labels
	formats: Record<string, FormatFn>
	renderers: Record<string, RenderFn>
	types: Record<string, TypeDef>
	guess: ResolvedGuess
	acronyms: string[]
	pageSizes: number[]
	issues: RawIssue[]
}

const isObj = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v)
const isFn = (v: unknown): v is (...a: never[]) => unknown => typeof v === "function"

function checkKeys(obj: Record<string, unknown>, allowed: string[], path: string, issues: RawIssue[]) {
	for (const k of Object.keys(obj)) if (!allowed.includes(k)) issues.push(issue(`${path}${path ? "." : ""}${k}`, "key", k, allowed))
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], path: string, issues: RawIssue[]): T | undefined {
	if (v === undefined) return undefined
	if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T
	issues.push(issue(path, "oneOf", typeof v === "string" ? v : undefined, allowed))
	return undefined
}

function posNum(v: unknown, path: string, issues: RawIssue[]): number | undefined {
	if (v === undefined) return undefined
	if (typeof v === "number" && v > 0 && Number.isFinite(v)) return v
	issues.push(issue(path, "posNum"))
	return undefined
}

/** Keep only arrays; a top-level array becomes one table named "rows". */
export function toTableData(data: unknown): Record<string, Row[]> {
	const obj = Array.isArray(data) ? { rows: data } : isObj(data) ? data : {}
	const out: Record<string, Row[]> = {}
	for (const [name, v] of Object.entries(obj)) {
		if (!Array.isArray(v)) continue
		out[name] = v.map((r) => (isObj(r) ? (r as Row) : { value: r }))
	}
	return out
}

/** Starting width: fits the header label (with its sort marker) and the longest sampled value. */
function autoWidth(label: string, values: unknown[], type: string): number {
	let longest = 0
	for (let i = 0; i < Math.min(values.length, AUTO_WIDTH.sample); i++) {
		const v = values[i]
		longest = Math.max(longest, isEmpty(v) ? 0 : typeof v === "object" ? 20 : String(v).length)
	}
	const header = label.length * HEADER_WIDTH.charPx + HEADER_WIDTH.pad
	const content = type === "enum" ? Math.min(BADGE_WIDTH.max, longest * BADGE_WIDTH.charPx + BADGE_WIDTH.pad) : Math.min(AUTO_WIDTH.max, longest * AUTO_WIDTH.charPx + AUTO_WIDTH.pad)
	return Math.round(Math.max(AUTO_WIDTH.min, header, content))
}

function parseSort(s: unknown, cols: Set<string>, path: string, issues: RawIssue[]): SortRule | null {
	let column: string | undefined
	let direction: "asc" | "desc" = "asc"
	if (typeof s === "string") {
		column = s.startsWith("-") ? s.slice(1) : s
		direction = s.startsWith("-") ? "desc" : "asc"
	} else if (isObj(s) && typeof s.column === "string") {
		column = s.column
		direction = s.direction === "desc" ? "desc" : "asc"
	}
	if (!column) {
		issues.push(issue(path, "sortShape"))
		return null
	}
	if (!cols.has(column)) {
		issues.push(issue(path, "noColumnQ", column, [...cols]))
		return null
	}
	return { fieldId: column, direction }
}

/** Resolve one column. Precedence: column cfg → registered type → guess → built-in default. */
function resolveColumn(
	id: string,
	raw: ColumnConfig | string | undefined,
	rows: Row[],
	deck: Pick<ResolvedDeck, "types" | "guess" | "acronyms" | "formats">,
	path: string,
	issues: RawIssue[],
): ResolvedColumn {
	const cfg: ColumnConfig = typeof raw === "string" ? { type: raw } : isObj(raw) ? (raw as ColumnConfig) : {}
	if (raw !== undefined && typeof raw !== "string" && !isObj(raw)) issues.push(issue(path, "typeOrObj"))
	if (isObj(raw)) checkKeys(raw, COLUMN_KEYS, path, issues)
	const computed = isFn(cfg.value)
	const values = rows.slice(0, deck.guess.sampleSize).map((r) => r[id])
	const guessed = guessType(values, deck.guess)

	// Type: column cfg (with aliases, must be built-in or registered) → guess.
	let type = guessed.type
	if (cfg.type !== undefined) {
		const t = TYPE_ALIASES[cfg.type] ?? cfg.type
		if ((BUILTIN_TYPES as readonly string[]).includes(t) || t in deck.types) type = t
		else issues.push(issue(`${path}.type`, "unknownType", cfg.type, [...BUILTIN_TYPES, ...Object.keys(TYPE_ALIASES), ...Object.keys(deck.types)]))
	}
	const td: TypeDef = deck.types[type] ?? {}
	const base = TYPE_DEFAULTS[type] ?? TEXT_DEFAULT

	// Enum values and order.
	let order = Array.isArray(cfg.order) ? cfg.order.map(String) : undefined
	let distinct: string[] | undefined
	if (type === "enum" || type === "boolean") {
		const strs = values.filter((v) => !isEmpty(v)).map(String)
		const ev = type === "boolean" ? { values: ["true", "false"] } : enumValues(strs, deck.guess.knownOrders)
		distinct = ev.values
		order = order ?? ("order" in ev ? ev.order : undefined)
		if (order) {
			const o = order
			distinct = [...distinct].sort((a, b) => rank(o, a) - rank(o, b))
		}
	}

	if (cfg.colors !== undefined) {
		if (!isObj(cfg.colors)) issues.push(issue(`${path}.colors`, "colorsObj"))
		else for (const [v, c] of Object.entries(cfg.colors)) if (typeof c !== "string") issues.push(issue(`${path}.colors.${v}`, "tone"))
	}

	// Format: name must exist.
	let format: ResolvedColumn["format"] = cfg.format ?? (typeof td.format === "string" ? td.format : undefined)
	if (typeof format === "string") {
		const { name } = parseFormat(format)
		if (!(name in deck.formats)) {
			issues.push(issue(`${path}.format`, "unknownFormat", name, Object.keys(deck.formats)))
			format = undefined
		}
	} else if (format !== undefined && !isFn(format)) {
		issues.push(issue(`${path}.format`, "formatShape"))
		format = undefined
	}
	if (format === undefined && isFn(td.format)) {
		const f = td.format
		format = (v, row) => f(v, undefined, row)
	}

	// Filter: column cfg → type def → built-in.
	let filter: ResolvedFilter
	const fc = cfg.filter
	const typeFilter = td.filter === false ? false : (td.filter ?? base.filter)
	if (fc === false || (fc === undefined && typeFilter === false)) filter = false
	else {
		const kind = typeof fc === "string" ? oneOf(fc, FILTER_KINDS, `${path}.filter`, issues) : isObj(fc) ? oneOf(fc.type, FILTER_KINDS, `${path}.filter.type`, issues) : undefined
		const ftype: FilterKind = kind ?? (typeFilter as FilterKind)
		const optsRaw = isObj(fc) && Array.isArray(fc.options) ? fc.options : undefined
		const options = (optsRaw?.map((o) => (typeof o === "string" ? { value: o, label: o } : { value: String(o.value), label: String(o.label ?? o.value) })) ??
			(ftype === "select" || ftype === "multi-select" ? (distinct ?? enumValues(values.filter((v) => !isEmpty(v)).map(String), []).values).map((v) => ({ value: v, label: v })) : undefined))
		const operators = isObj(fc) && Array.isArray(fc.operators) ? (fc.operators as FilterOperator[]) : undefined
		filter = { type: ftype, options, operators }
	}

	// Sort: column cfg → type def → enum order → built-in.
	let sort: ResolvedColumn["sort"]
	if (cfg.sort === false) sort = false
	else if (isFn(cfg.sort)) sort = cfg.sort as Comparator
	else if (cfg.sort !== undefined) {
		issues.push(issue(`${path}.sort`, "sortFn"))
		sort = base.sort
	} else if (td.sort !== undefined) sort = td.sort
	else sort = order ? "order" : base.sort

	const label = typeof cfg.label === "string" ? cfg.label : humanize(id, deck.acronyms)
	return {
		id,
		label,
		type,
		computed,
		hidden: cfg.hidden === true,
		// A type's default width still grows to fit the header label ("PROXIED" with its sort marker).
		width: posNum(cfg.width, `${path}.width`, issues) ?? Math.max(td.width ?? base.width ?? 0, autoWidth(label, td.width ?? base.width ? [] : values, type)),
		minWidth: posNum(cfg.minWidth, `${path}.minWidth`, issues),
		pin: oneOf(cfg.pin, PINS, `${path}.pin`, issues),
		align: oneOf(cfg.align, ALIGNS, `${path}.align`, issues) ?? td.align ?? base.align,
		wrap: cfg.wrap === true,
		className: typeof cfg.className === "string" ? cfg.className : undefined,
		tooltip: cfg.tooltip ?? base.tooltip ?? false,
		format,
		render: isFn(cfg.render) ? cfg.render : undefined,
		link: typeof cfg.link === "string" || isFn(cfg.link) ? cfg.link : undefined,
		order,
		colors: isObj(cfg.colors) ? (cfg.colors as Record<string, string>) : undefined,
		values: distinct,
		filter,
		sort,
		search: cfg.search !== false,
	}
}

function rank(order: string[], v: string): number {
	const i = order.indexOf(v)
	return i < 0 ? order.length : i
}

let filterSeq = 0

/** Resolve one table. */
type DeckBase = Pick<ResolvedDeck, "types" | "guess" | "acronyms" | "formats" | "pageSizes" | "relations">

function resolveTable(name: string, rows: Row[], raw: TableConfig | undefined, cfg: JsonDeckConfig, deck: DeckBase, issues: RawIssue[], path = `tables.${name}`): ResolvedTable | null {
	const t: TableConfig = isObj(raw) ? raw : {}
	if (raw !== undefined && !isObj(raw)) issues.push(issue(path, "object"))
	if (isObj(raw)) checkKeys(raw, TABLE_KEYS, path, issues)
	if (t.hidden === true) return null

	const dataKeys = collectKeys(rows, deck.guess.sampleSize)
	const colCfg: Record<string, ColumnConfig | string> = { ...(isObj(t.columns) ? t.columns : {}) }
	if (isObj(t.computed)) for (const [id, c] of Object.entries(t.computed)) colCfg[id] = c
	// Computed columns: config ids not in the data that have value(row).
	const computedIds = Object.keys(colCfg).filter((id) => !dataKeys.includes(id) && isObj(colCfg[id]) && isFn((colCfg[id] as ColumnConfig).value))
	for (const id of Object.keys(colCfg))
		if (!dataKeys.includes(id) && !computedIds.includes(id))
			issues.push(issue(`${path}.columns.${id}`, "noColumn", id, dataKeys))

	// Materialise computed values so filter/sort/search treat them like data.
	const fullRows = computedIds.length
		? rows.map((r) => {
				const out: Row = { ...r }
				for (const id of computedIds) {
					try {
						out[id] = (colCfg[id] as ColumnConfig).value?.(r)
					} catch {
						out[id] = null
					}
				}
				return out
			})
		: rows

	let ids = [...dataKeys, ...computedIds]
	const checkList = (v: unknown, key: string): string[] | undefined => {
		if (v === undefined) return undefined
		if (!Array.isArray(v)) {
			issues.push(issue(`${path}.${key}`, "idList"))
			return undefined
		}
		const ok: string[] = []
		for (const id of v) {
			if (ids.includes(String(id))) ok.push(String(id))
			else issues.push(issue(`${path}.${key}`, "noColumnQ", String(id), ids))
		}
		return ok
	}
	const include = checkList(t.include, "include")
	const exclude = checkList(t.exclude, "exclude")
	const columnOrder = checkList(t.columnOrder, "columnOrder")
	if (include) ids = ids.filter((id) => include.includes(id) || computedIds.includes(id))
	if (exclude) ids = ids.filter((id) => !exclude.includes(id))
	if (columnOrder) ids = [...columnOrder.filter((id) => ids.includes(id)), ...ids.filter((id) => !columnOrder.includes(id))]

	let columns = ids.map((id) => resolveColumn(id, colCfg[id], fullRows, deck, `${path}.columns.${id}`, issues))
	columns = [...columns.filter((c) => c.pin === "left"), ...columns.filter((c) => !c.pin), ...columns.filter((c) => c.pin === "right")]
	for (const r of deck.relations) {
		const [ft, ...fp] = r.from.split(".")
		const [tt, ...tp] = r.to.split(".")
		const col = ft === name ? columns.find((c) => c.id === fp.join(".")) : undefined
		if (col && tt) col.relation = { table: tt, field: tp.join(".") }
	}
	const colSet = new Set(columns.map((c) => c.id))

	let key: string | undefined
	if (t.key !== undefined) {
		if (typeof t.key === "string" && colSet.has(t.key)) key = t.key
		else issues.push(issue(`${path}.key`, "noColumnQ", String(t.key), [...colSet]))
	}

	let search: ResolvedTable["search"] = { columns: columns.filter((c) => c.search).map((c) => c.id) }
	if (t.search === false) search = false
	else if (isObj(t.search)) {
		const list = checkList(t.search.columns, "search.columns")
		if (list) search = { columns: list }
	} else if (t.search !== undefined) issues.push(issue(`${path}.search`, "searchShape"))

	const defaultSort = Array.isArray(t.defaultSort)
		? t.defaultSort.map((s, i) => parseSort(s, colSet, `${path}.defaultSort[${i}]`, issues)).filter((s): s is SortRule => !!s)
		: []
	if (t.defaultSort !== undefined && !Array.isArray(t.defaultSort)) issues.push(issue(`${path}.defaultSort`, "list"))

	const defaultFilters: FilterCondition[] = []
	if (Array.isArray(t.defaultFilters)) {
		t.defaultFilters.forEach((f, i) => {
			const p = `${path}.defaultFilters[${i}]`
			if (!isObj(f) || typeof f.column !== "string") return issues.push(issue(p, "filterShape"))
			const col = columns.find((c) => c.id === f.column)
			if (!col) return issues.push(issue(`${p}.column`, "noColumnQ", f.column, [...colSet]))
			if (!col.filter) return issues.push(issue(p, "filterOff", f.column))
			const multi = col.filter.type === "multi-select"
			const operator = (f.operator as FilterOperator | undefined) ?? (multi ? "in" : col.filter.type === "number" ? "eq" : col.filter.type === "boolean" ? "is" : "contains")
			const value = multi && !Array.isArray(f.value) && f.value !== undefined ? [f.value] : f.value
			filterSeq += 1
			defaultFilters.push({ id: `df${filterSeq}`, fieldId: f.column, operator, value })
		})
	} else if (t.defaultFilters !== undefined) issues.push(issue(`${path}.defaultFilters`, "list"))

	const pageSizes = deck.pageSizes
	return {
		name,
		label: typeof t.label === "string" ? t.label : humanize(name, deck.acronyms),
		key,
		rows: fullRows,
		columns,
		pageSize: posNum(t.pageSize, `${path}.pageSize`, issues) ?? posNum(cfg.pageSize, "pageSize", []) ?? DEFAULT_PAGE_SIZE,
		pageSizes,
		search,
		filters: t.filters !== false,
		views: t.views !== undefined ? t.views : cfg.views !== undefined ? cfg.views : {},
		defaultSort,
		defaultFilters,
		rowClass: isFn(t.rowClass) ? t.rowClass : undefined,
		onRowClick: isFn(t.onRowClick) ? t.onRowClick : undefined,
		expand: t.expand === false ? false : t.expand === "drawer" ? "drawer" : t.expand === "inline" || isObj(t.expand) || isObj(t.detail) ? "inline" : false,
		expandRelation: isObj(t.expand) && typeof t.expand.relation === "string" ? t.expand.relation : undefined,
		detail: isObj(t.detail) ? t.detail : undefined,
		groupBy: (typeof t.groupBy === "string" ? [t.groupBy] : Array.isArray(t.groupBy) ? t.groupBy : []).filter((c) => colSet.has(c) || !issues.push(issue(`${path}.groupBy`, "noColumnQ", c, [...colSet]))),
		groupAggregates: Object.fromEntries(
			Object.entries(isObj(t.groupAggregates) ? t.groupAggregates : {}).filter(
				([c, a]) => (colSet.has(c) && (GROUP_AGGREGATES as readonly string[]).includes(a)) || !issues.push(colSet.has(c) ? issue(`${path}.groupAggregates.${c}`, "oneOf", undefined, GROUP_AGGREGATES) : issue(`${path}.groupAggregates.${c}`, "noColumn", c, [...colSet])),
			),
		),
		quickFilters: (Array.isArray(t.quickFilters) ? t.quickFilters : []).filter(
			(q, i) =>
				(isObj(q) && colSet.has(q.column) && (QUICK_FILTER_KINDS as readonly string[]).includes(q.kind)) ||
				!issues.push(isObj(q) && !colSet.has(q.column) ? issue(`${path}.quickFilters[${i}]`, "noColumnQ", String(q.column)) : issue(`${path}.quickFilters[${i}]`, "quickShape")),
		),
		selectable: t.selectable === true,
		classNames: classNamesOf(t.classNames, `${path}.classNames`, issues),
		cellClass: isFn(t.cellClass) ? t.cellClass : undefined,
		density: oneOf(t.density, DENSITIES, `${path}.density`, issues) ?? oneOf(cfg.density, DENSITIES, "density", []) ?? "compact",
		rowActions: Array.isArray(t.rowActions) ? t.rowActions.filter((a) => isObj(a) && typeof a.label === "string" && isFn(a.onSelect)) : [],
	}
}

/** Data + config → the fully resolved deck (plus every config issue found). */
export function resolveDeck(config: Partial<JsonDeckConfig> = {}): ResolvedDeck {
	const issues: RawIssue[] = []
	const cfg = (isObj(config) ? config : {}) as JsonDeckConfig
	checkKeys(cfg, GLOBAL_KEYS, "", issues)

	const g = isObj(cfg.guess) ? cfg.guess : {}
	if (isObj(cfg.guess)) checkKeys(cfg.guess, GUESS_KEYS, "guess", issues)
	const guess: ResolvedGuess = {
		enumMaxDistinct: posNum(g.enumMaxDistinct, "guess.enumMaxDistinct", issues) ?? DEFAULT_GUESS.enumMaxDistinct,
		enumMaxRatio: posNum(g.enumMaxRatio, "guess.enumMaxRatio", issues) ?? DEFAULT_GUESS.enumMaxRatio,
		enumMaxLen: posNum(g.enumMaxLen, "guess.enumMaxLen", issues) ?? DEFAULT_GUESS.enumMaxLen,
		longTextLen: posNum(g.longTextLen, "guess.longTextLen", issues) ?? DEFAULT_GUESS.longTextLen,
		sampleSize: posNum(g.sampleSize, "guess.sampleSize", issues) ?? DEFAULT_GUESS.sampleSize,
		knownOrders: Array.isArray(g.knownOrders) ? g.knownOrders : DEFAULT_GUESS.knownOrders,
		detectors: Array.isArray(g.detectors) ? g.detectors.filter((d, i) => (isObj(d) && typeof d.type === "string" && isFn(d.test)) || !issues.push(issue(`guess.detectors[${i}]`, "detector"))) : [],
	}

	const types: Record<string, TypeDef> = {}
	if (isObj(cfg.types))
		for (const [name, td] of Object.entries(cfg.types)) {
			if (!isObj(td)) {
				issues.push(issue(`types.${name}`, "object"))
				continue
			}
			checkKeys(td, TYPEDEF_KEYS, `types.${name}`, issues)
			types[name] = td as TypeDef
		}
	for (const d of guess.detectors)
		if (!(BUILTIN_TYPES as readonly string[]).includes(d.type) && !(d.type in types))
			issues.push(issue("guess.detectors", "detectorType", d.type))

	const labels = { ...DEFAULT_LABELS }
	if (isObj(cfg.labels))
		for (const [k, v] of Object.entries(cfg.labels)) {
			if (!(k in DEFAULT_LABELS)) issues.push(issue(`labels.${k}`, "label", k, Object.keys(DEFAULT_LABELS)))
			else if (typeof v === "string") (labels as Record<string, string>)[k] = v
		}

	const pageSizes = Array.isArray(cfg.pageSizes) && cfg.pageSizes.every((n) => typeof n === "number" && n > 0) ? cfg.pageSizes : DEFAULT_PAGE_SIZES
	if (cfg.pageSizes !== undefined && pageSizes === DEFAULT_PAGE_SIZES) issues.push(issue("pageSizes", "pageSizes"))
	posNum(cfg.pageSize, "pageSize", issues)

	const relations: RelationConfig[] = Array.isArray(cfg.relations) ? cfg.relations.filter((r, i) => (isObj(r) && typeof r.from === "string" && typeof r.to === "string") || !issues.push(issue(`relations[${i}]`, "relationShape"))) : []
	const deckBase = {
		relations,
		types,
		guess,
		acronyms: Array.isArray(cfg.acronyms) ? cfg.acronyms.map(String) : DEFAULT_ACRONYMS,
		formats: { ...BUILTIN_FORMATS, ...(isObj(cfg.formats) ? (cfg.formats as Record<string, FormatFn>) : {}) },
		pageSizes,
	}

	const all = toTableData(cfg.data)
	const names = Object.keys(all)
	const tcfg: Record<string, TableConfig> = isObj(cfg.tables) ? cfg.tables : {}
	for (const n of Object.keys(tcfg)) if (!names.includes(n)) issues.push(issue(`tables.${n}`, "noTable", n, names))
	let order = names
	if (Array.isArray(cfg.tableOrder)) {
		const listed = cfg.tableOrder.filter((n) => names.includes(n) || !issues.push(issue("tableOrder", "noTableQ", n, names)))
		order = [...listed, ...names.filter((n) => !listed.includes(n))]
	}
	const tables = order.map((n) => resolveTable(n, all[n] ?? [], tcfg[n], cfg, deckBase, issues)).filter((t): t is ResolvedTable => !!t)

	for (const [i, r] of relations.entries())
		for (const side of ["from", "to"] as const) {
			const [tn, ...fp] = r[side].split(".")
			const tb = tables.find((t) => t.name === tn)
			if (!tb) issues.push(issue(`relations[${i}].${side}`, "noTableQ", tn ?? "", names))
			else if (!tb.columns.some((c) => c.id === fp.join("."))) issues.push(issue(`relations[${i}].${side}`, "noColumnIn", fp.join("."), tb.columns.map((c) => c.id), tn))
		}

	return {
		datasets: all,
		tableConfigs: tcfg,
		config: cfg,
		theme: oneOf(typeof cfg.theme === "string" ? cfg.theme : isObj(cfg.theme) ? cfg.theme.mode : undefined, THEMES, "theme", issues) ?? "inherit",
		tokens: {
			light: tokensOf(isObj(cfg.theme) ? cfg.theme.light : undefined, "theme.light", issues),
			dark: tokensOf(isObj(cfg.theme) ? cfg.theme.dark : undefined, "theme.dark", issues),
		},
		classNames: classNamesOf(cfg.classNames, "classNames", issues),
		palette: Array.isArray(cfg.palette) ? cfg.palette.filter((c) => typeof c === "string") : undefined,
		statusColors: Object.fromEntries(Object.entries(isObj(cfg.statusColors) ? cfg.statusColors : {}).flatMap(([k, v]) => (typeof v === "string" ? [[k.toLowerCase(), v]] : []))),
		tables,
		labels,
		renderers: isObj(cfg.renderers) ? (cfg.renderers as Record<string, RenderFn>) : {},
		...deckBase,
		issues,
	}
}

/** Deep-merge a placement's overrides onto the dataset's table config (columns merged per column). */
export function mergeTableConfig(base: TableConfig | undefined, over: Partial<TableConfig>): TableConfig {
	const b: TableConfig = base ?? {}
	const cols: Record<string, ColumnConfig | string> = { ...(b.columns ?? {}) }
	for (const [id, c] of Object.entries(over.columns ?? {})) {
		const prev = cols[id]
		const p: ColumnConfig = typeof prev === "string" ? { type: prev } : (prev ?? {})
		cols[id] = typeof c === "string" ? { ...p, type: c } : { ...p, ...c }
	}
	return { ...b, ...over, columns: cols }
}

/**
 * Resolve one placement of a dataset: dataset spec → placement overrides →
 * resolved table. Pure; called once per table component on a page.
 */
export function resolvePlacement(deck: ResolvedDeck, table: string, over: Partial<TableConfig>, issues: RawIssue[], path: string): ResolvedTable | null {
	const rows = deck.datasets[table]
	if (!rows) {
		issues.push(issue(`${path}.table`, "noTableQ", table, Object.keys(deck.datasets)))
		return null
	}
	// The merged config repeats the dataset's own settings; report only what the placement adds.
	const local: RawIssue[] = []
	const out = resolveTable(table, rows, mergeTableConfig(deck.tableConfigs[table], over), deck.config, deck, local, path)
	const datasetPath = `tables.${table}`
	for (const i of local) {
		const tail = i.path.startsWith(path) ? i.path.slice(path.length) : null
		if (tail !== null && deck.issues.some((d) => sameIssue(d, { ...i, path: `${datasetPath}${tail}` }))) continue
		issues.push(i)
	}
	return out
}

/** Validated token overrides: names must be in TOKEN_NAMES, values strings. */
function tokensOf(raw: unknown, path: string, issues: RawIssue[]): ThemeTokens {
	const out: ThemeTokens = {}
	if (raw === undefined) return out
	if (!isObj(raw)) {
		issues.push(issue(path, "tokensObj"))
		return out
	}
	for (const [k, v] of Object.entries(raw)) {
		const name = TOKEN_NAMES.find((n) => n === k)
		if (!name) issues.push(issue(`${path}.${k}`, "token", k, TOKEN_NAMES))
		else if (typeof v !== "string") issues.push(issue(`${path}.${k}`, "cssValue"))
		else out[name] = v
	}
	return out
}

/** Validated class-name slots (see CLASS_SLOTS). */
function classNamesOf(raw: unknown, path: string, issues: RawIssue[]): ClassNames {
	const out: ClassNames = {}
	if (raw === undefined) return out
	if (!isObj(raw)) {
		issues.push(issue(path, "slotsObj"))
		return out
	}
	for (const [k, v] of Object.entries(raw)) {
		const slot = CLASS_SLOTS.find((x) => x === k)
		if (!slot) issues.push(issue(`${path}.${k}`, "slot", k, CLASS_SLOTS))
		else if (typeof v === "string") out[slot] = v
	}
	return out
}
