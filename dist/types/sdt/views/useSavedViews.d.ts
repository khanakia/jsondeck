import type { SavedView, ViewStorage } from "./storage/ViewStorage";
type Options = {
    /** Stable scope (typically the table's queryKey) */
    scope: string;
    /** Override default localStorage with a custom storage */
    storage?: ViewStorage | undefined;
    /** Built-in views shipped via config (e.g. "My items"). Always present. */
    builtinViews?: SavedView[] | undefined;
};
/**
 * Manages saved views for one table. List is union of:
 * - builtinViews (read-only, can be duplicated)
 * - storage views (created by the user)
 */
export declare function useSavedViews({ scope, storage, builtinViews }: Options): {
    views: SavedView[];
    defaultView: SavedView | null;
    loading: boolean;
    save: (view: SavedView) => Promise<SavedView>;
    remove: (id: string) => Promise<void>;
    setDefault: (id: string | null) => Promise<void>;
    setFavorite: (id: string, favorite: boolean) => Promise<void>;
    reload: () => Promise<void>;
};
export {};
