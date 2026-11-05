/**
 * Handles for the on-demand parts the core uses outside React.lazy: each
 * `deferred(() => import(…))` is its own chunk in the split builds, loaded on
 * first use (or before the first render, see first-paint.ts) and then read
 * synchronously with `.use()`. Nothing may import these modules statically,
 * or the bundler folds them back into the core (scripts/verify-cdn.mjs checks
 * which chunks a plain table requests).
 */
import { deferred } from "@/components/ui/deferred"

/** Saved views: storage, default view, the Views control (sdt/views/ViewsControl.tsx). */
export const viewsPart = deferred(() => import("../sdt/views/ViewsControl"))
/** Pinned columns: sticky offsets and edges (sdt/columns/pinning.ts). */
export const pinningPart = deferred(() => import("../sdt/columns/pinning"))
/** Column resize and drag-reorder (sdt/columns/drag.ts), loaded on header hover or the first press on a handle. */
export const columnDragPart = deferred(() => import("../sdt/columns/drag"))
/** Keyboard shortcuts (sdt/keyboard/shortcuts.ts), loaded on the first key press. */
export const keyboardPart = deferred(() => import("../sdt/keyboard/shortcuts"))
/** The grouped sidebar page navigation (components/SidebarNav.tsx). */
export const sidebarPart = deferred(() => import("./SidebarNav"))
/** The relation index (core/relations.ts), fetched after the first render of a deck with relations. */
export const relationsPart = deferred(() => import("../core/relations"))
/** The deck header's theme toggle and edit button (components/DeckButtons.tsx). */
export const deckButtonsPart = deferred(() => import("./DeckButtons"))
/** The page filter bar (components/PageFilterBar.tsx). */
export const pageFilterPart = deferred(() => import("./PageFilterBar"))
