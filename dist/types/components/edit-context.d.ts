/**
 * The layout editor's shared state: the edit operations Deck applies to its
 * PageConfig state, and the context Page.tsx provides to its grid. Kept apart
 * from Page.tsx so the editor tools (EditTools.tsx, an on-demand chunk) can
 * read it without importing the page.
 */
import * as React from "react";
import type { PageItem } from "../core/config";
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
export declare const EditContext: React.Context<{
    edit: boolean;
    ops: LayoutOps;
    nextId: () => string;
} | null>;
