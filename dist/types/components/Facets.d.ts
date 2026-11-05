/**
 * The facets component (count per value, click to filter), an on-demand chunk
 * loaded when a page shows one (a `facets` item or a table's `facets` sidebar).
 */
import type { ResolvedItem } from "../core/layout";
import { type PageCtx } from "./Items";
/** Count per value for each field; clicking a value filters the target tables. */
export declare function Facets({ item, ctx, fields }: {
    item: ResolvedItem;
    ctx: PageCtx;
    fields: string[];
}): import("react").JSX.Element;
