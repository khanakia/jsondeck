/**
 * Column type guessing. Pure: no React, no DOM. Given a column's sample values
 * it returns a type (plus enum values/order). Every threshold comes from
 * GuessOptions; custom detectors run first so users can add their own types.
 */
import type { Detector, ResolvedGuess, Row } from "./config";
/** Built-in thresholds; `config.guess` overrides any of them. */
export declare const DEFAULT_GUESS: ResolvedGuess;
export declare const isEmpty: (v: unknown) => v is "" | null | undefined;
export type Guess = {
    type: string;
    order?: string[];
    values?: string[];
};
/** Sorted distinct values, in a known order when one matches. */
export declare function enumValues(strs: string[], knownOrders: string[][]): {
    values: string[];
    order?: string[];
};
/** Guess one column's type from its sample values. */
export declare function guessType(values: unknown[], opts?: ResolvedGuess, detectors?: Detector[]): Guess;
/** Keys in first-seen order across the sample, so sparse keys still get a column. */
export declare function collectKeys(rows: Row[], sampleSize?: number): string[];
