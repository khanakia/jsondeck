// Probe: drawer above the demo navbar (scrolled; closes by ✕, Esc, backdrop,
// focus in/out) and the site-wide theme across every demo page.
//   node scripts/probe-theme.mjs <base-url-of-repo-root> <tag>
import { chromium } from "playwright"
const [base, tag = "http"] = process.argv.slice(2)
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, colorScheme: "light" })
const p = await ctx.newPage()
const errs = []
p.on("pageerror", (e) => errs.push(String(e)))
const out = []
const ok = (n, c, i = "") => out.push(`${c ? "PASS" : "FAIL"}  ${n}${i !== "" ? `  [${String(i).slice(0, 120)}]` : ""}`)

// ── Drawer over the navbar ───────────────────────────────────────────────
await p.goto(`${base}/demo/index.html#/overview`)
await p.waitForSelector("[data-jd-page-link]")
const row = p.locator('[data-jd-item="find-table"] tbody tr[data-jd-row]').nth(8)
await row.scrollIntoViewIfNeeded()
await p.mouse.wheel(0, 300)
await p.waitForTimeout(150)
ok("page is scrolled", (await p.evaluate(() => window.scrollY)) > 400, await p.evaluate(() => window.scrollY))
await row.locator("td").nth(5).click()
await p.waitForTimeout(200)
const top = await p.evaluate(() => {
	const btn = document.querySelector('[data-jd="drawer-close"]')
	const r = btn.getBoundingClientRect()
	return { y: r.top, hit: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('[data-jd="drawer-close"]') !== null }
})
ok("drawer close button visible at top and on top of the navbar", top.y >= 0 && top.y < 40 && top.hit, JSON.stringify(top))
ok("focus moved into the drawer", await p.evaluate(() => document.activeElement?.getAttribute("data-jd") === "drawer-close"))
await p.screenshot({ path: `shots/drawer-over-nav-${tag}.png` })
await p.locator('[data-jd="drawer-close"]').click()
ok("✕ closes the drawer", (await p.locator('[data-jd="drawer"]').count()) === 0)
ok("focus returns to the row", await p.evaluate(() => document.activeElement?.tagName === "TR"))
await row.locator("td").nth(5).click()
await p.keyboard.press("Escape")
ok("Esc closes the drawer", (await p.locator('[data-jd="drawer"]').count()) === 0)
await row.locator("td").nth(5).click()
await p.locator('[data-jd="drawer-backdrop"]').click({ position: { x: 100, y: 300 } })
ok("backdrop click closes the drawer", (await p.locator('[data-jd="drawer"]').count()) === 0)

// ── Site-wide theme ──────────────────────────────────────────────────────
const bg = () => p.evaluate(() => getComputedStyle(document.body).backgroundColor)
const pages = ["demo/index.html", "demo/tabs.html", "demo/viz.html", "demo/examples.html"]
const deckDark = () => p.evaluate(() => {
	const roots = [...document.querySelectorAll(".jd-root")]
	return roots.length > 0 && roots.every((r) => r.classList.contains("jd-dark"))
})
const deckLight = () => p.evaluate(() => [...document.querySelectorAll(".jd-root")].every((r) => !r.classList.contains("jd-dark")))
await p.goto(`${base}/index.html`)
await p.waitForSelector("[data-jd-site-theme]")
const lightHome = await bg()
await p.locator("[data-jd-site-theme]").click()
await p.waitForTimeout(100)
const darkHome = await bg()
ok("home: navbar toggle turns the page dark", darkHome !== lightHome && (await p.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark", `${lightHome} → ${darkHome}`)
await p.screenshot({ path: `shots/theme-home-dark-${tag}.png` })
for (const path of pages) {
	await p.goto(`${base}/${path}`)
	await p.waitForTimeout(700)
	const dark = await deckDark()
	const b2 = await bg()
	ok(`dark carries to ${path} (page + every deck)`, dark && b2 !== lightHome && (await p.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "dark", `${b2} roots=${await p.locator(".jd-root").count()}`)
	await p.screenshot({ path: `shots/theme-${path.replace(/\W+/g, "-")}-dark-${tag}.png` })
}
// a deck's own toggle flips the whole page (on the dashboard)
await p.goto(`${base}/demo/index.html`)
await p.waitForTimeout(500)
await p.locator("[data-jd-site-theme]").click()
await p.waitForTimeout(150)
ok("the navbar toggle on the dashboard flips the page and every deck", (await p.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "light" && (await deckLight()) && (await p.locator("[data-jd-site-theme]").getAttribute("data-jd-site-theme")) === "light")
ok("choice persisted", (await p.evaluate(() => { try { return localStorage.getItem("jsondeck:theme") } catch { return "n/a" } })) === "light")
for (const path of ["index.html", ...pages]) {
	await p.goto(`${base}/${path}`)
	await p.waitForTimeout(600)
	ok(`light carries to ${path}`, (await deckLight()) && (await bg()) !== darkHome, await bg())
}
ok("no page errors", errs.length === 0, errs.join(" | "))
await b.close()
console.log(out.join("\n"))
