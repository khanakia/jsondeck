/**
 * One theme for the whole page, the DOM half (no React): every deck and
 * example box follows `<html data-theme="dark|light">` (or `class="dark"`),
 * else the OS setting. `setTheme` writes the html attribute and remembers the
 * choice. The <script> loader uses this file directly, so the theme applies
 * before the rest of jsondeck has loaded; theme.ts adds the React hooks.
 */
export type PageTheme = "light" | "dark";
export type ThemeChoice = PageTheme | "auto";
/** localStorage key shared with the demo site's navbar. */
export declare const THEME_KEY = "jsondeck:theme";
export declare const DARK_QUERY = "(prefers-color-scheme: dark)";
export declare const hasDom: () => boolean;
export declare function systemTheme(): PageTheme;
/** The theme the page asks for: html data-theme, then class="dark", else the OS. */
export declare function pageTheme(): PageTheme;
/** Set the page theme for every deck at once; "auto" goes back to the OS. Persisted (try/catch). */
export declare function setTheme(t: ThemeChoice): void;
/** Apply a stored choice once, unless the page already set a theme itself. */
export declare function restoreTheme(): void;
