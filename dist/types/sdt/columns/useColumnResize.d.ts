import * as React from "react";
type Options = {
    /** Current width map (id → px). */
    sizes: Record<string, number>;
    /** Commit a new width map. */
    onSizesChange: (sizes: Record<string, number>) => void;
    /** Default starting width when no override exists for a column. */
    defaultSize?: number | undefined;
};
/**
 * Custom column-resize hook.
 *
 * Returns a function `startResize(columnId, event)` for header resize
 * handles to wire up. While the user drags, we attach mousemove/mouseup
 * listeners on document and call `onSizesChange` on every move.
 *
 * Why a custom impl? The table owns its own column model (no table library),
 * so we do the bookkeeping here in ~30 lines.
 */
export declare function useColumnResize({ sizes, onSizesChange, defaultSize, }: Options): {
    startResize: (columnId: string, e: React.MouseEvent | React.TouchEvent) => void;
};
export {};
