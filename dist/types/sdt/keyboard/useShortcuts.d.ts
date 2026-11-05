type Handlers = {
    /** Focus the search input */
    onSlash?: (() => void) | undefined;
    /** Open filter picker */
    onF?: (() => void) | undefined;
    /** Open views menu */
    onV?: (() => void) | undefined;
    /** Open column visibility menu */
    onC?: (() => void) | undefined;
    /** Open sort dropdown */
    onS?: (() => void) | undefined;
    /** Open the keyboard-shortcuts help dialog */
    onQuestion?: (() => void) | undefined;
    /** Previous / next page */
    onArrowLeft?: (() => void) | undefined;
    onArrowRight?: (() => void) | undefined;
    /** Esc outside an input (e.g. clear search) */
    onEscape?: (() => void) | undefined;
    /** Off = listener not attached (e.g. a hidden tab's table). Default true. */
    enabled?: boolean | undefined;
};
/**
 * Global keyboard shortcuts. Only fires when focus is NOT inside an input
 * or contenteditable element so we don't intercept normal typing.
 *
 * Shortcuts:
 *   /  → focus search
 *   f  → open filter picker
 *   v  → open views menu
 *   c  → open column visibility
 */
export declare function useShortcuts(handlers: Handlers): void;
export {};
