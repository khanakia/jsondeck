import type {
	FilterCondition,
	PaginationDirection,
	SortRule,
	TableState,
} from "../types"

// ──────────────────────────────────────────────────────────────────────────
// Action types
// ──────────────────────────────────────────────────────────────────────────

export type TableAction =
	| { type: "SET_SEARCH"; search: string }
	| { type: "SET_SORT"; sort: SortRule[] }
	| { type: "ADD_FILTER"; filter: FilterCondition }
	| { type: "UPDATE_FILTER"; filter: FilterCondition }
	| { type: "REMOVE_FILTER"; id: string }
	| { type: "CLEAR_FILTERS" }
	| { type: "PAGE_NEXT"; cursor: string | null }
	| { type: "PAGE_PREV"; cursor: string | null }
	| { type: "RESET_PAGINATION" }
	| { type: "SET_PAGE"; page: number }
	| { type: "REPLACE_STATE"; state: TableState }
	| { type: "SET_VIEW_ID"; viewId: string | null }
	| { type: "SET_HIDDEN_COLUMNS"; hiddenColumns: string[] }
	| { type: "TOGGLE_COLUMN"; columnId: string }
	| { type: "SET_COLUMN_SIZES"; columnSizes: Record<string, number> }
	| { type: "SET_COLUMN_ORDER"; columnOrder: string[] }
	| { type: "RESET_COLUMN_LAYOUT" }
	| { type: "SET_PAGE_SIZE"; pageSize: number }
	| { type: "SET_LAYOUT"; layoutId: string }
	| { type: "SET_GROUP_BY"; groupBy: string[] }
	| { type: "SET_DETAIL_COLUMNS"; detailColumns: string[] | null }

// ──────────────────────────────────────────────────────────────────────────
// Initial state
// ──────────────────────────────────────────────────────────────────────────

export function initialTableState(defaults?: Partial<TableState>): TableState {
	return {
		search: "",
		filters: [],
		sort: [],
		pagination: { direction: "forward", cursor: null, page: 1 },
		viewId: null,
		hiddenColumns: [],
		columnSizes: {},
		columnOrder: [],
		pageSize: 20,
		layoutId: "table",
		groupBy: [],
		detailColumns: null,
		...defaults,
	}
}

// ──────────────────────────────────────────────────────────────────────────
// Reducer
// ──────────────────────────────────────────────────────────────────────────

/**
 * Any change that affects the query result resets pagination to page 1
 * so users never end up on "page 5 of 2".
 */
const resetPagination = (state: TableState): TableState => ({
	...state,
	pagination: { direction: "forward", cursor: null, page: 1 },
})

export function tableReducer(
	state: TableState,
	action: TableAction,
): TableState {
	switch (action.type) {
		case "SET_SEARCH":
			if (state.search === action.search) return state
			return resetPagination({ ...state, search: action.search })

		case "SET_SORT":
			return resetPagination({ ...state, sort: action.sort })

		case "ADD_FILTER":
			// Single condition per field: buildWhere shallow-merges field
			// partials (later wins), so two conditions on the same field
			// can't both apply. Replace any existing same-field condition
			// instead of appending a dead duplicate.
			return resetPagination({
				...state,
				filters: [
					...state.filters.filter((f) => f.fieldId !== action.filter.fieldId),
					action.filter,
				],
			})

		case "UPDATE_FILTER":
			return resetPagination({
				...state,
				filters: state.filters.map((f) =>
					f.id === action.filter.id ? action.filter : f,
				),
			})

		case "REMOVE_FILTER":
			return resetPagination({
				...state,
				filters: state.filters.filter((f) => f.id !== action.id),
			})

		case "CLEAR_FILTERS":
			return resetPagination({ ...state, filters: [] })

		case "PAGE_NEXT":
			return {
				...state,
				pagination: {
					direction: "forward" as PaginationDirection,
					cursor: action.cursor,
					page: state.pagination.page + 1,
				},
			}

		case "PAGE_PREV":
			return {
				...state,
				pagination: {
					direction: "backward" as PaginationDirection,
					cursor: action.cursor,
					page: Math.max(1, state.pagination.page - 1),
				},
			}

		case "RESET_PAGINATION":
			return resetPagination(state)

		// Numbered pages (in-memory data): jump straight to a 1-based page.
		case "SET_PAGE":
			return { ...state, pagination: { direction: "forward", cursor: null, page: Math.max(1, action.page) } }

		case "REPLACE_STATE":
			return action.state

		case "SET_VIEW_ID":
			if (state.viewId === action.viewId) return state
			return { ...state, viewId: action.viewId }

		case "SET_HIDDEN_COLUMNS":
			return { ...state, hiddenColumns: action.hiddenColumns }

		case "TOGGLE_COLUMN": {
			const isHidden = state.hiddenColumns.includes(action.columnId)
			return {
				...state,
				hiddenColumns: isHidden
					? state.hiddenColumns.filter((c) => c !== action.columnId)
					: [...state.hiddenColumns, action.columnId],
			}
		}

		case "SET_COLUMN_SIZES":
			return { ...state, columnSizes: action.columnSizes }

		case "SET_COLUMN_ORDER":
			return { ...state, columnOrder: action.columnOrder }

		case "RESET_COLUMN_LAYOUT":
			return { ...state, columnSizes: {}, columnOrder: [] }

		case "SET_PAGE_SIZE":
			// Changing page size resets pagination — page indices are no longer
			// meaningful when the page boundary moves.
			if (state.pageSize === action.pageSize) return state
			return resetPagination({ ...state, pageSize: action.pageSize })

		case "SET_LAYOUT":
			// Pure presentation change — does NOT reset pagination.
			if (state.layoutId === action.layoutId) return state
			return { ...state, layoutId: action.layoutId }

		case "SET_GROUP_BY":
			return resetPagination({ ...state, groupBy: action.groupBy })

		case "SET_DETAIL_COLUMNS":
			return { ...state, detailColumns: action.detailColumns }

		default:
			return state
	}
}
