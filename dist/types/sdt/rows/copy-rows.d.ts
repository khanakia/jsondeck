/**
 * Copy rows / a cell / a link with a toast saying how it went. On demand: the
 * right-click menu imports it, and the table loads it (with the serializers)
 * once a copy is possible (menu open, rows selected), so by the time a format
 * is picked the copy still runs inside the user's click.
 */
import { type CopyColumn, type CopyFormat } from "../../core/clipboard";
import { type Labels } from "../../core/labels";
import type { Row } from "../../core/query";
/** Rows in a format ("Copied 3 rows as CSV"). */
export declare function copyRowsAs(list: Row[], fmt: CopyFormat, columns: CopyColumn[], L: Labels): Promise<void>;
/** One cell as shown. */
export declare function copyCell(row: Row, column: CopyColumn, L: Labels): Promise<void>;
/** A link (a cell's `link` template, filled). */
export declare function copyLink(href: string, L: Labels): Promise<void>;
