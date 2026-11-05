/** 1,284 / 12.9K / 4.2M. Non-finite values show as an en dash. */
export declare function formatNumber(n: number, compact?: boolean): string;
export declare function formatPercent(n: number): string;
/** Display text of one cell, by column type. Rendering (links, badges) is done by the caller. */
/** `type` is a column type name (text, number, date, datetime, boolean, json, …); unknown names format as text. */
export declare function formatValue(v: unknown, type?: string): string;
/** "Nice" axis ticks covering [min, max] with about `count` steps (0 always included for bar-like data). */
export declare function niceTicks(min: number, max: number, count?: number): number[];
