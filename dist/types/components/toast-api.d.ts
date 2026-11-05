/**
 * `toast(message)` for the core: the toast stack and its host (Toast.tsx) are
 * an on-demand chunk, loaded and mounted the first time a toast is shown.
 * Toasts only follow a user action (a copy), so the few milliseconds the chunk
 * takes are not visible.
 */
import type { ToastOptions } from "./Toast";
export declare function toast(message: string, opts?: ToastOptions): void;
