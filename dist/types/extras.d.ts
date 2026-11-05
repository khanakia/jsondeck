/**
 * The public API beyond mounting: `describe`, the snippet writers and the
 * constants. A page that only mounts never needs these, so the <script>
 * loader fetches this module only when `JsonDeck.ready` is read (the API
 * guide: "the rest is there after `await JsonDeck.ready`"). The ES module and
 * the single offline file include it at once (index.tsx).
 */
import type { JsonDeckConfig } from "./core/config";
/**
 * The full resolved config as plain JSON (functions left out), in the same
 * shape as the input config: copy it, edit only what is wrong, pass it back.
 */
export declare function describe(data: JsonDeckConfig["data"], config?: Omit<Partial<JsonDeckConfig>, "data">): Record<string, unknown>;
export { BUILTIN_FORMATS } from "./core/formats";
export { DEFAULT_GUESS } from "./core/guess";
export { DEFAULT_ACRONYMS, DEFAULT_LABELS, humanize } from "./core/labels";
export { htmlSnippet, toSource } from "./core/serialize";
export { CLASS_SLOTS, TOKEN_NAMES } from "./core/theme-tokens";
export { THEME_TOKENS } from "./core/theme-defaults";
