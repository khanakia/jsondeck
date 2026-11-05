import * as React from "react";
import type { PageConfig, PageItem } from "../core/config";
import { type ResolvedPage } from "../core/layout";
/** Edit operations the page raises; Deck applies them to its PageConfig state. */
export type LayoutOps = {
    move: (itemId: string, toPath: string, toIndex: number) => void;
    update: (itemId: string, patch: {
        span?: number;
        height?: number | undefined;
    }) => void;
    remove: (itemId: string) => void;
    add: (path: string, item: PageItem) => void;
};
export declare function PageView({ page, edit, ops, pageFilters, onPageFilter, }: {
    page: ResolvedPage;
    config: PageConfig;
    edit: boolean;
    ops: LayoutOps;
    pageFilters: Record<string, string>;
    onPageFilter: (field: string, value: string | undefined) => void;
}): React.JSX.Element;
