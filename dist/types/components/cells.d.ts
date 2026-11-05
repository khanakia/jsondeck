/**
 * Cell rendering. The chain, first match wins:
 *   column.render → types[type].render → renderers[type] → column.format → built-in renderer
 * then `link` wraps the result. Renderers may return text, a DOM Node or a React element.
 */
import * as React from "react";
import { type FormatFn, type RenderFn, type Row, type TypeDef } from "../core/config";
import type { ResolvedColumn } from "../core/resolve";
export type RenderCtx = {
    types: Record<string, TypeDef>;
    renderers: Record<string, RenderFn>;
    formats: Record<string, FormatFn>;
    /** Open the row a relation value points at (the row drawer). */
    onRelation?: ((table: string, field: string, value: unknown) => void) | undefined;
    /** Global status colour overrides (value → tone or CSS colour) and the badge class slot. */
    statusColors?: Record<string, string> | undefined;
    badgeClass?: string | undefined;
};
export declare function Badge({ v, colors, className }: {
    v: string;
    colors?: Record<string, string> | undefined;
    className?: string | undefined;
}): React.JSX.Element;
/** Fill "{field}" placeholders from the row (URL-encoded). */
export declare function fillTemplate(t: string, row: Row): string;
export declare function formatValue(value: unknown, row: Row, col: ResolvedColumn, formats: Record<string, FormatFn>): string | undefined;
export declare function renderCell(value: unknown, row: Row, col: ResolvedColumn, ctx: RenderCtx): React.ReactNode;
/** Tooltip text for a cell, or undefined. */
export declare function tooltipFor(value: unknown, row: Row, col: ResolvedColumn, formats: Record<string, FormatFn>): string | undefined;
