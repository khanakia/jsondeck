/**
 * Where the built-in saved-view storage keeps a table's views:
 * localStorage[`dt:views:jsondeck:<table instance id>`] = JSON array of views.
 * Shared by the storage (sdt/views/storage/LocalStorageViewStorage.ts) and the
 * first-paint check (components/first-paint.ts), which looks for a stored
 * default view before rendering without loading the views chunk.
 */
export const VIEWS_KEY_PREFIX = "dt:views:"
/** The scope jsondeck gives each table instance's views. */
export const viewsScope = (instanceId: string) => `jsondeck:${instanceId}`

/** True when localStorage holds a default view for one of these table instances (no JSON parsing unless the text says isDefault). */
export function hasStoredDefaultView(instanceIds: readonly string[]): boolean {
	try {
		for (const id of instanceIds) if (/"isDefault":true/.test(window.localStorage.getItem(`${VIEWS_KEY_PREFIX}${viewsScope(id)}`) ?? "")) return true
	} catch {
		// No storage (file:// in some browsers, private mode): nothing stored.
	}
	return false
}
