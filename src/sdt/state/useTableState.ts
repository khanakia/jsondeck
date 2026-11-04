import * as React from "react"
import type { FilterCondition, SortRule, TableState } from "../types"
import { initialTableState, tableReducer } from "./reducer"

type UseTableStateOptions = {
	defaultSort?: SortRule[] | undefined
	/** Seed the initial state — used for URL hydration / view restore */
	initial?: Partial<TableState> | undefined
}

/**
 * Owns the single source of truth for the table.
 */
export function useTableState(opts: UseTableStateOptions = {}) {
	const [state, dispatch] = React.useReducer(tableReducer, undefined, () =>
		initialTableState({
			sort: opts.defaultSort ?? [],
			...opts.initial,
		}),
	)

	// Stable action creators — callers don't re-render from them.
	const actions = React.useMemo(
		() => ({
			setSearch: (search: string) => dispatch({ type: "SET_SEARCH", search }),
			setSort: (sort: SortRule[]) => dispatch({ type: "SET_SORT", sort }),
			addFilter: (filter: FilterCondition) =>
				dispatch({ type: "ADD_FILTER", filter }),
			updateFilter: (filter: FilterCondition) =>
				dispatch({ type: "UPDATE_FILTER", filter }),
			removeFilter: (id: string) => dispatch({ type: "REMOVE_FILTER", id }),
			clearFilters: () => dispatch({ type: "CLEAR_FILTERS" }),
			pageNext: (cursor: string | null) =>
				dispatch({ type: "PAGE_NEXT", cursor }),
			pagePrev: (cursor: string | null) =>
				dispatch({ type: "PAGE_PREV", cursor }),
			resetPagination: () => dispatch({ type: "RESET_PAGINATION" }),
			setPage: (page: number) => dispatch({ type: "SET_PAGE", page }),
			replaceState: (newState: TableState) =>
				dispatch({ type: "REPLACE_STATE", state: newState }),
			setViewId: (viewId: string | null) =>
				dispatch({ type: "SET_VIEW_ID", viewId }),
			setHiddenColumns: (hiddenColumns: string[]) =>
				dispatch({ type: "SET_HIDDEN_COLUMNS", hiddenColumns }),
			toggleColumn: (columnId: string) =>
				dispatch({ type: "TOGGLE_COLUMN", columnId }),
			setColumnSizes: (columnSizes: Record<string, number>) =>
				dispatch({ type: "SET_COLUMN_SIZES", columnSizes }),
			setColumnOrder: (columnOrder: string[]) =>
				dispatch({ type: "SET_COLUMN_ORDER", columnOrder }),
			resetColumnLayout: () => dispatch({ type: "RESET_COLUMN_LAYOUT" }),
			setPageSize: (pageSize: number) =>
				dispatch({ type: "SET_PAGE_SIZE", pageSize }),
			setGroupBy: (groupBy: string[]) => dispatch({ type: "SET_GROUP_BY", groupBy }),
			setDetailColumns: (detailColumns: string[] | null) => dispatch({ type: "SET_DETAIL_COLUMNS", detailColumns }),
			setLayout: (layoutId: string) =>
				dispatch({ type: "SET_LAYOUT", layoutId }),
		}),
		[],
	)

	return { state, dispatch, actions }
}
