import { ICON_BTN, LABEL_BTN, Tip, useToolbarLabels } from "../../components/Tip"
import { Download, Loader2 } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ToolbarCtx } from "../types"
import { useLabels } from "@/lib/labels"
import { fill } from "../../core/labels"
import { type CsvField, downloadCsv, downloadJson } from "./csv"

type Props<TNode, TWhere = unknown> = {
	/** Toolbar context handed by `<DataTable toolbar={(ctx) => ...}>`. */
	ctx: ToolbarCtx<TNode, TWhere>
	/** Filename for the downloaded file. Default `"export.csv"`.
	 *  Can be a function for dynamic naming (e.g. include timestamp). */
	filename?: (string | (() => string)) | undefined
	/** CSV column definitions: tuples of [header, getValue]. */
	fields: ReadonlyArray<CsvField<TNode>>
	/** Show only one option ("page" or "all") — default both. */
	mode?: "page" | "all" | "both" | undefined
	/** Override the trigger button label. Default "Export". */
	label?: string | undefined
	/** Hide the leading icon. */
	hideIcon?: boolean | undefined
	/** Hard cap on rows for the "All matching" option. Default 1000. The
	 *  underlying fetchAll respects this and stops paging once reached. */
	maxAllRows?: number | undefined
}

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
export function TableExportButton<TNode, TWhere = unknown>({
	ctx,
	filename = "export.csv",
	fields,
	mode = "both",
	label = "Export",
	hideIcon,
	maxAllRows = 1000,
}: Props<TNode, TWhere>) {
	const [busy, setBusy] = React.useState(false)
	const L = useLabels()

	const resolveName = React.useCallback(
		() => (typeof filename === "function" ? filename() : filename),
		[filename],
	)

	// Single-mode shortcut — render a plain button, no dropdown.
	if (mode === "page") {
		return (
			<TriggerButton
				label={label}
				hideIcon={hideIcon}
				disabled={busy || ctx.isFetching}
				onClick={() => downloadCsv(resolveName(), ctx.nodes, fields)}
			/>
		)
	}
	if (mode === "all") {
		return (
			<TriggerButton
				label={label}
				hideIcon={hideIcon}
				disabled={busy || ctx.isFetching}
				loading={busy}
				onClick={async () => {
					setBusy(true)
					try {
						// Match the batch size to the cap so we only need a single
						// network round trip in the common case. fetchAll right-sizes
						// the last `first` arg, so the actual GraphQL request will
						// ask for exactly `maxAllRows` rows.
						const rows = await ctx.fetchAll({
							batchSize: maxAllRows,
							maxRows: maxAllRows,
						})
						downloadCsv(resolveName(), rows, fields)
					} finally {
						setBusy(false)
					}
				}}
			/>
		)
	}

	// mode === "both"
	return (
		<DropdownMenu>
			<Tip label={label}>
				<DropdownMenuTrigger asChild>
					<TriggerButton label={label} hideIcon={hideIcon} disabled={busy || ctx.isFetching} loading={busy} />
				</DropdownMenuTrigger>
			</Tip>
			<DropdownMenuContent align="end" className="jd:min-w-44 jd:p-0.5">
				<DropdownMenuItem
					className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
					onClick={() => downloadCsv(resolveName(), ctx.nodes, fields)}
				>
					{fill(L.exportPage, { n: ctx.nodes.length })}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
					onClick={async () => {
						setBusy(true)
						try {
							const rows = await ctx.fetchAll({
								batchSize: maxAllRows,
								maxRows: maxAllRows,
							})
							downloadCsv(resolveName(), rows, fields)
						} finally {
							setBusy(false)
						}
					}}
				>
					{/* When the filtered set is bigger than the cap, label the
              limit explicitly so the user knows they're getting a slice. */}
					{typeof ctx.totalCount === "number" && ctx.totalCount > maxAllRows
						? `First ${maxAllRows.toLocaleString()} of ${ctx.totalCount.toLocaleString()}`
						: fill(L.exportAll, { n: ctx.totalCount ?? ctx.nodes.length })}
				</DropdownMenuItem>
				<DropdownMenuItem
					className="jd:h-7 jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs"
					onClick={async () => {
						const rows = await ctx.fetchAll({ maxRows: maxAllRows })
						downloadJson(resolveName().replace(/\.csv$/, ".json"), rows)
					}}
				>
					{fill(L.exportJson, { n: ctx.totalCount ?? ctx.nodes.length })}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// ── Internal trigger button ──────────────────────────────────────────────
// React 19 + basecn pass `ref` as a regular prop and base-ui's
// DropdownMenuTrigger `asChild` handles ref injection — no forwardRef
// wrapper needed.

function TriggerButton({
	label,
	hideIcon,
	loading,
	disabled,
	onClick,
}: {
	label: string
	hideIcon?: boolean | undefined
	loading?: boolean | undefined
	disabled?: boolean | undefined
	onClick?: (() => void) | undefined
}) {
	const withLabels = useToolbarLabels()
	return (
		<Button variant="ghost" size="sm" aria-label={label} className={withLabels ? LABEL_BTN : ICON_BTN} disabled={disabled} onClick={onClick}>
			{!hideIcon && (loading ? <Loader2 className="jd:h-3.5 jd:w-3.5 jd:animate-spin" /> : <Download className="jd:h-3.5 jd:w-3.5" />)}
			{withLabels && label}
		</Button>
	)
}
