import type { FilterCondition, SortRule } from "../../types";
export type SavedView = {
    id: string;
    name: string;
    /** Optional emoji or lucide icon name */
    icon?: string | undefined;
    isDefault?: boolean | undefined;
    isFavorite?: boolean | undefined;
    /** Built-in views shipped via config — can't be deleted, can be duplicated */
    isBuiltin?: boolean | undefined;
    state: {
        search: string;
        filters: FilterCondition[];
        sort: SortRule[];
        /** Hidden column ids. Empty array = all columns visible. */
        hiddenColumns?: string[] | undefined;
        /** Column display order. Omit / empty = use the columns prop order. */
        columnOrder?: string[] | undefined;
        /** Per-column user-resized widths in px. Omit = use the column's `size`. */
        columnSizes?: Record<string, number> | undefined;
        /** Group-by columns (jsondeck). */
        groupBy?: string[] | undefined;
        /** Columns shown in the expanded row detail (jsondeck); omit = the config default. */
        detailColumns?: string[] | null | undefined;
    };
    createdAt: string;
    updatedAt: string;
};
/**
 * Pluggable storage for saved views.
 *
 * Default: `LocalStorageViewStorage` — per-browser, per-device.
 * Future: `ServerViewStorage` — per-user or per-workspace.
 *
 * All methods are async so a server implementation is a drop-in swap.
 */
export interface ViewStorage {
    list(): Promise<SavedView[]>;
    get(id: string): Promise<SavedView | null>;
    save(view: SavedView): Promise<SavedView>;
    delete(id: string): Promise<void>;
    setDefault(id: string | null): Promise<void>;
    setFavorite(id: string, favorite: boolean): Promise<void>;
}
