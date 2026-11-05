import { type PageTheme } from "./theme-dom";
export { pageTheme, restoreTheme, setTheme, systemTheme, THEME_KEY, type PageTheme, type ThemeChoice } from "./theme-dom";
/** The current page theme; re-renders when it changes anywhere. */
export declare function usePageTheme(): PageTheme;
/** The OS theme; re-renders when it changes. */
export declare function useSystemTheme(): PageTheme;
