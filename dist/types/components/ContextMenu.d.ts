/**
 * Right-click menu. Presentational: items in, `onSelect` / `onClose` out; it
 * knows nothing about tables. Portalled to <body> on the overlay layer (with
 * the jd-root class and the page theme, so tokens and the scoped reset apply),
 * kept inside the viewport (flips near the right / bottom edge).
 *
 * Keyboard: ↑/↓ (skip separators and disabled), Home/End, Enter/Space, → opens
 * a submenu, ← closes it, Esc closes everything, typing jumps to a label.
 * Closes on an outside pointer-down, any scroll, a resize, or Esc.
 *
 * Keys are read by a capture listener on the document (the deepest open
 * level owns them), not through focus: a right-click's own mouse-up can move
 * focus to <body> right after the menu opens. Handled keys are stopped, so
 * the table's shortcuts (← → pagination, / search) do not also fire.
 */
import * as React from "react";
export type MenuAction = {
    label: string;
    icon?: React.ReactNode | undefined;
    /** Key hint shown muted on the right (display only; the caller binds the key). */
    kbd?: string | undefined;
    onSelect: () => void;
    disabled?: boolean | undefined;
    danger?: boolean | undefined;
};
export type MenuSeparator = {
    separator: true;
};
export type MenuSubmenu = {
    label: string;
    icon?: React.ReactNode | undefined;
    submenu: MenuItem[];
    disabled?: boolean | undefined;
};
export type MenuItem = MenuAction | MenuSeparator | MenuSubmenu;
export type ContextMenuProps = {
    /** Viewport coordinates (clientX / clientY of the contextmenu event). */
    x: number;
    y: number;
    items: MenuItem[];
    onClose: () => void;
    /** Accessible name of the menu. */
    label?: string | undefined;
};
export declare function ContextMenu({ x, y, items, onClose, label }: ContextMenuProps): React.ReactPortal | null;
