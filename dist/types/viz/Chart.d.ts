import { type AggregateSpec, type Row } from "../core/aggregate";
export declare const CHART_TYPES: readonly ["bar", "stacked", "grouped", "line", "area", "pie", "donut", "sparkline"];
export type ChartType = (typeof CHART_TYPES)[number];
export type ChartSpec = AggregateSpec & {
    type: ChartType;
    title?: string | undefined;
    /** bar / stacked / grouped: draw bars left-to-right with labels on the left (best for long labels). */
    horizontal?: boolean | undefined;
    /** Plot height in px (horizontal bars grow with the number of rows instead). */
    height?: number | undefined;
    /** Value or series → colour (hex or a token name: s1…s8, good, warning, serious, critical, other). */
    colors?: Record<string, string> | undefined;
    /** Hide the legend even with several series. */
    legend?: boolean | undefined;
};
export type ChartProps = {
    rows: Row[];
    spec: ChartSpec;
    onSelect?: (value: string, series?: string) => void | undefined;
    /** Highlight these keys and dim the rest (e.g. the table's current filter). */
    selected?: string | string[] | undefined;
    /** Stable value order for colour slots (pass the values from the unfiltered rows). */
    colorDomain?: string[] | undefined;
    className?: string | undefined;
};
/**
 * Text width in px for the chart's real font (read from the element's computed
 * font-family), measured on a shared offscreen canvas. Falls back to the
 * per-character estimate when canvas is unavailable (e.g. jsdom).
 */
export declare function makeMeasure(el: Element | null): (s: string) => number;
export declare function Chart({ rows, spec, onSelect, selected, colorDomain, className }: ChartProps): import("react").JSX.Element;
/** Bare sparkline from a list of numbers (stat tiles). */
export declare function Sparkline({ values, height, label }: {
    values: number[];
    height?: number;
    label?: string;
}): import("react").JSX.Element;
