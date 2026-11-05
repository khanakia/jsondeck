/**
 * Whether the table state differs from the active saved view (or, with no
 * view, whether anything is set). Shared by the view selector and its
 * stand-in trigger, which both show the "unsaved changes" dot.
 */
import type { TableState } from "../types";
import type { SavedView } from "./storage/ViewStorage";
export declare function isModified(state: TableState, view: SavedView | null): boolean;
