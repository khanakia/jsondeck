/**
 * "On this page": the headings of the current page's markdown items (## and
 * ###), as links to their anchors, with scroll-spy (the heading nearest above
 * the sticky line is marked current). Sticky below `--jds-sticky-top`; hidden
 * on narrow screens, where it would only repeat the content below it.
 */
import * as React from "react";
export declare function Toc({ pageId, className }: {
    pageId: string;
    className?: string | undefined;
}): React.JSX.Element;
