/**
 * Column resize and drag-reorder, an on-demand chunk. The table preloads it
 * when the pointer enters the header and loads it on the first press of a
 * resize handle or the first drag of a column label, so the very first use
 * works even if it is not there yet.
 */
/** Where the pointer went while this chunk was loading (the table records it from the press on). */
export type EarlyDrag = {
    x: number;
    released: boolean;
};
/**
 * Follow the pointer from a press on a resize handle until release, sending
 * the column's new width on every move. `startWidth` is the column's width
 * when pressed; `startX` the press position. `early` is what happened between
 * the press and this chunk arriving: the width catches up with it at once,
 * and a drag that already ended is simply applied.
 */
export declare function trackResize(startX: number, startWidth: number, onWidth: (width: number) => void, early: EarlyDrag): void;
/** The column order after dropping `dragged` onto `target` (null when nothing moves). */
export declare function reorder(ids: readonly string[], dragged: string, target: string): string[] | null;
