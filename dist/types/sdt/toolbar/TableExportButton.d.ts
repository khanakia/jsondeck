import * as React from "react";
import type { ToolbarCtx } from "../types";
import { type CsvField } from "./csv";
type Props<TNode, TWhere = unknown> = {
    /** Toolbar context handed by `<DataTable toolbar={(ctx) => ...}>`. */
    ctx: ToolbarCtx<TNode, TWhere>;
    /** Filename for the downloaded file. Default `"export.csv"`.
     *  Can be a function for dynamic naming (e.g. include timestamp). */
    filename?: (string | (() => string)) | undefined;
    /** CSV column definitions: tuples of [header, getValue]. */
    fields: ReadonlyArray<CsvField<TNode>>;
    /** Show only one option ("page" or "all") — default both. */
    mode?: "page" | "all" | "both" | undefined;
    /** Override the trigger button label. Default "Export". */
    label?: string | undefined;
    /** Hide the leading icon. */
    hideIcon?: boolean | undefined;
    /** Hard cap on rows for the "All matching" option. Default 1000. The
     *  underlying fetchAll respects this and stops paging once reached. */
    maxAllRows?: number | undefined;
};
/**
 * Generic, reusable Export button for DataTable.
 *
 * Drops into the `toolbar` slot:
 *   <DataTable
 *     toolbar={(ctx) => (
 *       <TableExportButton ctx={ctx} fields={[…]} />
 *     )}
 *   />
 *
 * Renders a dropdown with two options when mode="both":
 *   - **Current page** — exports `ctx.nodes` (free, no extra request)
 *   - **All matching rows** — calls `ctx.fetchAll()` (paginated)
 */
export declare function TableExportButton<TNode, TWhere = unknown>({ ctx, filename, fields, mode, label, hideIcon, maxAllRows, }: Props<TNode, TWhere>): React.JSX.Element;
export {};
