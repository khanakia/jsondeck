import type { SavedView, ViewStorage } from "./ViewStorage";
/**
 * Per-table localStorage backed view storage.
 *
 * Storage key: `dt:views:<scope>` — JSON array of SavedView.
 * Multiple tables on different `scope` values stay isolated.
 *
 * Safe across SSR (no-op when window is undefined).
 */
export declare class LocalStorageViewStorage implements ViewStorage {
    private readonly key;
    constructor(scope: string);
    private read;
    private write;
    list(): Promise<SavedView[]>;
    get(id: string): Promise<SavedView | null>;
    save(view: SavedView): Promise<SavedView>;
    delete(id: string): Promise<void>;
    setDefault(id: string | null): Promise<void>;
    setFavorite(id: string, favorite: boolean): Promise<void>;
}
