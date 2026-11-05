// Headless check of demo/viz.html: node scripts/verify-viz.mjs <url> <shot-prefix>
import { chromium } from "playwright"

const [url, prefix = "shots/viz"] = process.argv.slice(2)
const browser = await chromium.launch({ headless: true })
const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage()
const errors = []
page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
page.on("pageerror", (e) => errors.push(String(e)))
const results = []
const check = (name, ok, info = "") => {
	results.push({ name, ok: !!ok, info })
	// VERIFY_TRACE=1 prints each check as it runs (find where a run stops).
	if (process.env.VERIFY_TRACE) console.log(`  ${ok ? "ok" : "FAIL"}  ${name}`)
}
const chart = (i) => page.locator(`[data-chart-index="${i}"]`)
const marks = (i) => chart(i).locator("path.jdv-mark").count()

await page.goto(url)
await page.waitForSelector("[data-jd-chart]")
await page.waitForTimeout(200)
await page.screenshot({ path: `${prefix}-light.png`, fullPage: true })

check("bar: 4 severity bars", (await marks(0)) === 4, `${await marks(0)}`)
check("hbar: 9 area bars", (await marks(1)) === 9, `${await marks(1)}`)
const st = await marks(2)
check("stacked: segments present (<= 9 areas x 4 sev)", st > 9 && st <= 36, `${st}`)
const gr = await marks(3)
check("grouped: bars present (<= 5 regions x 3 states)", gr > 5 && gr <= 15, `${gr}`)
check("line: one path", (await chart(5).locator('[data-jd="line"]').count()) === 1)
check("area: one line per env (3)", (await chart(6).locator('[data-jd="line"]').count()) === 3)
check("pie: 6 instance-type slices", (await marks(7)) === 6, `${await marks(7)}`)
check("donut: 3 status slices", (await marks(8)) === 3, `${await marks(8)}`)
check("empty state shown", (await chart("empty").locator('[data-jd="chart-empty"]').count()) === 1)
check("legend on multi-series", (await chart(2).locator('[data-jd="legend"] li').count()) === 4)
check("hidden data table for screen readers", (await chart(0).locator(".jd\\:sr-only table tbody tr").count()) === 4)
check("svg has role=img + aria-label", !!(await chart(0).locator('[role="img"]').getAttribute("aria-label")))
check("host svg text rule did not leak (axis 11px)", (await chart(0).locator("svg text").first().evaluate((e) => getComputedStyle(e).fontSize)) === "11px")

// click → onSelect
await chart(0).locator("path.jdv-mark").first().click()
let sel = await page.evaluate(() => window.__vizSelect.at(-1))
check("click bar → onSelect(critical)", sel === "Findings by severity: critical", sel)
await chart(7).locator("path.jdv-mark").first().click()
sel = await page.evaluate(() => window.__vizSelect.at(-1))
check("click slice → onSelect(type)", /^EC2 by instance type: \S+/.test(sel ?? ""), sel)
await chart(2).locator("path.jdv-mark").first().click()
sel = await page.evaluate(() => window.__vizSelect.at(-1))
check("click stacked segment → onSelect(key / series)", / \/ /.test(sel ?? ""), sel)
await chart(0).locator("path.jdv-mark").nth(1).focus()
await page.keyboard.press("Enter")
sel = await page.evaluate(() => window.__vizSelect.at(-1))
check("keyboard Enter on bar → onSelect(high)", sel === "Findings by severity: high", sel)

// tooltip
await chart(0).locator("path.jdv-mark").nth(2).hover()
const tip = chart(0).locator('[data-jd="tooltip"]')
check("bar hover tooltip", (await tip.count()) === 1 && /medium/.test(await tip.textContent()), await tip.textContent().catch(() => ""))
const lbox = await chart(5).locator('[data-jd="line-hit"]').boundingBox()
await page.mouse.move(lbox.x + lbox.width * 0.5, lbox.y + 40)
const ltip = chart(5).locator('[data-jd="tooltip"]')
check("line crosshair tooltip", (await ltip.count()) === 1, await ltip.textContent().catch(() => ""))
await chart(5).screenshot({ path: `${prefix}-line-hover.png` })

// markdown safety
const md = page.locator('[data-jd="markdown"]')
check("markdown: no script/img elements", (await md.locator("script, img").count()) === 0)
check("markdown: no javascript: links", (await md.locator('a[href^="javascript"]').count()) === 0 && (await md.locator('a[href="https://example.com"]').count()) === 1)
check("relations: forward host + reverse counts", /forward → host \(private_ip\): 1 row/.test(await page.locator('[data-jd="relations"]').textContent()), await page.locator('[data-jd="relations"]').textContent())
check("stat tiles render 4", (await page.locator('[data-jd="stat-value"]').count()) === 4)

// dark mode: the navbar toggle is the page's only theme switch
check("exactly one theme toggle (the navbar's)", (await page.locator('[data-jd="theme-toggle"], [data-jd="theme"], [data-jd-site-theme]').count()) === 1)
await page.locator("[data-jd-site-theme]").click()
await page.waitForTimeout(150)
const dark = await page.evaluate(() => {
	// The root is transparent (it shows the page); the chart card carries the surface.
	const card = document.querySelector('[data-chart-index="0"]')
	const t = document.querySelector('[data-chart-index="0"] svg text')
	return { bg: getComputedStyle(card).backgroundColor, fill: getComputedStyle(t).fill }
})
check("dark mode: zinc-900 card, muted-foreground axis ink", dark.bg === "rgb(24, 24, 27)" && dark.fill === "rgb(161, 161, 170)", JSON.stringify(dark))
await page.screenshot({ path: `${prefix}-dark.png`, fullPage: true })

// resize
const w1 = await chart(0).locator("svg").first().getAttribute("width")
await page.setViewportSize({ width: 700, height: 1000 })
await page.waitForTimeout(250)
const w2 = await chart(0).locator("svg").first().getAttribute("width")
check("resize re-lays out", Number(w2) < Number(w1), `${w1} -> ${w2}`)
await page.screenshot({ path: `${prefix}-narrow.png` })

check("no console errors", errors.length === 0, errors.join(" | "))
await browser.close()
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.info ? `  (${r.info})` : ""}`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
