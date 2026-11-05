/**
 * `describe`'s output: the resolved config as plain JSON. Pure. Part of the
 * extras chunk (src/extras.ts), not the core: mounting never needs it.
 */
import type { ResolvedDeck } from "./resolve";
/**
 * The resolved config as plain JSON in the same shape as the input config
 * (functions left out), so it can be copied, edited and passed back.
 */
export declare function describeDeck(d: ResolvedDeck): Record<string, unknown>;
