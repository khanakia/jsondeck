/**
 * Tiny toast stack. `toast(msg)` works from anywhere (no React context): it
 * writes to a module-level store, and every mounted <Toaster /> renders it
 * through useSyncExternalStore. One <Toaster /> per page, mounted on the first
 * toast (ensureToaster). An on-demand chunk: callers use toast-api.ts, which
 * loads this module the first time a toast is shown.
 * Bottom-centre, auto-hides, announced politely to screen readers.
 */
import * as React from "react";
export declare const TOAST_KINDS: readonly ["default", "success", "error"];
export type ToastKind = (typeof TOAST_KINDS)[number];
export type ToastItem = {
    id: number;
    message: string;
    kind: ToastKind;
};
export type ToastOptions = {
    kind?: ToastKind | undefined;
    duration?: number | undefined;
};
/** How long a toast stays, in ms. */
export declare const TOAST_DURATION_MS = 1800;
/** Remove one toast now. */
export declare function dismissToast(id: number): void;
/** Show a message. Returns its id (for dismissToast). */
export declare function toast(message: string, opts?: ToastOptions): number;
/** Read the store from React (exported for custom renderers). */
export declare function useToasts(): ToastItem[];
export declare function Toaster(): React.ReactPortal | null;
export declare function ensureToaster(): void;
