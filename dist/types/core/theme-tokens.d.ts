/**
 * Every theme token jsondeck reads, with its light and dark default. Pure data.
 * Each token is the CSS variable `--jds-<name>` on `.jd-root`, so it can be
 * overridden in config (`theme: { light: {...}, dark: {...} }`) or in plain CSS
 * (`.jd-root { --jds-primary: #2563eb }`, `.jd-root.jd-dark { ... }`).
 */
export declare const THEME_TOKENS: {
    readonly page: {
        readonly light: "#f4f4f5";
        readonly dark: "#09090b";
        readonly description: "Page background (for host pages; the root itself is transparent)";
    };
    readonly card: {
        readonly light: "#ffffff";
        readonly dark: "#18181b";
        readonly description: "Block surface: tables, charts, cards, drawer";
    };
    readonly "card-border": {
        readonly light: "rgb(228 228 231 / 0.8)";
        readonly dark: "rgb(39 39 42 / 0.7)";
        readonly description: "Block border (subtle; blocks separate from the page by this border only)";
    };
    readonly "card-shadow": {
        readonly light: "none";
        readonly dark: "none";
        readonly description: "Block shadow; none by default (set e.g. 0 1px 2px rgb(0 0 0 / 0.05) to add one back)";
    };
    readonly background: {
        readonly light: "#ffffff";
        readonly dark: "#18181b";
        readonly description: "Inner surfaces: table cells, inputs";
    };
    readonly foreground: {
        readonly light: "#18181b";
        readonly dark: "#fafafa";
        readonly description: "Text";
    };
    readonly muted: {
        readonly light: "#f4f4f5";
        readonly dark: "#27272a";
        readonly description: "Muted surface: table header, hover";
    };
    readonly "muted-foreground": {
        readonly light: "#71717a";
        readonly dark: "#a1a1aa";
        readonly description: "Secondary text";
    };
    readonly accent: {
        readonly light: "#f4f4f5";
        readonly dark: "#27272a";
        readonly description: "Hover / active item background";
    };
    readonly "accent-foreground": {
        readonly light: "#18181b";
        readonly dark: "#fafafa";
        readonly description: "Text on accent";
    };
    readonly primary: {
        readonly light: "#18181b";
        readonly dark: "#fafafa";
        readonly description: "Primary buttons, active chips, badges";
    };
    readonly "primary-foreground": {
        readonly light: "#fafafa";
        readonly dark: "#18181b";
        readonly description: "Text on primary";
    };
    readonly secondary: {
        readonly light: "#f4f4f5";
        readonly dark: "#27272a";
        readonly description: "Neutral badges";
    };
    readonly "secondary-foreground": {
        readonly light: "#18181b";
        readonly dark: "#fafafa";
        readonly description: "Text on secondary";
    };
    readonly popover: {
        readonly light: "#ffffff";
        readonly dark: "#18181b";
        readonly description: "Menus, popovers, tooltips of charts";
    };
    readonly "popover-foreground": {
        readonly light: "#18181b";
        readonly dark: "#fafafa";
        readonly description: "Text in menus";
    };
    readonly border: {
        readonly light: "#efeff1";
        readonly dark: "rgb(39 39 42 / 0.6)";
        readonly description: "Inner dividers: row lines, header bottom (a step lighter than card-border)";
    };
    readonly input: {
        readonly light: "#e4e4e7";
        readonly dark: "#27272a";
        readonly description: "Input borders";
    };
    readonly ring: {
        readonly light: "#a1a1aa";
        readonly dark: "#52525b";
        readonly description: "Focus ring, chart axes";
    };
    readonly destructive: {
        readonly light: "#dc2626";
        readonly dark: "#ef4444";
        readonly description: "Danger actions";
    };
    readonly tabs: {
        readonly light: "#e4e4e7";
        readonly dark: "#27272a";
        readonly description: "Segmented tab pill on the page";
    };
    readonly "tabs-card": {
        readonly light: "#f4f4f5";
        readonly dark: "#27272a";
        readonly description: "Segmented tab pill inside a card";
    };
    readonly "tab-badge": {
        readonly light: "#d4d4d8";
        readonly dark: "#3f3f46";
        readonly description: "Tab count badge";
    };
    readonly "chart-1": {
        readonly light: "#2a78d6";
        readonly dark: "#3987e5";
        readonly description: "Chart palette slot 1";
    };
    readonly "chart-2": {
        readonly light: "#eb6834";
        readonly dark: "#d95926";
        readonly description: "Chart palette slot 2";
    };
    readonly "chart-3": {
        readonly light: "#1baf7a";
        readonly dark: "#199e70";
        readonly description: "Chart palette slot 3";
    };
    readonly "chart-4": {
        readonly light: "#eda100";
        readonly dark: "#c98500";
        readonly description: "Chart palette slot 4";
    };
    readonly "chart-5": {
        readonly light: "#e87ba4";
        readonly dark: "#d55181";
        readonly description: "Chart palette slot 5";
    };
    readonly "chart-6": {
        readonly light: "#008300";
        readonly dark: "#008300";
        readonly description: "Chart palette slot 6";
    };
    readonly "chart-7": {
        readonly light: "#6250d6";
        readonly dark: "#9085e9";
        readonly description: "Chart palette slot 7";
    };
    readonly "chart-8": {
        readonly light: "#e34948";
        readonly dark: "#e66767";
        readonly description: "Chart palette slot 8";
    };
    readonly "chart-other": {
        readonly light: "#b5b3ab";
        readonly dark: "#5f5e58";
        readonly description: "The folded 'Other' group";
    };
    readonly good: {
        readonly light: "#0ca30c";
        readonly dark: "#0ca30c";
        readonly description: "Status: good";
    };
    readonly warning: {
        readonly light: "#fab219";
        readonly dark: "#fab219";
        readonly description: "Status: warning";
    };
    readonly serious: {
        readonly light: "#ec835a";
        readonly dark: "#ec835a";
        readonly description: "Status: serious";
    };
    readonly critical: {
        readonly light: "#d03b3b";
        readonly dark: "#d03b3b";
        readonly description: "Status: critical";
    };
    readonly up: {
        readonly light: "#006300";
        readonly dark: "#0ca30c";
        readonly description: "Delta up (stat tiles)";
    };
    readonly down: {
        readonly light: "#b42828";
        readonly dark: "#e66767";
        readonly description: "Delta down (stat tiles)";
    };
    readonly radius: {
        readonly light: "6px";
        readonly dark: "6px";
        readonly description: "Control radius (cards are 2px rounder)";
    };
    readonly "font-size": {
        readonly light: "13px";
        readonly dark: "13px";
        readonly description: "Base text size";
    };
    readonly "row-height": {
        readonly light: "28px";
        readonly dark: "28px";
        readonly description: "Table row height, compact density";
    };
    readonly "row-height-comfortable": {
        readonly light: "36px";
        readonly dark: "36px";
        readonly description: "Table row height, comfortable density";
    };
    readonly "sticky-top": {
        readonly light: "0px";
        readonly dark: "0px";
        readonly description: "Offset for sticky parts (sidebar, table of contents, heading scroll) below a host's own sticky header";
    };
};
export type ThemeTokenName = keyof typeof THEME_TOKENS;
/** Runtime check that a string is a token name. */
export declare function isTokenName(k: string): k is ThemeTokenName;
/** Every token name, typed. */
export declare const TOKEN_NAMES: ThemeTokenName[];
export type ThemeTokens = {
    [K in ThemeTokenName]?: string | undefined;
};
/** Styling hooks: a user class name per slot, applied as given (not prefixed). */
export declare const CLASS_SLOTS: readonly ["root", "page", "section", "sectionTitle", "grid", "item", "card", "cardHeader", "cardTitle", "toolbar", "table", "thead", "th", "tbody", "tr", "td", "groupRow", "detailPanel", "pagination", "chart", "stat", "kv", "markdown", "drawer", "tabs", "tab", "tabActive", "badge"];
export type ClassSlot = (typeof CLASS_SLOTS)[number];
export type ClassNames = {
    [K in ClassSlot]?: string | undefined;
};
/** Token overrides as inline CSS variables for the root element. */
export declare function tokenStyle(tokens: ThemeTokens | undefined): Record<string, string>;
