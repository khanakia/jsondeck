// Writes docs/index.html: the jsondeck docs site, built with jsondeck itself.
// Content comes from docs-content/ (owned by the docs writers, read-only here):
//   features.json          → the Features page (and the Overview tiles/chart)
//   config-reference.json  → the Config reference page
//   guides/NN-name.md      → one page per guide, in file order (title = its "# " line)
// The site uses nav: "sidebar" with groups, ⌘K search across pages, heading
// anchors and a sticky "On this page" table of contents on each guide.
// Run: node scripts/make-docs.mjs
import { jsondeckScript } from "./page-script.mjs"
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"

const ROOT = new URL("../", import.meta.url)
const read = (p) => readFileSync(new URL(p, ROOT), "utf8")
const features = JSON.parse(read("docs-content/features.json"))
const configRef = JSON.parse(read("docs-content/config-reference.json"))
const guideFiles = readdirSync(new URL("docs-content/guides/", ROOT)).filter((f) => /^\d+-.+\.md$/.test(f)).sort()

const guides = guideFiles.map((f) => {
	const text = read(`docs-content/guides/${f}`)
	const title = (/^#\s+(.+)$/m.exec(text)?.[1] ?? f).trim()
	return { id: f.replace(/^\d+-/, "").replace(/\.md$/, ""), title, text }
})

/** Height of the demo site's sticky top bar (demo/nav.js), so sticky parts sit under it. */
const SITE_BAR_PX = 48

const data = {
	features: features.map((f) => ({
		name: f.name,
		category: f.category,
		summary: f.summary,
		config: f.config ?? "",
		example: f.example ?? "",
		status: f.status,
		since: f.since ?? "",
		checkReason: f.checkReason ?? "",
		id: f.id,
	})),
	config: configRef.map((c) => ({
		path: c.path,
		level: c.level,
		type: c.type,
		default: c.default ?? "",
		description: c.description,
	})),
}

const count = (rows, key) => rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] ?? 0) + 1), m), {})
const statusCount = count(features, "status")

const OVERVIEW = `# jsondeck docs

jsondeck turns JSON plus a small config into a compact dashboard: tables with search, filters, sort, paging and saved views; charts and stat tiles from the same data; links between tables. One \`<script>\` tag, no build step, works from \`file://\`.

:::tip This site is a jsondeck deck
Every page here is jsondeck itself: the sidebar is \`nav: "sidebar"\` with page groups, the search box (⌘K) is \`search: true\`, and the Features and Config reference pages are ordinary jsondeck tables over JSON files.
:::

## Where to start

- [Getting started](#/getting-started): the smallest page, the CDN tags and \`JsonDeck.mount\`.
- [Columns and types](#/columns-and-types): what is guessed and how to override it.
- [Features](#/features): every feature with its config key and an example.
- [Config reference](#/config): every key, its type and default.`

const guidePages = guides.map((g) => ({
	id: g.id,
	title: g.title,
	group: "Guides",
	sections: [{ columns: [4, 1], items: [
		{ id: `${g.id}-md`, component: "markdown", text: g.text },
		{ id: `${g.id}-toc`, component: "toc" },
	] }],
}))

const config = {
	data: "#docs-data",
	nav: "sidebar",
	search: true,
	editable: false,
	themeToggle: false,
	statusColors: { stable: "green", check: "amber" },
	tables: {
		features: {
			key: "id",
			columns: {
				name: { label: "Feature", wrap: true, width: 180 },
				summary: { wrap: true, width: 340 },
				config: { type: "mono", wrap: true, width: 180 },
				example: { label: "Example", link: "../demo/examples.html#{example}", width: 140 },
				status: { type: "badge", width: 90 },
				since: { width: 70 },
				checkReason: { hidden: true, label: "Check note" },
				id: { hidden: true },
				// Shown as the group rows instead of a column.
				category: { type: "badge", hidden: true },
			},
		},
		config: {
			key: "path",
			columns: {
				path: { type: "mono", pin: "left", width: 260, wrap: true },
				level: { type: "badge", width: 80 },
				type: { type: "mono", wrap: true, width: 240 },
				default: { width: 140, wrap: true },
				description: { wrap: true, width: 420 },
			},
		},
	},
	pages: [
		{
			id: "overview",
			title: "Overview",
			group: "Start",
			sections: [
				{ columns: [4, 1], items: [{ id: "ov-md", component: "markdown", text: OVERVIEW }, { id: "ov-toc", component: "toc" }] },
				{ title: "At a glance", columns: 3, items: [
					{ id: "ov-f", component: "stat", table: "features", label: "Features" },
					{ id: "ov-s", component: "stat", table: "features", label: "Stable", where: { status: "stable" } },
					{ id: "ov-c", component: "stat", table: "config", label: "Config keys" },
				] },
				{ columns: [2, 1], items: [
					{ id: "ov-cat", component: "chart", table: "features", type: "bar", groupBy: "category", horizontal: true, title: "Features by category", targets: [] },
					{ id: "ov-lvl", component: "chart", table: "config", type: "donut", groupBy: "level", title: "Config keys by level", targets: [] },
				] },
			],
		},
		...guidePages,
		{
			id: "features",
			title: "Features",
			group: "Reference",
			sections: [{ items: [{
				id: "features-table",
				component: "table",
				table: "features",
				groupBy: "category",
				pageSize: 200,
				detail: { fields: ["checkReason", "id"], columns: 2 },
				quickFilters: [{ column: "status", kind: "chips" }, { column: "category", kind: "chips" }],
			}] }],
		},
		{
			id: "config",
			title: "Config reference",
			group: "Reference",
			sections: [{ items: [{
				id: "config-table",
				component: "table",
				table: "config",
				pageSize: 50,
				quickFilters: [{ column: "level", kind: "chips" }],
			}] }],
		},
	],
}

// JSON inside <script>: never let a "</script>" in the content end the tag.
const json = (v) => JSON.stringify(v).replace(/</g, "\\u003c")

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>jsondeck docs</title>
<link rel="stylesheet" href="../dist/jsondeck.css">
<style>
  /* Site theme: html[data-theme] (set by nav.js / JsonDeck.setTheme) wins; else the OS. */
  :root { --page-bg: #f4f4f5; --page-ink: #09090b; color-scheme: light; }
  :root[data-theme="dark"], :root.dark { --page-bg: #09090b; --page-ink: #fafafa; color-scheme: dark; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme]) { --page-bg: #09090b; --page-ink: #fafafa; color-scheme: dark; } }
  body { margin: 0; font-family: system-ui, sans-serif; background: var(--page-bg); color: var(--page-ink); }
  main { max-width: 1320px; margin: 0 auto; padding: 0 8px 48px; }
  /* Sticky sidebar and table of contents sit under the site's own sticky bar. */
  #docs .jd-root { --jds-sticky-top: ${SITE_BAR_PX}px; }
</style>
</head>
<body>
<script src="../demo/nav.js"></script>
<main>
<div id="docs"></div>
</main>
<script type="application/json" id="docs-data">${json(data)}</script>
${jsondeckScript("../")}
<script>
  // Generated from docs-content/ by scripts/make-docs.mjs (${features.length} features, ${configRef.length} config keys, ${guides.length} guides; ${statusCount.stable ?? 0} stable).
  JsonDeck.mount('#docs', ${json(config)})
</script>
</body>
</html>
`
mkdirSync(new URL("docs/", ROOT), { recursive: true })
writeFileSync(new URL("docs/index.html", ROOT), html)
console.log(`docs/index.html: ${guides.length} guides, ${features.length} features, ${configRef.length} config keys`)
