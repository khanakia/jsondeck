import * as React from "react";
type Options = {
    /** Total navigable item count. */
    count: number;
    /** Called when the user presses Enter on a highlighted item. */
    onSelect: (index: number) => void;
    /** Reset the highlighted index when this changes. Typically the
     *  filtered list reference or query string. */
    resetKey?: unknown | undefined;
    /** Wrap around at boundaries (top → bottom and vice versa). Default true. */
    wrap?: boolean | undefined;
    /**
     * Which arrow keys move the highlight.
     * - "vertical"   ↑/↓ (default — long lists)
     * - "horizontal" ←/→ (button rows, segmented controls)
     * - "both"       all four arrows respond
     */
    orientation?: "vertical" | "horizontal" | "both" | undefined;
};
/**
 * Drop-in arrow-key navigation for any list-like dropdown.
 *
 * Returns:
 *   - `activeIndex`     — currently highlighted item
 *   - `setActiveIndex`  — set on hover so mouse + keyboard stay in sync
 *   - `onKeyDown`       — spread on the input/container to capture arrows
 *   - `getItemRef(i)`   — pass to each item so we can scroll it into view
 *
 * Wire up from any popover with a search input + scrollable list:
 *   const nav = useListNavigation({ count: items.length, onSelect, resetKey: query })
 *   <Input onKeyDown={nav.onKeyDown} … />
 *   {items.map((it, i) => (
 *     <button ref={nav.getItemRef(i)}
 *             onMouseMove={() => nav.setActiveIndex(i)}
 *             className={cn(nav.activeIndex === i && "bg-accent")} />
 *   ))}
 */
export declare function useListNavigation({ count, onSelect, resetKey, wrap, orientation, }: Options): {
    activeIndex: number;
    setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
    onKeyDown: (e: React.KeyboardEvent) => void;
    getItemRef: (i: number) => (el: HTMLElement | null) => void;
};
export {};
