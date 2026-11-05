/**
 * Pinned (frozen) columns, an on-demand chunk loaded before the first render
 * when a table pins a column (components/first-paint.ts). Pure.
 */
import type * as React from "react";
type Col = {
    id: string;
};
/** Sticky style per pinned column, with cumulative offsets from its edge (left pins from the left, right pins from the right). */
export declare function pinOffsets<C extends Col>(visible: readonly C[], pinOf: (id: string) => "left" | "right" | undefined, widthOf: (c: C) => number): Map<string, React.CSSProperties>;
/** A frozen column's edge: a border on the side facing the scrolling columns (no shadow: blocks separate by border only). */
export declare function pinEdge(pin: "left" | "right" | undefined): string | undefined;
export {};
