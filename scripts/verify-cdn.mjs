// CDN-style smoke check: blank pages that load jsondeck the three ways the README
// documents, each mounting zero-config data, then asserting a table rendered AND
// is styled (computed styles on a cell, not just the DOM being there).
//   1. one tag: only dist/jsondeck.full.js, no stylesheet -> exactly one injected <style data-jsondeck>
//   2. pair:    dist/jsondeck.css + dist/jsondeck.js       -> no injected style
//   3. one tag + linked css                                -> injection skipped (no double CSS)
//   4. ESM:     import { mount } from dist/jsondeck.mjs, React from a local ESM build
//      through an import map (http only: browsers refuse module scripts from file://)
// Then the split build (dist/jsondeck.js + dist/chunks/), over http:
//   5. first load of a plain zero-config table: the JS bytes actually requested (gzip,
//      from the network log) stay under FIRST_LOAD_BUDGET_KB, and no chart, calendar,
//      editor, highlighter or popups chunk is requested
//   6. mount called before the library has loaded: handle, issues, ready, describe after ready
//   7. the dashboard demo: the chart chunk loads on demand and the charts render
//   8. opening a date filter loads the calendar chunk and shows the calendar
// and from file://: 9. the split loader shows a clear message pointing at jsondeck.full.js
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
	ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
	await p.screenshot({ path: `${prefix}-${c.name}.png` })
	await p.close()
}
// ── The split build ──────────────────────────────────────────────────────────
/**
 * Most JS a plain zero-config table page may download on first load, gzip level 9,
 * React included (loader + entry + core + runtime). Measured at about 118.6 kB when
 * this was set; the margin only absorbs small changes, a real regression fails here.
 */
const FIRST_LOAD_BUDGET_KB = 121
/** Chunks a plain table must not fetch before anyone interacts with it (named after what is in them). */
const NOT_ON_FIRST_LOAD = [/chart/i, /date/i, /edit/i, /codeview|markdown/i, /popups/i]
const kb = (n) => `${(n / 1024).toFixed(1)} kB`
/** Every script URL the page requests (classic scripts, module imports, modulepreloads). */
const scriptLog = (p) => {
	const urls = []
	p.on("request", (r) => {
		if (/\.m?js(\?|$)/.test(r.url())) urls.push(r.url())
	})
	return urls
}
/** gzip -9 size of a requested file, read from the repo (the test server sends files uncompressed, like a CDN before compression). */
const gzBytes = (url) => gzipSync(readFileSync(new URL(url.slice(base.length), ROOT)), { level: 9 }).length
const settled = (p) => p.waitForFunction(() => !document.querySelector('[data-jd="pending"]') && !!document.querySelector('[data-jd="root"]'), null, { timeout: 15000 }).catch(() => undefined)
const HOSTS = Array.from({ length: 40 }, (_, i) => ({ ip: `10.0.${i >> 4}.${i & 15}`, name: `web-${i + 1}`, status: i % 7 === 0 ? "down" : "up", cpu: (i * 37) % 100, seen: `2026-0${1 + (i % 9)}-${String(10 + (i % 18)).padStart(2, "0")}` }))
const splitPage = (body) => `<!doctype html><html><head><meta charset="utf-8"><title>split check</title><link rel="stylesheet" href="../../dist/jsondeck.css"></head><body><script type="application/json" id="data">${JSON.stringify({ hosts: HOSTS })}</script><div id="app"></div><script src="../../dist/jsondeck.js"></script><script>${body}</script></body></html>`

if (base.startsWith("http")) {
	// 5 + 6: plain table, mount before the core has loaded.
	writeFileSync(new URL("split-table.html", PAGES), splitPage(`
	  window.__h = JsonDeck.mount('#app', { data: '#data' })
	  try { JsonDeck.describe({}); window.__early = 'no error' } catch (e) { window.__early = e.message }
	  window.__h.ready.then(() => { window.__desc = JsonDeck.describe('#data'); window.__issues = window.__h.issues.length })`))
	{
		const p = await browser.newPage()
		const errors = []
		p.on("pageerror", (e) => errors.push(String(e)))
		p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
		const urls = scriptLog(p)
		await p.goto(`${base}shots/cdn-pages/split-table.html`)
		await p.waitForSelector('[data-jd="table"] tbody tr', { timeout: 10000 }).catch(() => undefined)
		await settled(p)
		await p.waitForLoadState("networkidle")
		const total = urls.reduce((sum, u) => sum + gzBytes(u), 0)
		const names = urls.map((u) => u.slice(u.lastIndexOf("/") + 1))
		console.log("== split: plain table, first load")
		console.log(`  JS requested: ${names.map((n, i) => `${n} ${kb(gzBytes(urls[i]))}`).join(", ")}`)
		ok(`first-load JS is ${kb(total)} gzip, under ${FIRST_LOAD_BUDGET_KB} kB`, total <= FIRST_LOAD_BUDGET_KB * 1024)
		const early = names.filter((n) => NOT_ON_FIRST_LOAD.some((re) => re.test(n)))
		ok("no chart, calendar, editor, highlighter or popups chunk requested", early.length === 0, early.join(", "))
		const r = await p.evaluate(() => ({ rows: document.querySelectorAll('[data-jd="table"] tbody tr').length, early: window.__early, tables: Object.keys(window.__desc?.tables ?? {}), issues: window.__issues }))
		console.log("== split: mount before the library loaded")
		ok("table rendered (mount was queued)", r.rows > 0, `rows=${r.rows}`)
		ok("describe() before load throws a clear 'still loading' error", /still loading/.test(r.early ?? ""), r.early)
		ok("handle.ready resolves; describe() works after it", r.tables.includes("hosts") && r.issues === 0, `${r.tables.join(",")} issues=${r.issues}`)
		ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
		await p.screenshot({ path: `${prefix}-split-table.png` })
		await p.close()
	}
	// 7: the dashboard demo loads the chart chunk on demand and renders the charts.
	{
		const p = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
		const urls = scriptLog(p)
		await p.goto(`${base}demo/index.html#/overview`)
		await settled(p)
		await p.waitForLoadState("networkidle")
		const total = urls.reduce((sum, u) => sum + gzBytes(u), 0)
		const names = urls.map((u) => u.slice(u.lastIndexOf("/") + 1))
		const charts = await p.locator('[data-jd-kind="chart"]').count()
		const drawn = await p.locator('[data-jd-kind="chart"] svg').count()
		console.log("== split: dashboard")
		console.log(`  JS requested (${kb(total)} gzip): ${names.join(", ")}`)
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
		const before = urls.filter((u) => /date/i.test(u)).length
		await p.locator('button[aria-label="Filter"]').first().click()
		await p.locator('[data-jd="portal"]').getByRole("button", { name: "Seen" }).click()
		await p.locator('[data-jd="portal"] [role="grid"]').first().waitFor({ timeout: 10000 }).catch(() => undefined)
		const after = urls.filter((u) => /date/i.test(u)).map((u) => u.slice(u.lastIndexOf("/") + 1))
		console.log("== split: date filter")
		ok("calendar chunk not loaded before the filter opens", before === 0)
		ok("opening the date filter loads the calendar chunk", after.length > 0, after.join(","))
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
