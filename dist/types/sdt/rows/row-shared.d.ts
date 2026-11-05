/**
 * Small pieces the table core shares with its on-demand row parts (quick
 * filters, selection bar, expanded rows): kept apart so the core does not
 * pull those parts in.
 */
import type { Labels } from "../../core/labels";
import type { CopyFormat } from "../../core/copy";
/** Nesting stops here (a guard against relation cycles). */
export declare const MAX_DEPTH = 4;
/** Menu label of a copy format ("JSON", "CSV", …). */
export declare function formatLabel(L: Labels, f: CopyFormat): string;
