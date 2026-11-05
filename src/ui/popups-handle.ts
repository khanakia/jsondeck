// The one handle for the on-demand "popups" chunk (src/popups.ts), shared by
// dropdown-menu.tsx, popover.tsx and dialog.tsx so the chunk loads once.
import { deferred } from "./deferred"

export type Popups = typeof import("../popups")

export const popups = deferred(() => import("../popups"))
