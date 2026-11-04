// Regenerates the README screenshots in screenshots/ from the live demo pages.
// Usage: node scripts/screenshots.mjs <base-url>   (e.g. http://127.0.0.1:4986/)
// Each shot is independent: one failure is reported and the rest still run.
import { chromium } from "playwright"
import { mkdirSync } from "node:fs"

const base = (process.argv[2] ?? "").replace(/\/?$/, "/")
if (!base.startsWith("http")) throw new Error("pass the preview base URL, e.g. http://127.0.0.1:4986/")
const OUT = new URL("../screenshots/", import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

/** One screenshot: open a page in a theme, optionally interact, then capture. */
const SHOTS = [
	{ name: "dashboard-light", path: "demo/#/overview", theme: "light" },
	{ name: "dashboard-dark", path: "demo/#/overview", theme: "dark" },
	{ name: "expanded-row-nested", path: "demo/#/overview", theme: "light", act: async (p) => { await p.locator("[data-jd=expand]").first().click(); await p.locator("[data-jd=row-detail]").first().scrollIntoViewIfNeeded() } },
	{ name: "context-menu", path: "demo/#/overview", theme: "dark", act: async (p) => { const td = p.locator("[data-jd=table] tbody td").nth(4); await td.scrollIntoViewIfNeeded(); await td.click({ button: "right" }); await p.waitForTimeout(300); await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowRight") } },
	{ name: "master-detail", path: "demo/#/inventory", theme: "light", act: async (p) => { await p.locator("[data-jd=table] tbody tr").first().click() } },
	{ name: "grouped-table", path: "demo/#/findings", theme: "light" },
	{ name: "edit-layout", path: "demo/#/overview", theme: "light", act: async (p) => { await p.locator("[data-jd=edit-toggle]").first().click() } },
	{ name: "quick-filters", path: "demo/tabs.html", theme: "light" },
	{ name: "charts-light", path: "demo/viz.html", theme: "light" },
	{ name: "charts-dark", path: "demo/viz.html", theme: "dark" },
	{ name: "examples-preview-code", path: "demo/examples.html", theme: "light" },
	{ name: "theming-example", path: "demo/examples.html", theme: "light", act: async (p) => { await p.locator("#ex-theming").scrollIntoViewIfNeeded() } },
	{ name: "docs-guide", path: "docs/#/getting-started", theme: "light" },
	{ name: "docs-features", path: "docs/#/features", theme: "light" },
	{ name: "mobile", path: "demo/#/overview", theme: "light", width: 420, height: 860 },
]

const browser = await chromium.launch()
let failed = 0
for (const s of SHOTS) {
	const ctx = await browser.newContext({ viewport: { width: s.width ?? 1440, height: s.height ?? 900 }, deviceScaleFactor: 1 })
	await ctx.addInitScript((t) => { try { localStorage.setItem("jsondeck:theme", t) } catch {} }, s.theme)
	const p = await ctx.newPage()
	try {
		await p.goto(base + s.path, { waitUntil: "networkidle" })
		await p.waitForTimeout(500)
		if (s.act) { await s.act(p); await p.waitForTimeout(400) }
		await p.screenshot({ path: `${OUT}${s.name}.png` })
		console.log("ok  ", s.name)
	} catch (e) {
		failed++
		console.log("FAIL", s.name, String(e).split("\n")[0])
	}
	await ctx.close()
}
await browser.close()
process.exit(failed ? 1 : 0)
