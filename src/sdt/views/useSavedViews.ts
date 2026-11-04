import * as React from "react"
import { LocalStorageViewStorage } from "./storage/LocalStorageViewStorage"
import type { SavedView, ViewStorage } from "./storage/ViewStorage"

type Options = {
	/** Stable scope (typically the table's queryKey) */
	scope: string
	/** Override default localStorage with a custom storage */
	storage?: ViewStorage | undefined
	/** Built-in views shipped via config (e.g. "My items"). Always present. */
	builtinViews?: SavedView[] | undefined
}

/**
 * Manages saved views for one table. List is union of:
 * - builtinViews (read-only, can be duplicated)
 * - storage views (created by the user)
 */
export function useSavedViews({ scope, storage, builtinViews }: Options) {
	// Memoize the storage instance so it's stable across renders
	const storageRef = React.useRef<ViewStorage | null>(null)
	if (!storageRef.current) {
		storageRef.current = storage ?? new LocalStorageViewStorage(scope)
	}
	const store = storageRef.current

	const [userViews, setUserViews] = React.useState<SavedView[]>([])
	const [loading, setLoading] = React.useState(true)

	const reload = React.useCallback(async () => {
		setLoading(true)
		try {
			const list = await store.list()
			setUserViews(list)
		} finally {
			setLoading(false)
		}
	}, [store])

	React.useEffect(() => {
		void reload()
	}, [reload])

	// Stamp builtins so they always come first and can't be deleted.
	const builtins = React.useMemo<SavedView[]>(
		() =>
			(builtinViews ?? []).map((v) => ({
				...v,
				isBuiltin: true,
			})),
		[builtinViews],
	)

	const allViews = React.useMemo(() => {
		// Builtins first, then favorites, then alphabetical
		const userSorted = [...userViews].sort((a, b) => {
			if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
			return a.name.localeCompare(b.name)
		})
		return [...builtins, ...userSorted]
	}, [builtins, userViews])

	const defaultView = React.useMemo(
		() => allViews.find((v) => v.isDefault) ?? null,
		[allViews],
	)

	const save = React.useCallback(
		async (view: SavedView) => {
			const saved = await store.save(view)
			await reload()
			return saved
		},
		[store, reload],
	)

	const remove = React.useCallback(
		async (id: string) => {
			await store.delete(id)
			await reload()
		},
		[store, reload],
	)

	const setDefault = React.useCallback(
		async (id: string | null) => {
			await store.setDefault(id)
			await reload()
		},
		[store, reload],
	)

	const setFavorite = React.useCallback(
		async (id: string, favorite: boolean) => {
			await store.setFavorite(id, favorite)
			await reload()
		},
		[store, reload],
	)

	return {
		views: allViews,
		defaultView,
		loading,
		save,
		remove,
		setDefault,
		setFavorite,
		reload,
	}
}
