/**
 * The grouped sidebar page navigation (`nav: "sidebar"`), an on-demand chunk
 * loaded before the first render of a deck that uses it
 * (components/first-paint.ts), so the layout never shifts.
 */
import type * as React from "react";
import type { ResolvedPage } from "../core/layout";
export declare function SidebarNav({ pages, current, go, searchButton }: {
    pages: ResolvedPage[];
    current: string;
    go: (id: string) => void;
    searchButton: React.ReactNode;
}): React.JSX.Element;
