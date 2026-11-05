/**
 * Copy rows / a cell / a link with a toast saying how it went. On demand: the
 * right-click menu imports it, and the table loads it (with the serializers)
 * once a copy is possible (menu open, rows selected), so by the time a format
 * is picked the copy still runs inside the user's click.
 */
import { cellText, type CopyColumn, type CopyFormat, copyText, serializeRows } from "../../core/clipboard"
import { fill, type Labels, plural } from "../../core/labels"
import type { Row } from "../../core/query"
import { toast } from "../../components/toast-api"
import { formatLabel } from "./row-shared"

/** Rows in a format ("Copied 3 rows as CSV"). */
export async function copyRowsAs(list: Row[], fmt: CopyFormat, columns: CopyColumn[], L: Labels): Promise<void> {
	const ok = await copyText(serializeRows(fmt, list, columns))
	toast(ok ? fill(plural(L, list.length, "copiedRows", "copiedRowsOne"), { n: list.length, fmt: formatLabel(L, fmt) }) : L.copyFailed, { kind: ok ? "success" : "error" })
}

/** One cell as shown. */
export async function copyCell(row: Row, column: CopyColumn, L: Labels): Promise<void> {
	const ok = await copyText(cellText(row, column))
	toast(ok ? L.copiedCell : L.copyFailed, { kind: ok ? "success" : "error" })
}

/** A link (a cell's `link` template, filled). */
export async function copyLink(href: string, L: Labels): Promise<void> {
	const ok = await copyText(href)
	toast(ok ? L.copiedLink : L.copyFailed, { kind: ok ? "success" : "error" })
}
