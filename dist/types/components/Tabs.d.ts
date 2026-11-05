/**
 * Segmented tabs: a rounded pill of tabs, the active one a
 * raised chip. Used for every tab row (deck tabs, section tabs, page nav,
 * Preview | Code). Roving tabindex: arrow keys / Home / End move between
 * tabs; a visible focus ring. Scrolls sideways only, never wraps.
 */
import * as React from "react";
export type TabItem = {
    key: string;
    label: React.ReactNode;
    /** Small round count badge next to the label. */
    badge?: number | undefined;
    /** Render as a link (page nav keeps working without JS and in new tabs). */
    href?: string | undefined;
    /** Extra data-* attributes for the tab element. */
    attrs?: Record<string, string> | undefined;
};
export declare function SegmentedTabs({ items, value, onChange, surface, label, className, dataJd, }: {
    items: TabItem[];
    value: string;
    onChange: (key: string) => void;
    /** The pill is a shade darker on the page than inside a card, so it stays visible on both. */
    surface?: "page" | "card";
    label?: string | undefined;
    className?: string | undefined;
    dataJd?: string | undefined;
}): React.JSX.Element;
