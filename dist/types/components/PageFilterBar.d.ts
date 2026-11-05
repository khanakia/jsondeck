/**
 * The page filter bar (`filters` on a page): one select per field, applied to
 * every component on the page that has the field. An on-demand chunk, loaded
 * before the first render of a deck with page filters
 * (components/first-paint.ts).
 */
import * as React from "react";
import type { ResolvedPage } from "../core/layout";
/** Page filter bar: one select per field; applies to every component that has the field. */
export declare function PageFilterBar({ page, values, onChange }: {
    page: ResolvedPage;
    values: Record<string, string>;
    onChange: (field: string, value: string | undefined) => void;
}): React.JSX.Element | null;
