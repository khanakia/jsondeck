// Headless checks for the docs site (docs/index.html, built with jsondeck):
// sidebar groups, callouts / steps / code fences, heading anchors and the
// sticky table of contents with scroll-spy, ⌘K search (heading and row hits),
// the Features and Config reference tables, the site bar links, and the
// shared guards (no card shadows, no stray scrollbars, compact rows) in light
// and dark.
//   node scripts/verify-docs.mjs <url-of-docs/index.html> [<shot-prefix>]
import { chromium } from "playwright"
import { shadowOffenders } from "./no-shadows.mjs"
import { rowHeightOffenders } from "./row-heights.mjs"
import { scrollOffenders } from "./scroll-audit.mjs"

const [url, prefix = "shots/docs"] = process.argv.slice(2)
const base = url.split("#")[0]
/** Height of demo/nav.js's sticky bar; make-docs sets --jds-sticky-top to it. */
const STICKY = 48
const results = []
const check = (name, ok, info = "") => results.push({ name, ok: !!ok, info })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
const errors = []
page.on("pageerror", (e) => errors.push(String(e)))
page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
const open = async (hash) => {
	await page.goto(`${base}${hash}`)
	await page.waitForSelector('[data-jd="pages-nav"]')
	await page.waitForTimeout(400)
}

// Sidebar: groups in order, every guide listed, no config issues.
await open("")
const nav = await page.evaluate(() => ({
	groups: [...document.querySelectorAll('[data-jd="nav-group"]')].map((g) => g.getAttribute("data-jd-group-name")),
	links: document.querySelectorAll("[data-jd-page-link]").length,
	issues: document.querySelector('[data-jd="issues"]')?.textContent ?? "",
}))
check("sidebar groups Start / Guides / Reference", nav.groups.join("|") === "Start|Guides|Reference", nav.groups.join("|"))
check("sidebar lists overview + 12 guides + 2 reference pages", nav.links === 15, String(nav.links))
check("no config issues", nav.issues === "", nav.issues.slice(0, 120))
await page.screenshot({ path: `${prefix}-overview-light.png` })

// Guide: callout, steps, code fences as CodeView, heading ids + anchor links.
await open("#/getting-started")
const g = await page.evaluate(() => {
	const md = document.querySelector('[data-jd="markdown"]')
	const hs = [...(md?.querySelectorAll("h3, h4") ?? [])]
	return {
		callouts: [...document.querySelectorAll('[data-jd="callout"]')].map((c) => c.getAttribute("data-jd-callout")),
		steps: document.querySelectorAll('[data-jd="steps"] [data-jd="step"]').length,
		code: document.querySelectorAll('[data-jd="md-code"] [data-jd="codeview"]').length,
		lang: document.querySelector('[data-jd="md-code"] [data-jd="code-lang"]')?.textContent ?? "",
		headings: hs.length,
		withIds: hs.filter((h) => h.id.startsWith("getting-started--")).length,
		anchorHref: hs[0]?.querySelector('[data-jd="heading-anchor"]')?.getAttribute("href") ?? "",
		toc: document.querySelectorAll("[data-jd-toc-link]").length,
	}
})
check("callouts render (warning)", g.callouts.includes("warning"), g.callouts.join(","))
check("steps render as a 3-step stepper", g.steps === 3, String(g.steps))
check("code fences render as CodeView with a language label", g.code >= 2 && g.lang === "html", `${g.code} ${g.lang}`)
check("every heading has an anchor id", g.headings > 0 && g.withIds === g.headings, `${g.withIds}/${g.headings}`)
check("heading anchor link points at #/page/slug", g.anchorHref === "#/getting-started/the-smallest-page", g.anchorHref)
check("table of contents lists every heading", g.toc === g.headings, `${g.toc}/${g.headings}`)
await page.screenshot({ path: `${prefix}-guide-light.png` })

// Anchor in the URL scrolls the heading to just under the sticky bar; scroll-spy marks it.
await open("#/columns-and-types/look-and-feel")
await page.waitForTimeout(300)
const a = await page.evaluate(() => ({
	top: document.getElementById("columns-and-types--look-and-feel")?.getBoundingClientRect().top ?? -999,
	active: document.querySelector('[data-jd-toc-link][aria-current="location"]')?.getAttribute("data-jd-toc-link") ?? "",
	tocTop: document.querySelector('[data-jd="toc"]')?.getBoundingClientRect().top ?? -1,
}))
check("#/page/anchor scrolls the heading under the sticky bar", a.top >= STICKY && a.top <= STICKY + 30, String(Math.round(a.top)))
check("scroll-spy marks the visible heading", a.active === "look-and-feel", a.active)
check("table of contents stays sticky under the bar", a.tocTop >= STICKY && a.tocTop <= STICKY + 20, String(Math.round(a.tocTop)))
// Clicking a toc link moves the hash and the scroll.
await page.goto(`${base}#/getting-started`)
await page.waitForTimeout(400)
await page.locator('[data-jd-toc-link="the-smallest-page"]').click()
await page.waitForTimeout(400)
const c = await page.evaluate(() => ({ hash: location.hash, top: document.getElementById("getting-started--the-smallest-page")?.getBoundingClientRect().top ?? -999 }))
check("toc link click: hash + scroll", c.hash === "#/getting-started/the-smallest-page" && c.top >= STICKY && c.top <= STICKY + 30, `${c.hash} ${Math.round(c.top)}`)
const sidebarTop = await page.locator('nav[data-jd="pages-nav"]').evaluate((el) => el.getBoundingClientRect().top)
check("sidebar stays sticky under the bar", sidebarTop >= STICKY && sidebarTop <= STICKY + 20, String(Math.round(sidebarTop)))

// Search: "/" opens on a page without a table; a heading hit navigates to its anchor.
await page.keyboard.press("/")
await page.waitForTimeout(150)
check('"/" opens search on a page without a table', await page.locator('[data-jd="site-search"]').isVisible())
await page.keyboard.type("quick filters")
await page.waitForTimeout(200)
const first = await page.locator("[data-jd-hit-index='0']").evaluate((el) => `${el.getAttribute("data-jd-hit-kind")}:${el.textContent}`)
check("search ranks the Quick filters heading first", first.startsWith("heading:Quick filters"), first.slice(0, 60))
await page.keyboard.press("Enter")
await page.waitForTimeout(400)
const s1 = await page.evaluate(() => ({ hash: location.hash, top: document.getElementById("filters-and-quick-filters--quick-filters")?.getBoundingClientRect().top ?? -999, open: !!document.querySelector('[data-jd="site-search"]') }))
check("Enter on a heading hit opens that page at the heading", s1.hash === "#/filters-and-quick-filters/quick-filters" && !s1.open && s1.top >= STICKY - 2 && s1.top < 900, `${s1.hash} ${Math.round(s1.top)}`)
// ⌘K / Ctrl+K anywhere; a row hit opens the row drawer on its page.
await page.keyboard.press("Control+k")
await page.waitForTimeout(150)
await page.keyboard.type("groupAggregates")
await page.waitForTimeout(200)
await page.screenshot({ path: `${prefix}-search-light.png` })
const rowHit = page.locator("[data-jd-hit-kind='row']").first()
check("search finds config reference rows", (await rowHit.count()) > 0)
await rowHit.click()
await page.waitForTimeout(400)
const s2 = await page.evaluate(() => ({ hash: location.hash, drawer: document.querySelector('[data-jd="drawer"]')?.textContent ?? "" }))
check("a row hit opens its page and the row drawer", /^#\/(config|features)/.test(s2.hash) && s2.drawer.includes("groupAggregates"), `${s2.hash} ${s2.drawer.slice(0, 40)}`)
await page.keyboard.press("Escape")
await page.keyboard.press("Control+k")
await page.keyboard.press("Escape")
await page.waitForTimeout(100)
check("Esc closes search", (await page.locator('[data-jd="site-search"]').count()) === 0)

// Reference tables.
await open("#/features")
const f = await page.evaluate(() => ({ status: document.querySelector('[data-jd="status-bar"]')?.textContent ?? "", groups: document.querySelectorAll("[data-jd-group]").length, link: document.querySelector('a[href*="examples.html#ex-"]')?.getAttribute("href") ?? "" }))
check("Features: all 125 rows, grouped by category, example links", f.status.includes("125") && f.groups >= 10 && f.link.startsWith("../demo/examples.html#ex-"), `${f.status.slice(0, 30)} groups=${f.groups} ${f.link}`)
await page.screenshot({ path: `${prefix}-features-light.png` })
const siteBar = await page.evaluate(() => [...document.querySelectorAll("nav[aria-label='jsondeck demos'] a")].filter((el) => el.style.fontWeight === "500").map((el) => el.textContent))
check("site bar: Features is the active link on #/features", siteBar.includes("Features") && !siteBar.includes("Docs"), siteBar.join(","))
await open("#/config")
const cfg = await page.locator('[data-jd="status-bar"]').textContent()
check("Config reference: all 192 keys", (cfg ?? "").includes("192"), cfg ?? "")
await open("#/theming-and-classes")
const siteBar2 = await page.evaluate(() => [...document.querySelectorAll("nav[aria-label='jsondeck demos'] a")].filter((el) => el.style.fontWeight === "500").map((el) => el.textContent))
check("site bar: Docs is the active link on a guide", siteBar2.includes("Docs") && !siteBar2.includes("Features"), siteBar2.join(","))

// Shared guards on every docs page kind, light and dark.
for (const scheme of ["light", "dark"]) {
	const p = await browser.newPage({ viewport: { width: 1400, height: 900 }, colorScheme: scheme })
	for (const h of ["#/overview", "#/getting-started", "#/features", "#/config"]) {
		await p.goto(`${base}${h}`)
		await p.waitForTimeout(600)
		const sh = await shadowOffenders(p)
		check(`no card shadows: ${h} (${scheme})`, sh.length === 0, sh.slice(0, 3).join(" | "))
		const sc = await scrollOffenders(p)
		check(`no stray scrollbars: ${h} (${scheme})`, sc.length === 0, sc.slice(0, 3).join(" | "))
		const tall = await rowHeightOffenders(p)
		check(`compact rows ≤ 30px: ${h} (${scheme})`, tall.length === 0, tall.slice(0, 3).join(" | "))
	}
	if (scheme === "dark") {
		await p.goto(`${base}#/getting-started`)
		await p.waitForTimeout(500)
		await p.screenshot({ path: `${prefix}-guide-dark.png` })
		await p.goto(`${base}#/overview`)
		await p.waitForTimeout(500)
		await p.screenshot({ path: `${prefix}-overview-dark.png` })
	}
	await p.close()
}

check("no console errors", errors.length === 0, errors.slice(0, 3).join(" | "))
await browser.close()
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.info ? `  [${r.info}]` : ""}`)
console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
