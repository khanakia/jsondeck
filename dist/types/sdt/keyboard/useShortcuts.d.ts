import type { ShortcutHandlers } from "./shortcuts";
/** Typing in a field, or a modifier held: shortcuts stay out of the way. */
export declare function ignoredKey(e: Pick<KeyboardEvent, "target" | "metaKey" | "ctrlKey" | "altKey">): boolean;
/**
 * The table's keyboard shortcuts (the layer itself is the on-demand chunk
 * keyboard/shortcuts.ts). Until it has loaded, a small first-key listener
 * stands in: "/" focuses search at once (so it works on the very first
 * press), the other shortcut keys have their browser default stopped, and the
 * key is handed to the layer as soon as it arrives. Off when `enabled` is
 * false (a hidden tab's table).
 */
export declare function useShortcuts(handlers: ShortcutHandlers & {
    enabled?: boolean | undefined;
}): void;
