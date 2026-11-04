// Generates docs-content/config-reference.json from src/core/config.ts: walks
// JsonDeckConfig and every nested config type, keeps each key's JSDoc, its
// declared type text and a default parsed from the JSDoc.
//
// Why Babel and not the TypeScript compiler API: the repo uses TypeScript 7
// (the native compiler), whose npm package has no JS compiler API. @babel/parser
// (already a dev dependency) parses the TS syntax; the small resolver below
// follows type aliases, intersections, Omit<>, unions, arrays and Record<>.
// Run from the repo root: node docs-content/gen-reference.mjs
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "@babel/parser"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
/** Files whose type aliases the config refers to. */
const FILES = ["src/core/config.ts", "src/viz/Chart.tsx", "src/viz/StatTile.tsx", "src/viz/KeyValueCard.tsx", "src/core/aggregate.ts"]

/** alias name → { node (type annotation), src (file text) } */
const aliases = new Map()
for (const f of FILES) {
	const src = readFileSync(join(root, f), "utf8")
	const ast = parse(src, { sourceType: "module", plugins: ["typescript", "jsx"] })
	for (const stmt of ast.program.body) {
		const decl = stmt.type === "ExportNamedDeclaration" ? stmt.declaration : stmt
		if (decl?.type === "TSTypeAliasDeclaration") aliases.set(decl.id.name, { node: decl.typeAnnotation, src })
	}
}
if (!aliases.has("JsonDeckConfig")) throw new Error("JsonDeckConfig not found in config.ts")

/** Record keys get a readable placeholder instead of "<key>". */
const PLACEHOLDER = { tables: "<table>", columns: "<column>", computed: "<column>", types: "<type>", renderers: "<type>", formats: "<name>", labels: "<label>", groupAggregates: "<column>", colors: "<value>" }
/** Records whose values are leaves (functions, strings): document the record, not its entries. */
const LEAF_RECORDS = new Set(["renderers", "formats", "labels", "colors", "groupAggregates", "order"])
/** Descriptions for keys whose JSDoc is missing in config.ts (hand-written, kept short). */
/** Item keys inherited from table settings: documented once under tables.<table>, not re-expanded per placement. */
const NO_DESCEND_IN_ITEMS = new Set(["columns", "computed", "defaultSort", "defaultFilters", "search", "views", "expand", "detail", "quickFilters", "rowActions"])
const FALLBACK = {
	"tables": "Per-table settings, keyed by the table's name in data.",
	"tables.<table>.columns.<column>": "One column: a type name shorthand (\"mono\", \"badge\") or a column config object.",
	"tables.<table>.columns.<column>.filter.type": "Filter control kind.",
	"tables.<table>.columns.<column>.filter.options": "Fixed choices for a select filter: strings or { value, label }.",
	"tables.<table>.columns.<column>.filter.options[].value": "Value the filter matches.",
	"tables.<table>.columns.<column>.filter.options[].label": "Text shown for the choice.",
	"tables.<table>.columns.<column>.filter.operators": "Limit the operators offered for this column.",
	"tables.<table>.computed.<column>": "A computed column: same keys as a column config, plus value(row).",
	"tables.<table>.defaultSort[].column": "Column to sort by.",
	"tables.<table>.defaultSort[].direction": "asc (default) or desc.",
	"tables.<table>.defaultFilters[].column": "Column to filter.",
	"tables.<table>.defaultFilters[].operator": "Filter operator (default: the column's default operator).",
	"tables.<table>.defaultFilters[].value": "Value to filter by (an array for in / is any of).",
	"tables.<table>.search.columns": "Columns the search box looks in.",
	"tables.<table>.views.storage": "A ViewStorage implementation for this table's saved views.",
	"tables.<table>.expand.relation": "Expand a row into the rows of this relation (its label).",
	"views.storage": "A ViewStorage implementation (list/get/save/delete/setDefault/setFavorite); default: localStorage.",
	"guess.detectors[].type": "Type name to give a column when the test passes.",
	"guess.detectors[].test": "Gets the non-empty sample values; return true to claim the column.",
	"types.<type>": "One registered type.",
	"pages[].sections[].items[].id": "Stable id: keys the item's state and saved views; master and targets refer to it (default: page/section/index).",
	"pages[].sections[].items[].label": "Table: tab/title text. Stat: the tile label (default: the item title, else the table label).",
	"pages[].sections[].items[].key": "Table: row id column. KV card: the key value of the row to show, matched against the table key (default: the first row).",
	"pages[].sections[].items[].columns": "Table: column settings for this placement. KV card: 1 or 2 columns of pairs.",
	"pages[].sections[].items[].groupBy": "Table: group rows by these columns. Chart: the category axis (a column or a function of the row).",
	"pages[].sections[].items[].type": "Chart type: bar, stacked, grouped, line, area, pie, donut or sparkline.",
	"pages[].sections[].items[].series": "Chart: second split (stacked/grouped bars, one line per value).",
	"pages[].sections[].items[].targets": "Item ids a click filters (default: tables of the same dataset on the page).",
	"pages[].sections[].items[].measure": "\"count\" (default), \"sum:col\", \"avg:col\", \"min:col\", \"max:col\", \"distinct:col\" or { op, field }.",
	"pages[].sections[].items[].measure.op": "count, sum, avg, min, max or distinct.",
	"pages[].sections[].items[].measure.field": "Column the measure reads.",
	"pages[].sections[].items[].where": "Only rows matching: { col: value | [values] | { op, value } }.",
	"pages[].sections[].items[].where.<key>": "A value (is), an array (is any of) or { op, value, type }.",
	"pages[].sections[].items[].where.<key>.op": "A filter operator (eq, gt, contains, between, …).",
	"pages[].sections[].items[].where.<key>.value": "Value to compare with.",
	"pages[].sections[].items[].where.<key>.type": "Comparison type when the guess is wrong (number, date, text).",
	"pages[].sections[].items[].sort": "Chart order: \"-value\" (default for categories), \"value\", \"key\", \"-key\" or an explicit value list.",
	"pages[].sections[].items[].compare": "Stat: the same measure over rows matching this where, shown as a delta.",
	"pages[].sections[].items[].compare.<key>": "Same shape as where.",
	"pages[].sections[].items[].trend.field": "Date column for the sparkline.",
	"pages[].sections[].items[].trend.bucket": "day (default), week, month or year.",
	"pages[].sections[].items[].trend.points": "How many recent points to show (default 12).",
	"pages[].sections[].items[].fields[].field": "Column to show.",
	"pages[].sections[].items[].fields[].label": "Label (default: the column label).",
	"pages[].sections[].items[].fields[].type": "Format the value as this column type.",
	"pages[].sections[].items[].aggregates[].label": "Label of the aggregate pair.",
	"pages[].sections[].items[].aggregates[].measure": "Same as the measure key.",
	"pages[].sections[].items[].aggregates[].where": "Same as the where key.",
	"theme": "Theme of this deck: inherit (default) follows the page theme, auto follows the OS, light/dark pin it.",
	"pageSize": "Default rows per page.",
	"pageSizes": "Choices in the rows-per-page picker.",
	"views": "Saved views: false turns them off; { storage } plugs in another store (default: this browser's localStorage).",
	"guess": "Tuning for column type guessing.",
	"types": "Register a new column type or replace a built-in one.",
	"tables.<table>": "Settings for one table (a named array in data).",
	"tables.<table>.label": "Tab and title text for the table (default: humanized name).",
	"tables.<table>.columns": "Per-column settings: a type name shorthand (\"mono\") or a column config object.",
	"tables.<table>.exclude": "Columns to leave out.",
	"tables.<table>.defaultSort": "Initial sort: \"col\" (asc), \"-col\" (desc) or { column, direction }.",
	"tables.<table>.defaultFilters": "Initial filters: { column, operator?, value }.",
	"tables.<table>.pageSize": "Rows per page for this table.",
	"tables.<table>.views": "Saved views for this table (false = off).",
	"tables.<table>.rowClass": "Extra CSS class for a row, from the row.",
	"tables.<table>.onRowClick": "Called with the row when a row is clicked.",
	"tables.<table>.columns.<column>.label": "Header text (default: humanized key).",
	"tables.<table>.columns.<column>.hidden": "Hide the column (it can be shown again from the Columns menu).",
	"tables.<table>.columns.<column>.width": "Width in px.",
	"tables.<table>.columns.<column>.minWidth": "Smallest width in px when resizing.",
	"tables.<table>.columns.<column>.pin": "Pin the column to the left or right edge.",
	"tables.<table>.columns.<column>.align": "Cell text alignment.",
	"tables.<table>.columns.<column>.className": "Extra CSS class on the column's cells.",
	"tables.<table>.columns.<column>.render": "Custom cell renderer: return text, a DOM node or a React element.",
	"tables.<table>.columns.<column>.filter": "Filter control: false (none), a kind, or { type, options, operators }.",
	"tables.<table>.detail.fields": "Fields shown in the expanded row (default: every hidden column).",
	"tables.<table>.detail.render": "Custom renderer for the whole detail panel.",
	"tables.<table>.quickFilters[].column": "Column the quick filter controls.",
	"tables.<table>.quickFilters[].kind": "range (min/max + slider), chips, toggle or search.",
	"tables.<table>.quickFilters[].label": "Label shown before the control.",
	"tables.<table>.rowActions[].label": "Menu item text.",
	"tables.<table>.rowActions[].icon": "Icon name for the menu item.",
	"tables.<table>.rowActions[].onSelect": "Called with the clicked row and the selected rows (or just that row).",
	"types.<type>.render": "Renderer for cells of this type.",
	"types.<type>.filter": "Filter control for this type (false = none).",
	"types.<type>.sort": "Sort kind or comparator for this type (false = not sortable).",
	"types.<type>.align": "Default alignment for this type.",
	"types.<type>.format": "Default format for this type.",
	"types.<type>.width": "Default column width in px.",
	"relations[].from": "`table.column` holding the pointer.",
	"relations[].to": "`table.column` being pointed at (usually the target table's key).",
	"relations[].label": "Name of the forward link (default: the target table).",
	"relations[].reverseLabel": "Name of the reverse link (default: the source table).",
	"pages[].title": "Page title (nav label).",
	"pages[].sections": "The page's sections, top to bottom.",
	"pages[].sections[].title": "Section heading.",
	"pages[].sections[].description": "Text under the heading.",
	"pages[].sections[].collapsible": "Show a collapse toggle.",
	"pages[].sections[].collapsed": "Start collapsed.",
	"pages[].sections[].items": "Components placed in this section's grid.",
	"pages[].sections[].sections": "Nested sections.",
	"pages[].sections[].items[].title": "Heading above the component.",
	"pages[].sections[].items[].span": "Grid columns this item spans.",
	"pages[].sections[].items[].height": "Height in px.",
	"pages[].sections[].items[].component": "Component kind: table, chart, stat, kv, markdown or facets.",
	"pages[].sections[].items[].table": "The dataset (a name in tables / data).",
	"pages[].sections[].items[].export": "false hides the CSV/JSON export button (default: shown).",
	"pages[].sections[].items[].facets": "Columns shown in a count-per-value sidebar next to the table.",
	"pages[].sections[].items[].text": "Markdown text.",
	"pages[].sections[].items[].fields": "Columns listed in the facets panel.",
	"pages[].sections[].items[].key": "KV card: the key value of the row to show.",
}

const textOf = (node, src) => src.slice(node.start, node.end).replace(/\s+/g, " ").trim()

/** JSDoc text of a member (the last block comment before it), tags dropped. */
function docOf(member) {
	const c = (member.leadingComments ?? []).filter((x) => x.type === "CommentBlock").at(-1)
	if (!c) return ""
	return c.value.split("\n").map((l) => l.replace(/^\s*\*\s?/, "")).filter((l) => !l.startsWith("@")).join(" ").replace(/\s+/g, " ").trim()
}

function defaultOf(doc) {
	const m = /\(default[: ]\s*([^)]+)\)|[Dd]efault:?\s+([^.;)]+)/.exec(doc)
	return m ? (m[1] ?? m[2]).trim() : null
}

function levelOf(path) {
	if (path.startsWith("pages[].sections[].items[]")) return "item"
	if (path.startsWith("pages")) return "page"
	if (path.includes(".columns.<column>.") || path.includes(".computed.<column>.")) return "column"
	if (path.startsWith("tables.<table>.")) return "table"
	return "global"
}

/**
 * Resolve a type node to its shape:
 *   { kind: "object", members: [{ name, node, src, doc }] } | { kind: "array", el } | { kind: "record", value } | { kind: "leaf" }
 * Unions return a list of object-ish parts (primitives, literals, functions dropped).
 */
function resolve(node, src, depth = 0) {
	if (!node || depth > 20) return []
	switch (node.type) {
		case "TSParenthesizedType": return resolve(node.typeAnnotation, src, depth + 1)
		case "TSTypeLiteral":
			return [{ kind: "object", members: node.members.filter((m) => m.type === "TSPropertySignature").map((m) => ({ name: m.key.name ?? m.key.value, node: m.typeAnnotation?.typeAnnotation, src, doc: docOf(m) })) }]
		case "TSUnionType": return node.types.flatMap((t) => resolve(t, src, depth + 1))
		case "TSIntersectionType": {
			const members = node.types.flatMap((t) => resolve(t, src, depth + 1)).filter((p) => p.kind === "object").flatMap((p) => p.members)
			return [{ kind: "object", members }]
		}
		case "TSArrayType": return [{ kind: "array", el: node.elementType, src }]
		case "TSTypeReference": {
			const name = node.typeName.name
			const args = (node.typeArguments ?? node.typeParameters)?.params ?? [] // Babel 8 renamed typeParameters → typeArguments
			if (name === "Array" || name === "ReadonlyArray") return [{ kind: "array", el: args[0], src }]
			if (name === "Record") return [{ kind: "record", value: args[1], src }]
			if (name === "Partial") return resolve(args[0], src, depth + 1)
			if (name === "Omit") {
				const drop = new Set((args[1]?.type === "TSUnionType" ? args[1].types : [args[1]]).map((t) => t?.literal?.value).filter(Boolean))
				return resolve(args[0], src, depth + 1).map((p) => (p.kind === "object" ? { ...p, members: p.members.filter((m) => !drop.has(m.name)) } : p))
			}
			const a = aliases.get(name)
			if (!a) return [] // a function alias, React, Labels, …: a leaf
			// Function aliases (RenderFn, RowFn, Bivariant…) resolve to leaves.
			if (/^(RenderFn|FormatFn|RowFn|Bivariant|Comparator|KeyFn)$/.test(name)) return []
			return resolve(a.node, a.src, depth + 1)
		}
		default: return []
	}
}

const rows = new Map()

function addRow(path, m, kind) {
	const prev = rows.get(path)
	const type = m.node ? textOf(m.node, m.src).replace(/\s*\|\s*undefined\b/g, "") : "unknown"
	if (prev) {
		if (kind) prev.components = [...new Set([...(prev.components ?? []), kind])]
		if (kind && type !== prev.type) prev.typeByComponent = { ...(prev.typeByComponent ?? {}), [kind]: type }
		if (!prev.description && m.doc) Object.assign(prev, { description: m.doc, descriptionSource: "jsdoc" })
		return
	}
	rows.set(path, {
		path,
		type,
		default: defaultOf(m.doc),
		description: m.doc || FALLBACK[path] || "",
		descriptionSource: m.doc ? "jsdoc" : FALLBACK[path] ? "hand-written" : "missing",
		level: levelOf(path),
		...(kind ? { components: [kind] } : {}),
	})
}

function walkParts(parts, prefix, stack) {
	for (const part of parts) {
		if (part.kind !== "object") continue
		const comp = part.members.find((m) => m.name === "component")
		const kind = comp?.node?.type === "TSLiteralType" ? comp.node.literal.value : undefined
		for (const m of part.members) {
			const path = prefix ? `${prefix}.${m.name}` : m.name
			addRow(path, m, kind)
			if (LEAF_RECORDS.has(m.name) || !m.node) continue
			if (m.name === "computed") continue // same keys as columns.<column>; documented there
			if (prefix.startsWith("pages[].sections[].items[]") && NO_DESCEND_IN_ITEMS.has(m.name) && kind === "table") continue
			if (m.name === "compare") continue // same shape as where
			if (prefix.startsWith("pages[].sections[].items[]") && /^(where|measure)$/.test(m.name) && path.includes("aggregates[]")) continue
			descend(m.node, m.src, path, m.name, stack)
		}
	}
}

function descend(node, src, path, name, stack) {
	for (const p of resolve(node, src)) {
		if (p.kind === "array") {
			const key = `${path}[]`
			const sig = `${name}[]`
			if (stack.includes(sig)) continue // sections inside sections: documented once
			walkParts(resolve(p.el, p.src), key, [...stack, sig])
		} else if (p.kind === "record") {
			const parts = resolve(p.value, p.src).filter((x) => x.kind === "object")
			if (!parts.length) continue
			const sub = `${path}.${PLACEHOLDER[name] ?? "<key>"}`
			if (!rows.has(sub)) rows.set(sub, { path: sub, type: textOf(p.value, p.src).replace(/\s*\|\s*undefined\b/g, ""), default: null, description: FALLBACK[sub] ?? "", descriptionSource: FALLBACK[sub] ? "hand-written" : "missing", level: levelOf(sub) })
			walkParts(parts, sub, stack)
		} else if (p.kind === "object") {
			if (stack.includes(name)) continue
			walkParts([p], path, [...stack, name])
		}
	}
}

const rootAlias = aliases.get("JsonDeckConfig")
walkParts(resolve(rootAlias.node, rootAlias.src), "", [])
// A table placed on a page takes the same keys as tables.<table>: reuse those descriptions.
for (const r of rows.values()) {
	if (r.description || !r.path.startsWith("pages[].sections[].items[].")) continue
	const twin = rows.get(`tables.<table>.${r.path.slice("pages[].sections[].items[].".length)}`)
	if (twin?.description) Object.assign(r, { description: `${twin.description} (This placement only.)`, descriptionSource: twin.descriptionSource, default: r.default ?? twin.default })
}
const out = [...rows.values()]
writeFileSync(join(here, "config-reference.json"), `${JSON.stringify(out, null, 2)}\n`)
const missing = out.filter((r) => r.descriptionSource === "missing")
console.log(`config-reference.json: ${out.length} keys (${out.filter((r) => r.descriptionSource === "jsdoc").length} from JSDoc, ${out.filter((r) => r.descriptionSource === "hand-written").length} hand-written, ${missing.length} missing)`)
for (const r of missing) console.log("  missing:", r.path)
