// CDN-style smoke check: blank pages that load jsondeck the three ways the README
// documents, each mounting zero-config data, then asserting a table rendered AND
// is styled (computed styles on a cell, not just the DOM being there).
//   1. one tag: only dist/jsondeck.full.js, no stylesheet -> exactly one injected <style data-jsondeck>
//   2. pair:    dist/jsondeck.css + dist/jsondeck.js       -> no injected style
//   3. one tag + linked css                                -> injection skipped (no double CSS)
//   4. ESM:     import { mount } from dist/jsondeck.mjs, React from a local ESM build
//      through an import map (http only: browsers refuse module scripts from file://)
// Then the split build (dist/jsondeck.js + dist/chunks/), over http. Its chunks hold only
// our code; React and every other library come from the CDN (ga.jspm.io) through the
// loader's import map, so these cases need network access (checked first, and named as
// the cause when it is missing):
//   5. first load of a plain zero-config table: every request listed with host and gzip
//      size; our own bytes stay under OWN_BUDGET_KB; React, React DOM and the scheduler
//      come from the CDN at the pinned versions; no chunk or library it does not need is
//      requested (charts, calendar, editor, highlighter, popups and Base UI, validator
//      messages, saved views, resize / reorder, keyboard shortcuts, sidebar, API extras)
//  14. one React: every React file is requested once from one URL, a module importing
//      "react" gets the very module object at the pinned CDN URL, and a Base UI menu
//      (hooks, loaded from the CDN) opens with no hook errors
//  15. opening a menu is what fetches Base UI from the CDN
//  16. a page with its own import map for React keeps its React: no React file is
//      fetched from the CDN, and the table and a Base UI menu work with the page's copy
//   6. mount called before the library has loaded: handle, issues, ready, describe after
//      `JsonDeck.ready`
//   7. the dashboard demo: the chart chunk loads on demand and the charts render
//   8. opening a date filter loads the calendar chunk, and only then fetches
//      react-day-picker and date-fns from the CDN, and shows the calendar
//  10. a bad config: the issues box shows the sentence with its "did you mean", and
//      handle.issues + the console warning fill in by handle.ready
//  11. a stored default saved view: the very first rows painted are already the view's
//  12. "/" focuses search on the first press, before the shortcut chunk has loaded
//  13. column resize and drag-reorder work on first use
// and from file://: 9. the split loader shows a clear message pointing at jsondeck.full.js;
//  17. jsondeck.full.js works with every network request blocked
//   node scripts/verify-cdn.mjs <base-url-ending-in-/> [shots-prefix]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { createRequire } from "node:module"
import { chromium } from "playwright"
import { build } from "vite"

const [base, prefix = "shots/cdn"] = process.argv.slice(2)
if (!base) throw new Error("usage: node scripts/verify-cdn.mjs <base-url/> [shots-prefix]")
const IIFE = process.env.JSONDECK_IIFE ?? "jsondeck.js"
const FULL = process.env.JSONDECK_FULL ?? "jsondeck.full.js"
const ROOT = new URL("../", import.meta.url)
const PAGES = new URL("shots/cdn-pages/", ROOT)
const REACT_ESM = new URL("shots/cdn-react/", ROOT)
mkdirSync(PAGES, { recursive: true })

const DATA = { hosts: [
	{ ip: "10.0.0.1", name: "web-1", status: "up", cpu: 12 },
	{ ip: "10.0.0.2", name: "web-2", status: "down", cpu: 87 },
	{ ip: "10.0.0.3", name: "db-1", status: "up", cpu: 45 },
] }
const dataTag = `<script type="application/json" id="data">${JSON.stringify(DATA)}</script>`
const page = (head, body) => `<!doctype html><html><head><meta charset="utf-8"><title>cdn check</title>${head}</head><body>${dataTag}<div id="app"></div>${body}</body></html>`
const mountTag = `<script>window.__mounted = !!JsonDeck.mount('#app', { data: '#data' })</script>`

const cases = [
	{ name: "one-tag", file: "one-tag.html", html: page("", `<script src="../../dist/${FULL}"></script>${mountTag}`), injected: 1 },
	{ name: "one-tag+css", file: "one-tag-css.html", html: page(`<link rel="stylesheet" href="../../dist/jsondeck.css">`, `<script src="../../dist/${FULL}"></script>${mountTag}`), injected: 0 },
]
// 17: from file://, the single file must not need the network at all.
if (!base.startsWith("http")) cases.push({ name: "one-tag offline", file: "one-tag-offline.html", html: page("", `<script src="../../dist/${FULL}"></script>${mountTag}`), injected: 1, offline: true })

if (base.startsWith("http")) {
	// The split loader needs http(s): from file:// it shows a message instead (case 9 below).
	cases.splice(1, 0, { name: "css+js", file: "pair.html", html: page(`<link rel="stylesheet" href="../../dist/jsondeck.css">`, `<script src="../../dist/${IIFE}"></script>${mountTag}`), injected: 0, links: 1 })
	// The split loader alone: it links jsondeck.css itself.
	cases.splice(2, 0, { name: "split one-tag", file: "split-one-tag.html", html: page("", `<script src="../../dist/${IIFE}"></script>${mountTag}`), injected: 0, links: 1 })
	// React 19 ships no browser ESM files, so build a tiny local copy (react,
	// react/jsx-runtime, react-dom, react-dom/client sharing one chunk) once,
	// the same shape an esm.sh-style CDN serves.
	if (!existsSync(new URL("react.js", REACT_ESM))) {
		const srcDir = new URL("shots/cdn-react-src/", ROOT)
		mkdirSync(srcDir, { recursive: true })
		// CommonJS React has no static export list, so name every export explicitly
		// (read from the real modules) the way esm.sh does.
		const req = createRequire(import.meta.url)
		const reexport = (mod) => { const names = Object.keys(req(mod)).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n) && n !== "default"); return `import M from '${mod}'\nexport default M\nexport const { ${names.join(", ")} } = M` }
		const entries = { "react": reexport("react"), "jsx-runtime": reexport("react/jsx-runtime"), "react-dom": reexport("react-dom"), "react-dom-client": reexport("react-dom/client") }
		const input = {}
		for (const [k, v] of Object.entries(entries)) { writeFileSync(new URL(`${k}.js`, srcDir), `${v}\n`); input[k] = new URL(`${k}.js`, srcDir).pathname }
		await build({ configFile: false, logLevel: "warn", root: ROOT.pathname, define: { "process.env.NODE_ENV": '"production"' }, build: { outDir: REACT_ESM.pathname, emptyOutDir: true, minify: true, rollupOptions: { input, preserveEntrySignatures: "strict", output: { format: "es", entryFileNames: "[name].js", chunkFileNames: "[name].js" } } } })
	}
	const map = { imports: { "react": "../cdn-react/react.js", "react/jsx-runtime": "../cdn-react/jsx-runtime.js", "react-dom": "../cdn-react/react-dom.js", "react-dom/client": "../cdn-react/react-dom-client.js" } }
	cases.push({ name: "esm", file: "esm.html", injected: 0, html: page(`<script type="importmap">${JSON.stringify(map)}</script><link rel="stylesheet" href="../../dist/jsondeck.css">`, `<script type="module">import { mount } from '../../dist/jsondeck.mjs'; window.__mounted = !!mount('#app', { data: '#data' })</script>`) })
} else {
	console.log("  -  css+js and esm: not run on file:// (browsers block module loading from file://); they run in the http pass, and case 9 checks the loader's message")
}

const browser = await chromium.launch({ headless: true })
let failed = 0
const ok = (label, cond, extra = "") => { console.log(`  ${cond ? "ok" : "FAIL"}  ${label}${extra ? ` (${extra})` : ""}`); if (!cond) failed++ }
for (const c of cases) {
	writeFileSync(new URL(c.file, PAGES), c.html)
	const p = await browser.newPage()
	const errors = []
	p.on("pageerror", (e) => errors.push(String(e)))
	p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
	const blocked = []
	if (c.offline) await p.route(/^https?:/, (route) => { blocked.push(route.request().url()); return route.abort() })
	await p.goto(`${base}shots/cdn-pages/${c.file}`)
	await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 10000 }).catch(() => undefined)
	const r = await p.evaluate(() => {
		const td = document.querySelector('[data-jd="table"] tbody td')
		const cs = td ? getComputedStyle(td) : null
		const root = document.querySelector(".jd-root")
		return {
			mounted: window.__mounted === true,
			rows: document.querySelectorAll('[data-jd="table"] tbody tr').length,
			fontSize: cs?.fontSize ?? "",
			padTop: cs?.paddingTop ?? "",
			rootFont: root ? getComputedStyle(root).fontFamily : "",
			injected: document.querySelectorAll("style[data-jsondeck]").length,
			links: [...document.querySelectorAll('link[rel~="stylesheet"]')].filter((l) => /jsondeck\.css/.test(l.getAttribute("href") ?? "")).length,
		}
	})
	console.log(`== ${c.name}`)
	ok("mount returned", r.mounted)
	ok("table rendered with 3 rows", r.rows === 3, `rows=${r.rows}`)
	// Browser default for a td is 16px text and 1px padding; our compact cell is 13px.
	ok("cell is styled (13px text)", r.fontSize === "13px", `font-size=${r.fontSize} padding-top=${r.padTop}`)
	ok(`injected <style data-jsondeck> count is ${c.injected}`, r.injected === c.injected, `found ${r.injected}`)
	if (c.links !== undefined) ok(`exactly ${c.links} jsondeck.css link`, r.links === c.links, `found ${r.links}`)
	if (c.offline) ok("no network request at all (every http(s) request is blocked)", blocked.length === 0, blocked.slice(0, 3).join(", "))
	ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
	await p.screenshot({ path: `${prefix}-${c.name}.png` })
	await p.close()
}
// ── The split build ──────────────────────────────────────────────────────────
/**
 * Most of OUR OWN JavaScript (served from this server: loader + entry + core +
 * runtime) a plain zero-config table page may download, gzip level 9. React and
 * the other libraries come from the CDN and are listed separately. Measured at
 * OWN_MEASURED_KB when this was set; the 3 kB margin only absorbs small changes,
 * a real regression (a library bundled back in, a part folded into the core)
 * fails here.
 */
const OWN_MEASURED_KB = 40.1
const OWN_BUDGET_KB = OWN_MEASURED_KB + 3
/** Our chunks a plain valid table must not fetch before anyone interacts with it (named after what is in them). */
const NOT_ON_FIRST_LOAD = [/chart/i, /date/i, /edit/i, /codeview|markdown/i, /popups/i, /explain|issues/i, /views/i, /drag/i, /shortcuts/i, /sidebar/i, /extras/i, /toast/i, /pinning/i]
/** CDN packages a plain table must not fetch before interaction (they belong to menus and the calendar). */
const NOT_FROM_CDN_ON_FIRST_LOAD = /npm[:/](@base-ui|@floating-ui|react-day-picker|date-fns|@date-fns|reselect|use-sync-external-store)/
const kb = (n) => `${(n / 1024).toFixed(1)} kB`
const MAP_SRC = readFileSync(new URL("src/externals/map.gen.ts", ROOT), "utf8")
const VERSIONS = Object.fromEntries([...MAP_SRC.slice(MAP_SRC.indexOf("EXTERNAL_VERSIONS")).matchAll(/^\t"([^"]+)": "([^"]+)"/gm)].map((m) => [m[1], m[2]]))
const REACT_URL = /^\t"react": "([^"]+)"/m.exec(MAP_SRC)?.[1] ?? ""
const isScript = (u) => /\.m?js(\?|$)|\/\+esm$/.test(u)
const own = (u) => u.startsWith(base)
const hostOf = (u) => new URL(u).host
const fileOf = (u) => (own(u) ? u.slice(base.length) : u.replace(/^https?:\/\/[^/]+\//, ""))
/**
 * Every script the page requests (classic scripts, module imports, modulepreloads),
 * with its host and gzip -9 size of the body actually received (the test server and
 * the CDN bodies are measured the same way). `entries` fills in as responses arrive;
 * `settle()` waits for the bodies already requested.
 */
const netLog = (p) => {
	const entries = []
	const pending = []
	p.on("response", (r) => {
		const url = r.url()
		if (!isScript(url)) return
		pending.push(r.body().then((b) => { entries.push({ url, host: hostOf(url), file: fileOf(url), gz: gzipSync(b, { level: 9 }).length }) }, () => { entries.push({ url, host: hostOf(url), file: fileOf(url), gz: 0 }) }))
	})
	return { entries, settle: () => Promise.all(pending), urls: () => entries.map((e) => e.url) }
}
/** Just the script URLs a page requests, in order. */
const scriptLog = (p) => {
	const urls = []
	p.on("request", (r) => { if (isScript(r.url())) urls.push(r.url()) })
	return urls
}
const sum = (list) => list.reduce((a, e) => a + e.gz, 0)
const listing = (list) => list.map((e) => `    ${e.host.padEnd(16)} ${e.file.padEnd(72)} ${kb(e.gz).padStart(8)}`).join("\n")
const settled = (p) => p.waitForFunction(() => !document.querySelector('[data-jd="pending"]') && !!document.querySelector('[data-jd="root"]'), null, { timeout: 15000 }).catch(() => undefined)
const HOSTS = Array.from({ length: 40 }, (_, i) => ({ ip: `10.0.${i >> 4}.${i & 15}`, name: `web-${i + 1}`, status: i % 7 === 0 ? "down" : "up", cpu: (i * 37) % 100, seen: `2026-0${1 + (i % 9)}-${String(10 + (i % 18)).padStart(2, "0")}` }))
const splitPage = (body) => `<!doctype html><html><head><meta charset="utf-8"><title>split check</title><link rel="stylesheet" href="../../dist/jsondeck.css"></head><body><script type="application/json" id="data">${JSON.stringify({ hosts: HOSTS })}</script><div id="app"></div><script src="../../dist/jsondeck.js"></script><script>${body}</script></body></html>`

if (base.startsWith("http")) {
	// The split build needs the CDN. Say plainly when the network is the cause.
	const reach = await fetch(REACT_URL, { signal: AbortSignal.timeout(15000) }).then((r) => (r.ok ? "" : `HTTP ${r.status}`), (e) => String(e?.cause?.code ?? e?.message ?? e))
	if (reach) {
		console.log(`== split build: NETWORK PROBLEM, not a jsondeck failure: cannot reach the CDN (${REACT_URL}: ${reach}).`)
		console.log("   The <script> build loads React and the other libraries from ga.jspm.io (and one from cdn.jsdelivr.net); run these checks with internet access.")
		failed++
	}
	// 5: plain table, as a page that only mounts.
	writeFileSync(new URL("split-table.html", PAGES), splitPage(`
	  window.__h = JsonDeck.mount('#app', { data: '#data' })
	  window.__h.ready.then(() => { window.__issues = window.__h.issues.length })`))
	// 6: mount before the core has loaded, then the rest of the API after JsonDeck.ready.
	writeFileSync(new URL("split-api.html", PAGES), splitPage(`
	  window.__h = JsonDeck.mount('#app', { data: '#data' })
	  try { JsonDeck.describe({}); window.__early = 'no error' } catch (e) { window.__early = e.message }
	  JsonDeck.ready.then(() => { window.__desc = JsonDeck.describe('#data'); window.__tokens = Object.keys(JsonDeck.THEME_TOKENS).length })`))
	{
		const p = await browser.newPage()
		const errors = []
		p.on("pageerror", (e) => errors.push(String(e)))
		p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
		const net = netLog(p)
		await p.goto(`${base}shots/cdn-pages/split-table.html`)
		await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 20000 }).catch(() => undefined)
		await settled(p)
		await p.waitForLoadState("networkidle")
		await net.settle()
		const mine = net.entries.filter((e) => own(e.url))
		const cdn = net.entries.filter((e) => !own(e.url))
		console.log("== split: plain table, first load")
		console.log(`  our files (${kb(sum(mine))} gzip):\n${listing(mine)}`)
		console.log(`  CDN files (${kb(sum(cdn))} gzip):\n${listing(cdn)}`)
		console.log(`  total ${kb(sum(net.entries))} gzip in ${net.entries.length} files`)
		writeFileSync(`${prefix}-split-table-requests.json`, JSON.stringify(net.entries, null, 1))
		ok(`our own first-load JS is ${kb(sum(mine))} gzip, under ${OWN_BUDGET_KB.toFixed(1)} kB`, sum(mine) <= OWN_BUDGET_KB * 1024)
		const pinned = (name) => cdn.some((e) => e.url.includes(`npm:${name}@${VERSIONS[name]}/`))
		ok(`React ${VERSIONS.react}, React DOM ${VERSIONS["react-dom"]} and scheduler ${VERSIONS.scheduler} come from the CDN at those versions`, pinned("react") && pinned("react-dom") && pinned("scheduler") && cdn.every((e) => e.host === "ga.jspm.io"), cdn.map((e) => e.file).join(", ").slice(0, 200))
		ok("no React code in our own files", mine.every((e) => !/react\.transitional\.element|__CLIENT_INTERNALS_DO_NOT_USE/.test(readFileSync(new URL(e.file, ROOT), "utf8"))))
		const early = mine.map((e) => e.file).filter((n) => NOT_ON_FIRST_LOAD.some((re) => re.test(n.slice(n.lastIndexOf("/") + 1))))
		ok("no chunk the plain table does not need (charts, calendar, editor, highlighter, popups, validator, views, resize, keyboard, sidebar, extras)", early.length === 0, early.join(", "))
		const earlyCdn = cdn.filter((e) => NOT_FROM_CDN_ON_FIRST_LOAD.test(e.url)).map((e) => e.file)
		ok("no Base UI, floating-ui or calendar library fetched before interaction", earlyCdn.length === 0, earlyCdn.slice(0, 3).join(", "))
		const r = await p.evaluate(() => ({ rows: document.querySelectorAll('[data-jd="table"] tbody tr').length, issues: window.__issues }))
		ok("table rendered (mount was queued); handle.ready resolved with no issues", r.rows > 0 && r.issues === 0, `rows=${r.rows} issues=${r.issues}`)
		ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
		await p.screenshot({ path: `${prefix}-split-table.png` })
		await p.close()
	}
	{
		const p = await browser.newPage()
		const errors = []
		p.on("pageerror", (e) => errors.push(String(e)))
		await p.goto(`${base}shots/cdn-pages/split-api.html`)
		await p.waitForFunction(() => window.__desc !== undefined, null, { timeout: 10000 }).catch(() => undefined)
		const r = await p.evaluate(() => ({ rows: document.querySelectorAll('[data-jd="table"] tbody tr').length, early: window.__early, tables: Object.keys(window.__desc?.tables ?? {}), tokens: window.__tokens }))
		console.log("== split: mount before the library loaded, API after JsonDeck.ready")
		ok("table rendered (mount was queued)", r.rows > 0, `rows=${r.rows}`)
		ok("describe() before load throws a clear 'still loading' error", /still loading/.test(r.early ?? ""), r.early)
		ok("after JsonDeck.ready: describe() and THEME_TOKENS work", r.tables.includes("hosts") && r.tokens > 40, `${r.tables.join(",")} tokens=${r.tokens}`)
		ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
		await p.close()
	}
	// 14 + 15: one React; opening a menu is what fetches Base UI (hooks, from the CDN).
	{
		const p = await browser.newPage()
		const errors = []
		p.on("pageerror", (e) => errors.push(String(e)))
		p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
		const urls = scriptLog(p)
		await p.goto(`${base}shots/cdn-pages/split-table.html`)
		await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 20000 }).catch(() => undefined)
		await settled(p)
		await p.waitForLoadState("networkidle")
		const BASE_UI = /npm:@base-ui\/react@/
		const before = urls.filter((u) => BASE_UI.test(u) || /popups/.test(u)).length
		await p.locator('button[aria-label^="Columns"]').first().click()
		await p.locator('[role="menu"] [role^="menuitem"]').first().waitFor({ timeout: 15000 }).catch(() => undefined)
		const items = await p.locator('[role="menu"] [role^="menuitem"]').count()
		// A module script resolves "react" through the same import map as our chunks and the
		// CDN files: it must get the very module object at the pinned URL (one instance).
		await p.addScriptTag({ type: "module", content: `
			import * as viaMap from "react"
			import * as pinned from ${JSON.stringify(REACT_URL)}
			import * as client from "react-dom/client"
			import { Menu } from "@base-ui/react/menu"
			window.__same = viaMap === pinned && typeof viaMap.useState === "function"
			window.__menuLib = typeof Menu === "object" && Menu !== null && "Root" in Menu
			window.__client = typeof client.createRoot === "function"` })
		await p.waitForFunction(() => window.__same !== undefined, null, { timeout: 10000 }).catch(() => undefined)
		const r = await p.evaluate(() => ({ same: window.__same, menuLib: window.__menuLib }))
		const reactFiles = urls.filter((u) => /npm[:/](react|react-dom|scheduler)@/.test(u))
		const dupes = reactFiles.filter((u, i) => reactFiles.indexOf(u) !== i)
		const versions = new Set(reactFiles.map((u) => /npm[:/](react|react-dom|scheduler)@([^/]+)/.exec(u)?.slice(1).join("@")))
		const baseUi = urls.filter((u) => BASE_UI.test(u))
		console.log("== split: one React, Base UI on demand")
		ok("Base UI and the popups chunk not fetched before interaction", before === 0, `before=${before}`)
		ok(`clicking Columns fetches Base UI ${VERSIONS["@base-ui/react"]} from the CDN, and its menu (hooks) opens`, items > 0 && baseUi.length > 0 && baseUi.every((u) => u.includes(`@base-ui/react@${VERSIONS["@base-ui/react"]}/`)), `${items} items, ${baseUi.length} Base UI files`)
		ok("every React file requested once, one version each", dupes.length === 0 && versions.size === 3, `${[...versions].join(", ")}${dupes.length ? ` dupes: ${dupes.join(", ")}` : ""}`)
		ok('"react" through the import map is the same module as the pinned CDN file (one React instance)', r.same === true && r.menuLib === true, JSON.stringify(r))
		ok("no hook errors or other page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
		await p.screenshot({ path: `${prefix}-split-menu.png` })
		await p.close()
	}
	// 16: the page brings its own React through its own import map; jsondeck must use it.
	{
		const pageMap = { imports: { "react": "../cdn-react/react.js", "react/jsx-runtime": "../cdn-react/jsx-runtime.js", "react-dom": "../cdn-react/react-dom.js", "react-dom/client": "../cdn-react/react-dom-client.js" } }
		writeFileSync(new URL("split-own-react.html", PAGES), splitPage(`window.__h = JsonDeck.mount('#app', { data: '#data' })`).replace("<head>", `<head><script type="importmap">${JSON.stringify(pageMap)}</script>`))
		const p = await browser.newPage()
		const errors = []
		p.on("pageerror", (e) => errors.push(String(e)))
		p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
		const urls = scriptLog(p)
		await p.goto(`${base}shots/cdn-pages/split-own-react.html`)
		await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 20000 }).catch(() => undefined)
		await settled(p)
		await p.locator('button[aria-label^="Columns"]').first().click()
		await p.locator('[role="menu"] [role^="menuitem"]').first().waitFor({ timeout: 15000 }).catch(() => undefined)
		const items = await p.locator('[role="menu"] [role^="menuitem"]').count()
		await p.waitForLoadState("networkidle")
		const ours = await p.evaluate(() => JSON.parse(document.querySelector('script[type="importmap"][data-jsondeck]')?.textContent ?? "{}").imports ?? {})
		const cdnReact = urls.filter((u) => /npm[:/](react|react-dom|scheduler)@/.test(u))
		const pageReact = urls.filter((u) => /cdn-react\//.test(u))
		console.log("== split: page with its own React import map")
		ok("no React, React DOM or scheduler file fetched from the CDN", cdnReact.length === 0, cdnReact.join(", "))
		ok("the page's own React files are used", pageReact.length > 0, pageReact.map((u) => u.slice(u.lastIndexOf("/") + 1)).join(", "))
		ok("jsondeck's import map leaves out the specifiers the page maps", !("react" in ours) && !("react-dom/client" in ours) && "@base-ui/react/menu" in ours, Object.keys(ours).filter((k) => /^react/.test(k)).join(","))
		ok("table renders and a Base UI menu opens with the page's React", (await p.locator('[data-jd="table"] tbody tr').count()) > 0 && items > 0, `${items} items`)
		ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
		await p.close()
	}
	// 10: a bad config still shows the issues box (its sentences are an on-demand chunk).
	writeFileSync(new URL("split-bad.html", PAGES), splitPage(`
	  window.__warn = []
	  const w = console.warn; console.warn = (...a) => { window.__warn.push(a.join(' ')); w(...a) }
	  window.__h = JsonDeck.mount('#app', { data: '#data', tables: { hosts: { pageSze: 10, columns: { cpuu: 'number' } } } })
	  window.__now = window.__h.issues.length
	  window.__h.ready.then(() => { window.__issues = window.__h.issues.slice() })`))
	{
		const p = await browser.newPage()
		await p.goto(`${base}shots/cdn-pages/split-bad.html`)
		await p.waitForFunction(() => window.__issues !== undefined, null, { timeout: 10000 }).catch(() => undefined)
		await p.locator('[data-jd="issues"]').waitFor({ timeout: 10000 }).catch(() => undefined)
		const r = await p.evaluate(() => ({ box: document.querySelector('[data-jd="issues"]')?.textContent ?? "", issues: window.__issues ?? [], warn: window.__warn ?? [], rows: document.querySelectorAll('[data-jd="table"] tbody tr').length }))
		console.log("== split: bad config")
		ok("issues box shows both problems with their suggestions", /2 config issue/.test(r.box) && /did you mean pageSize/.test(r.box) && /no such column \(did you mean cpu\?\)/.test(r.box), r.box.slice(0, 160))
		ok("handle.issues filled by handle.ready", r.issues.length === 2 && r.issues.some((i) => i === "tables.hosts.pageSze: unknown key (did you mean pageSize?)"), r.issues.join(" | "))
		ok("console warning printed once", r.warn.filter((w) => w.includes("config issue")).length === 1, r.warn.join(" | ").slice(0, 160))
		ok("the valid rest still renders", r.rows > 0, `rows=${r.rows}`)
		await p.close()
	}
	// 11: a stored default view: the first rows ever painted are the view's (no flash of the unfiltered table).
	const VIEW = [{ id: "v_test", name: "Web 1x", isDefault: true, state: { search: "web-1", filters: [], sort: [] }, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }]
	writeFileSync(new URL("split-view.html", PAGES), splitPage(`window.__h = JsonDeck.mount('#app', { data: '#data' })`).replace("<body>", `<body><script>
	  localStorage.setItem('dt:views:jsondeck:hosts', ${JSON.stringify(JSON.stringify(VIEW))})
	  window.__first = null
	  new MutationObserver((_, obs) => { const n = document.querySelectorAll('[data-jd="table"] tbody tr').length; if (n > 0 && window.__first === null) { window.__first = n; obs.disconnect() } }).observe(document.documentElement, { childList: true, subtree: true })
	</script>`))
	{
		const p = await browser.newPage()
		await p.goto(`${base}shots/cdn-pages/split-view.html`)
		await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 10000 }).catch(() => undefined)
		await settled(p)
		const r = await p.evaluate(() => ({ first: window.__first, rows: document.querySelectorAll('[data-jd="table"] tbody tr').length, search: document.querySelector('[data-jd="search"]')?.value ?? null, count: document.querySelector('[data-jd="count"]')?.textContent ?? "", views: document.querySelector('[data-jd-views-trigger]')?.textContent ?? "" }))
		console.log("== split: stored default view")
		ok("the first rows painted are the view's 11 (no flash of all 40)", r.first === 11 && r.rows === 11, `first=${r.first} now=${r.rows} count="${r.count}"`)
		ok("the view's search is in the box and the Views button names it", r.search === "web-1" && r.views.includes("Web 1x"), `search=${r.search} views="${r.views}"`)
		await p.evaluate(() => localStorage.clear())
		await p.close()
	}
	// 12 + 13: "/" on the first press; resize and reorder on first use (their chunks load on demand).
	{
		const p = await browser.newPage({ viewport: { width: 1200, height: 800 } })
		const urls = scriptLog(p)
		await p.goto(`${base}shots/cdn-pages/split-table.html`)
		await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 10000 }).catch(() => undefined)
		await settled(p)
		await p.waitForLoadState("networkidle")
		const keysBefore = urls.filter((u) => /shortcuts/.test(u)).length
		// Nothing clicked yet (a click in the table would fetch the shortcut chunk): the very first key.
		await p.keyboard.press("/")
		const focused = await p.evaluate(() => document.activeElement?.getAttribute("data-jd"))
		console.log("== split: first use")
		ok('"/" focuses search on the first press', keysBefore === 0 && focused === "search", `focused=${focused} shortcut chunk before=${keysBefore}`)
		await p.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur())
		const ids = () => p.$$eval('[data-jd="thead"] th[data-col-id]', (ths) => ths.map((t) => t.getAttribute("data-col-id")))
		const before = await ids()
		const first = before[0] ?? ""
		const th = p.locator(`[data-jd="thead"] th[data-col-id="${first}"]`)
		const w0 = (await th.boundingBox())?.width ?? 0
		const handle = th.locator('button[aria-label="Resize column"]')
		const hb = await handle.boundingBox()
		if (hb) {
			await p.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
			await p.mouse.down()
			await p.mouse.move(hb.x + 80, hb.y + hb.height / 2, { steps: 6 })
			await p.mouse.up()
		}
		await p.waitForTimeout(200)
		const w1 = (await th.boundingBox())?.width ?? 0
		ok("resize works on first use (+80px drag widens the column)", w1 - w0 > 60, `${Math.round(w0)} -> ${Math.round(w1)}px`)
		await p.locator(`[data-jd-sort="${first}"]`).dragTo(p.locator(`[data-jd="thead"] th[data-col-id="${before[2]}"]`))
		await p.waitForTimeout(300)
		const after = await ids()
		ok("drag-reorder works on first use", after.indexOf(first) === 2, `${before.join(",")} -> ${after.join(",")}`)
		const loaded = urls.map((u) => u.slice(u.lastIndexOf("/") + 1))
		ok("the shortcut and resize chunks loaded on use", loaded.some((n) => /shortcuts/.test(n)) && loaded.some((n) => /drag/.test(n)), loaded.filter((n) => /shortcuts|drag/.test(n)).join(","))
		await p.close()
	}
	// 7: the dashboard demo loads the chart chunk on demand and renders the charts.
	{
		const p = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
		const net = netLog(p)
		await p.goto(`${base}demo/index.html#/overview`)
		await settled(p)
		await p.waitForLoadState("networkidle")
		await net.settle()
		const names = net.entries.map((e) => e.file.slice(e.file.lastIndexOf("/") + 1))
		const mine = net.entries.filter((e) => own(e.url))
		const cdn = net.entries.filter((e) => !own(e.url))
		const charts = await p.locator('[data-jd-kind="chart"]').count()
		const drawn = await p.locator('[data-jd-kind="chart"] svg').count()
		console.log("== split: dashboard")
		console.log(`  our files (${kb(sum(mine))} gzip):\n${listing(mine)}`)
		console.log(`  CDN files (${kb(sum(cdn))} gzip):\n${listing(cdn)}`)
		console.log(`  total ${kb(sum(net.entries))} gzip in ${net.entries.length} files`)
		writeFileSync(`${prefix}-dashboard-requests.json`, JSON.stringify(net.entries, null, 1))
		ok("chart chunk requested", names.some((n) => /chart/i.test(n)), names.join(","))
		ok("every chart on the page rendered its SVG", charts > 0 && drawn >= charts, `${drawn} svg in ${charts} charts`)
		await p.close()
	}
	// 8: opening a date filter loads the calendar chunk.
	{
		const p = await browser.newPage()
		const urls = scriptLog(p)
		await p.goto(`${base}shots/cdn-pages/split-table.html`)
		await settled(p)
		const CAL_LIBS = /npm[:/](react-day-picker|date-fns|@date-fns)/
		const ownDate = () => urls.filter((u) => own(u) && /date/i.test(u.slice(u.lastIndexOf("/") + 1)))
		const libs = () => urls.filter((u) => CAL_LIBS.test(u))
		const before = ownDate().length + libs().length
		await p.locator('button[aria-label="Filter"]').first().click()
		await p.locator('[data-jd="portal"]').getByRole("button", { name: "Seen" }).click()
		await p.locator('[data-jd="portal"] [role="grid"]').first().waitFor({ timeout: 15000 }).catch(() => undefined)
		const after = ownDate().map((u) => u.slice(u.lastIndexOf("/") + 1))
		const libFiles = libs()
		console.log("== split: date filter")
		ok("calendar chunk and calendar libraries not loaded before the filter opens", before === 0, `before=${before}`)
		ok("opening the date filter loads the calendar chunk", after.length > 0, after.join(","))
		ok(`and fetches react-day-picker ${VERSIONS["react-day-picker"]} and date-fns ${VERSIONS["date-fns"]} from the CDN then`, libFiles.some((u) => u.includes(`react-day-picker@${VERSIONS["react-day-picker"]}/`)) && libFiles.some((u) => u.includes(`date-fns@${VERSIONS["date-fns"]}/`)), `${libFiles.length} files`)
		ok("calendar shown", (await p.locator('[data-jd="portal"] [role="grid"]').count()) > 0)
		await p.screenshot({ path: `${prefix}-split-date.png` })
		await p.close()
	}
} else {
	// 9: from file:// the split loader cannot import modules; it must say so, not fail silently.
	writeFileSync(new URL("split-file.html", PAGES), splitPage(`window.__h = JsonDeck.mount('#app', { data: '#data' })`))
	const p = await browser.newPage()
	await p.goto(`${base}shots/cdn-pages/split-file.html`)
	const msg = await p.locator('[data-jd="load-error"]').textContent({ timeout: 5000 }).catch(() => "")
	console.log("== split: loader from file://")
	ok("shows a message pointing at jsondeck.full.js", msg.includes("jsondeck.full.js"), msg)
	await p.close()
}

await browser.close()
console.log(failed ? `verify-cdn: ${failed} FAILED` : "verify-cdn: all passed")
process.exit(failed ? 1 : 0)
