import * as React from "react";
import type { PageConfig } from "../core/config";
import type { ResolvedPage } from "../core/layout";
import { type LayoutOps } from "./edit-context";
export type { LayoutOps } from "./edit-context";
export declare function PageView({ page, edit, ops, pageFilters, onPageFilter, }: {
    page: ResolvedPage;
    config: PageConfig;
    edit: boolean;
    ops: LayoutOps;
    pageFilters: Record<string, string>;
    onPageFilter: (field: string, value: string | undefined) => void;
}): React.JSX.Element;
