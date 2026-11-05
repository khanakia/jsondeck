/**
 * Toolbar polish: a small dark tooltip (label + key hint) that shows on hover
 * after a short delay and on keyboard focus, portalled to <body> on the
 * overlay z-layer so it sits above everything; plus the toolbar style switch
 * (icons only by default, `toolbarLabels: true` brings the text back) and the
 * count badge icon buttons carry.
 */
import * as React from "react";
/** Icons only (default) or icons + text labels in the toolbar. */
export declare const ToolbarLabelsContext: React.Context<boolean>;
export declare function useToolbarLabels(): boolean;
export declare function Tip({ label, hint, children }: {
    label: string;
    hint?: string | undefined;
    children: React.ReactNode;
}): React.JSX.Element;
/** Small count shown on an icon button (active filters, sort rules, hidden columns). */
export declare function CountBadge({ n }: {
    n: number;
}): React.JSX.Element | null;
/** Classes for a square ghost icon button in the toolbar (relative, for the badge). */
export declare const ICON_BTN = "jd-toolbar-btn jd:relative jd:h-7 jd:w-7 jd:p-0 jd:text-muted-foreground jd:hover:text-foreground";
/** Classes when labels are on: a compact ghost button with text. */
export declare const LABEL_BTN = "jd:relative jd:h-7 jd:gap-1.5 jd:px-2 jd:text-xs";
