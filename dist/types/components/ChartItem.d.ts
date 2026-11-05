/**
 * A chart item on a page (data from the page's rows, click-to-filter, palette,
 * fitting a fixed-height box), with the chart itself: one on-demand chunk,
 * loaded when a page shows a chart.
 */
import * as React from "react";
import type { ResolvedItem } from "../core/layout";
import { type PageCtx } from "./Items";
export declare function ChartItemView({ item, ctx }: {
    item: ResolvedItem;
    ctx: PageCtx;
}): React.JSX.Element | null;
