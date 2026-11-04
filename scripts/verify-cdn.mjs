// CDN-style smoke check: blank pages that load jsondeck the three ways the README
// documents, each mounting zero-config data, then asserting a table rendered AND
// is styled (computed styles on a cell, not just the DOM being there).
//   1. one tag: only dist/jsondeck.full.js, no stylesheet -> exactly one injected <style data-jsondeck>
//   2. pair:    dist/jsondeck.css + dist/jsondeck.js       -> no injected style
//   3. one tag + linked css                                -> injection skipped (no double CSS)
//   4. ESM:     import { mount } from dist/jsondeck.mjs, React from a local ESM build
//      through an import map (http only: browsers refuse module scripts from file://)
//   node scripts/verify-cdn.mjs <base-url-ending-in-/> [shots-prefix]
//   JSONDECK_IIFE=jsondeck.preact.js swaps the IIFE under test (Preact build).
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
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
	{ name: "css+js", file: "pair.html", html: page(`<link rel="stylesheet" href="../../dist/jsondeck.css">`, `<script src="../../dist/${IIFE}"></script>${mountTag}`), injected: 0 },
	{ name: "one-tag+css", file: "one-tag-css.html", html: page(`<link rel="stylesheet" href="../../dist/jsondeck.css">`, `<script src="../../dist/${FULL}"></script>${mountTag}`), injected: 0 },
]

if (base.startsWith("http")) {
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
	console.log("  -  esm: not run on file:// (browsers block module scripts from file://); runs in the http pass")
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
		}
	})
	console.log(`== ${c.name}`)
	ok("mount returned", r.mounted)
	ok("table rendered with 3 rows", r.rows === 3, `rows=${r.rows}`)
	// Browser default for a td is 16px text and 1px padding; our compact cell is 13px.
	ok("cell is styled (13px text)", r.fontSize === "13px", `font-size=${r.fontSize} padding-top=${r.padTop}`)
	ok(`injected <style data-jsondeck> count is ${c.injected}`, r.injected === c.injected, `found ${r.injected}`)
	ok("no page errors", errors.length === 0, errors.slice(0, 2).join(" | "))
	await p.screenshot({ path: `${prefix}-${c.name}.png` })
	await p.close()
}
await browser.close()
console.log(failed ? `verify-cdn: ${failed} FAILED` : "verify-cdn: all passed")
process.exit(failed ? 1 : 0)
