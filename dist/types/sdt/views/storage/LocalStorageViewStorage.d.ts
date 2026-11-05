import type { SavedView, ViewStorage } from "./ViewStorage";
/**
 * Per-table localStorage backed view storage.
 *
 * Storage key: `dt:views:<scope>` — JSON array of SavedView.
 * Multiple tables on different `scope` values stay isolated.
 *
 * Safe across SSR (no-op when window is undefined).
 */
/** The localStorage key of a scope's views; core/views-key.ts holds the same prefix for the first-paint check. */
export declare function viewsKey(scope: string): string;
export declare class LocalStorageViewStorage implements ViewStorage {
    private readonly key;
    constructor(scope: string);
    /** The stored views, synchronously (the first render uses it to open on the default view). */
    read(): SavedView[];
    private write;
    list(): Promise<SavedView[]>;
    get(id: string): Promise<SavedView | null>;
    save(view: SavedView): Promise<SavedView>;
    delete(id: string): Promise<void>;
    setDefault(id: string | null): Promise<void>;
    setFavorite(id: string, favorite: boolean): Promise<void>;
}
