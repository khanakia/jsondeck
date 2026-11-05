/**
 * Pinned (frozen) columns, an on-demand chunk loaded before the first render
 * when a table pins a column (components/first-paint.ts). Pure.
 */
import type * as React from "react"

type Col = { id: string }

/** Sticky style per pinned column, with cumulative offsets from its edge (left pins from the left, right pins from the right). */
export function pinOffsets<C extends Col>(visible: readonly C[], pinOf: (id: string) => "left" | "right" | undefined, widthOf: (c: C) => number): Map<string, React.CSSProperties> {
	const out = new Map<string, React.CSSProperties>()
	let left = 0
	for (const c of visible) {
		if (pinOf(c.id) !== "left") continue
		out.set(c.id, { position: "sticky", left, zIndex: 2 })
		left += widthOf(c)
	}
	let right = 0
	for (const c of [...visible].reverse()) {
		if (pinOf(c.id) !== "right") continue
		out.set(c.id, { position: "sticky", right, zIndex: 2 })
		right += widthOf(c)
	}
	return out
}

/** A frozen column's edge: a border on the side facing the scrolling columns (no shadow: blocks separate by border only). */
export function pinEdge(pin: "left" | "right" | undefined): string | undefined {
	if (pin === "left") return "jd:border-r"
	if (pin === "right") return "jd:border-l"
	return undefined
}
