/**
 * Where the built-in saved-view storage keeps a table's views:
 * localStorage[`dt:views:jsondeck:<table instance id>`] = JSON array of views.
 * Shared by the storage (sdt/views/storage/LocalStorageViewStorage.ts) and the
 * first-paint check (components/first-paint.ts), which looks for a stored
 * default view before rendering without loading the views chunk.
 */
export declare const VIEWS_KEY_PREFIX = "dt:views:";
/** The scope jsondeck gives each table instance's views. */
export declare const viewsScope: (instanceId: string) => string;
/** True when localStorage holds a default view for one of these table instances (no JSON parsing unless the text says isDefault). */
export declare function hasStoredDefaultView(instanceIds: readonly string[]): boolean;
