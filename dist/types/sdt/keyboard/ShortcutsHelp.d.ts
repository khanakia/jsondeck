import type { Labels } from "../../core/labels";
type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Sections rendered in the dialog. Each section has a title and rows. */
    sections?: ShortcutSection[] | undefined;
};
export type ShortcutRow = {
    /** Array so multi-key combos can render: [`Cmd`, `K`]. */
    keys: string[];
    label: string;
};
export type ShortcutSection = {
    title: string;
    rows: ShortcutRow[];
};
/** Defaults match the shortcuts wired in `useShortcuts`. */
/** The built-in shortcut list, in the current labels. */
export declare function defaultShortcuts(L: Labels): ShortcutSection[];
/**
 * Modal listing all keyboard shortcuts. Triggered by `?`.
 * Pass `sections` to add page-specific shortcuts on top of the defaults.
 */
export declare function ShortcutsHelp({ open, onOpenChange, sections: sectionsProp, }: Props): import("react").JSX.Element;
export {};
