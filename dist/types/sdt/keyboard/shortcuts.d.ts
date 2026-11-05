export type ShortcutHandlers = {
    onSlash?: (() => void) | undefined;
    onF?: (() => void) | undefined;
    onV?: (() => void) | undefined;
    onC?: (() => void) | undefined;
    onS?: (() => void) | undefined;
    onQuestion?: (() => void) | undefined;
    onArrowLeft?: (() => void) | undefined;
    onArrowRight?: (() => void) | undefined;
    onEscape?: (() => void) | undefined;
};
/** Run the shortcut for a key; true when one ran. `preventDefault` is called for every key but Esc. */
export declare function runShortcut(key: string, h: ShortcutHandlers, preventDefault: () => void): boolean;
/** Listen on the window until the returned function is called; `get` returns the current handlers. */
export declare function listenShortcuts(get: () => ShortcutHandlers): () => void;
