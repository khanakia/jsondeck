/**
 * An item shown in a Preview / Code box (`code: true` on its spec): the spec
 * as source text (core/serialize.ts) next to the live item. An on-demand chunk.
 */
import type * as React from "react";
import type { PageItem } from "../core/config";
export declare function ItemCode({ spec, preview }: {
    spec: PageItem;
    preview: React.ReactNode;
}): React.JSX.Element;
