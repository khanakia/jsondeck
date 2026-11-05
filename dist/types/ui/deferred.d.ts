/**
 * On-demand modules for components. `deferred(() => import("./x"))` gives a
 * handle that loads the module once, on the first `load()`, and lets any
 * number of components re-render when it arrives (`use()`). Used for the Base
 * UI popups (menus, popovers, dialogs): their light stand-ins in
 * dropdown-menu.tsx, popover.tsx and dialog.tsx render the trigger as a plain
 * element, start the load on hover / focus / click, and swap in the real
 * component when the chunk is there.
 *
 * In the single-file build (jsondeck.full.js) the import is inlined, so the
 * same code resolves at once and never touches the network.
 */
import * as React from "react";
export type Deferred<M> = {
    /** Start loading (idempotent); resolves with the module. A failed load can be retried. */
    load: () => Promise<M>;
    /** The module once loaded; re-renders the caller when it arrives. */
    use: () => M | null;
};
export declare function deferred<M>(importer: () => Promise<M>): Deferred<M>;
/** Starts a load and ignores the result (errors are already reported by `deferred`). */
export declare function preload<M>(d: Deferred<M>): void;
/**
 * A component that renders `pick(module)` once the module is loaded and
 * nothing before (starting the load when it first renders). For the parts
 * that only render inside an open popup (items, content, titles), where the
 * module is already there, and for parts with no visible stand-in (filter
 * pills, an opened dialog).
 */
export declare function lazyPart<M, P extends object>(d: Deferred<M>, pick: (m: M) => (props: P) => React.ReactNode): (props: P) => React.JSX.Element | null;
/** Base UI roots also take a render function as children (payload API); the stand-in renders only plain children. */
type RootProps = {
    children?: React.ReactNode | ((...args: never[]) => React.ReactNode);
};
type TriggerProps = {
    children?: React.ReactNode;
    ref?: React.Ref<HTMLButtonElement> | undefined;
};
/**
 * A popup Root + Trigger pair that loads on first use. Before the module is
 * there, the Root renders its children as they are and the Trigger renders its
 * child (the toolbar button) unchanged plus the handlers that start the load.
 * Hover and focus preload; a click (or a keyboard shortcut's `.click()`)
 * preloads and asks for the popup to open, which the real trigger replays as
 * a click once it mounts, so a cold first click still opens the popup.
 */
export declare function deferredRoot<M, R extends RootProps, T extends TriggerProps>(d: Deferred<M>, pickRoot: (m: M) => (props: R) => React.ReactNode, pickTrigger: (m: M) => (props: T) => React.ReactNode, haspopup: "menu" | "dialog"): {
    Root: (props: R) => React.JSX.Element;
    Trigger: (props: T) => React.JSX.Element;
};
/**
 * A whole control (trigger + popup + its logic) that lives in an on-demand
 * chunk, with a look-alike `Stand` (the same trigger button, no popup) shown
 * until the chunk is there. Hover or focus preloads; a click before the chunk
 * arrives is remembered and replayed on the real trigger once it mounts, so a
 * cold click (or a keyboard shortcut's `.click()`) still opens the popup.
 * A controlled `open: true` (e.g. the filter picker opened from a column
 * menu) also starts the load.
 *
 * The wrapper is a `display: contents` span, so it adds no box to the toolbar.
 */
export declare function deferredControl<M, P extends object>(d: Deferred<M>, pick: (m: M) => (props: P) => React.ReactNode, Stand: (props: P) => React.ReactNode): (props: P) => React.JSX.Element;
export {};
