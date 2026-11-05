/**
 * Small pieces the table core shares with its on-demand row parts (quick
 * filters, selection bar, expanded rows): kept apart so the core does not
 * pull those parts in.
 */
import type { Labels } from "../../core/labels"
import type { CopyFormat } from "../../core/copy"

/** Nesting stops here (a guard against relation cycles). */
export const MAX_DEPTH = 4
const FMT_KEY: Record<CopyFormat, "fmt_json" | "fmt_csv" | "fmt_tsv" | "fmt_markdown" | "fmt_text"> = {
	json: "fmt_json",
	csv: "fmt_csv",
	tsv: "fmt_tsv",
	markdown: "fmt_markdown",
	text: "fmt_text",
}
/** Menu label of a copy format ("JSON", "CSV", …). */
export function formatLabel(L: Labels, f: CopyFormat): string {
	return L[FMT_KEY[f]]
}

