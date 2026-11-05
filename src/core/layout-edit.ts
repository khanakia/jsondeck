/**
 * Layout edits, pure functions over a PageConfig: move, resize, remove and
 * add items, and the starter spec for "Add". Loaded with the layout editor
 * (components/EditTools.tsx and Deck's edit operations), not with every page.
 */
import type { ComponentBase, PageConfig, PageItem, SectionConfig } from "./config"
import type { ResolvedDeck } from "./resolve"
import { clonePage, type ComponentKind } from "./layout"

function sectionAt(sections: SectionConfig[], path: string): SectionConfig | undefined {
	let list = sections
	let found: SectionConfig | undefined
	for (const part of path.split(".")) {
		found = list[Number(part)]
		if (!found) return undefined
		list = found.sections ?? []
	}
	return found
}

export function moveItem(p: PageConfig, itemId: string, toPath: string, toIndex: number): PageConfig {
	const out = clonePage(p)
	let moved: PageItem | undefined
	const take = (sections: SectionConfig[]) =>
		sections.forEach((s) => {
			const i = (s.items ?? []).findIndex((it) => it.id === itemId)
			if (i >= 0) moved = s.items?.splice(i, 1)[0]
			take(s.sections ?? [])
		})
	take(out.sections)
	const target = sectionAt(out.sections, toPath)
	if (!moved || !target) return p
	target.items = target.items ?? []
	target.items.splice(Math.max(0, Math.min(toIndex, target.items.length)), 0, moved)
	return out
}

export function updateItem(p: PageConfig, itemId: string, patch: Partial<ComponentBase>): PageConfig {
	const out = clonePage(p)
	const walk = (sections: SectionConfig[]) =>
		sections.forEach((s) => {
			s.items = (s.items ?? []).map((it) => (it.id === itemId ? { ...it, ...patch } : it))
			walk(s.sections ?? [])
		})
	walk(out.sections)
	return out
}

export function removeItem(p: PageConfig, itemId: string): PageConfig {
	const out = clonePage(p)
	const walk = (sections: SectionConfig[]) =>
		sections.forEach((s) => {
			s.items = (s.items ?? []).filter((it) => it.id !== itemId)
			walk(s.sections ?? [])
		})
	walk(out.sections)
	return out
}

export function addItem(p: PageConfig, path: string, item: PageItem): PageConfig {
	const out = clonePage(p)
	const target = sectionAt(out.sections, path)
	if (!target) return p
	target.items = [...(target.items ?? []), item]
	return out
}

/** A starter spec for "Add item": sensible defaults from the dataset's resolved columns. */
export function starterItem(deck: ResolvedDeck, kind: ComponentKind, table: string, id: string): PageItem {
	const t = deck.tables.find((x) => x.name === table)
	const enumCol = t?.columns.find((c) => c.type === "enum")?.id
	switch (kind) {
		case "chart":
			return { component: "chart", table, id, type: "bar", ...(enumCol ? { groupBy: enumCol } : {}) }
		case "stat":
			return { component: "stat", table, id, label: t?.label ?? table }
		case "kv":
			return { component: "kv", table, id }
		case "markdown":
			return { component: "markdown", id, text: "**Note** — edit this text in the copied config." }
		case "facets":
			return { component: "facets", table, id, fields: enumCol ? [enumCol] : [] }
		case "toc":
			return { component: "toc", id }
		default:
			return { component: "table", table, id }
	}
}

