// Headless check of the demo: node scripts/verify.mjs <url> <shot-prefix>
// Part 1 runs the generic table checks on the zero-config DNS tab; part 2
// checks each override group the demo config uses (findings, ec2).
import { chromium } from "playwright"
import { rowHeightOffenders } from "./row-heights.mjs"
import { scrollOffenders } from "./scroll-audit.mjs"

const [url, prefix = "shots/run"] = process.argv.slice(2)
const browser = await chromium.launch({ headless: true, args: ["--hide-scrollbars=false"] })
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, colorScheme: "light" })
const page = await ctx.newPage()
const errors = []
const warnings = []
page.on("console", (m) => (m.type() === "error" ? errors : m.type() === "warning" ? warnings : []).push(m.text()))
page.on("pageerror", (e) => errors.push(String(e)))
const results = []
const SCROLL_PAGES = [url]
const check = (name, ok, info = "") => results.push({ name, ok: !!ok, info })
const active = () => page.locator("[data-jd-tabpanel]:not([hidden]) [data-jd-table]")
const portal = () => page.locator('[data-jd="portal"]')
const colIdx = async (label) => (await active().locator("thead th").allTextContents()).findIndex((h) => h.replace(/\d+$/, "").toLowerCase() === label.toLowerCase())
const col = async (label) => {
	const i = typeof label === "number" ? label : await colIdx(label)
	return active().locator("tbody tr").evaluateAll((trs, i) => trs.map((tr) => tr.children[i]?.textContent ?? ""), i)
}
const range = () => active().locator('[data-jd="range"]').textContent()
const count = () => active().locator('[data-jd="count"]').textContent()
const settle = () => page.waitForTimeout(450) // SearchInput debounces 300ms
const tab = async (n) => { await page.locator(`[data-jd-tab="${n}"]`).click(); await page.waitForTimeout(100) }

await page.goto(url)
await page.waitForSelector("[data-jd-tab]")
const tabs = await page.locator("[data-jd-tab]").allTextContents()
check("3 tabs in tableOrder, labels with acronyms", tabs.join("|") === "Findings120|EC260|DNS300", tabs.join(" | "))
await page.screenshot({ path: `${prefix}-light.png` })

// ── Part 1: generic table behaviour on the zero-config DNS tab ──────────────
await tab("dns")
const dnsHeaders = await active().locator("thead th").allTextContents()
check("zero config: guessed labels (TTL acronym)", dnsHeaders.includes("TTL") && dnsHeaders.includes("Proxied"), dnsHeaders.join(","))
const n1 = await col(1)
await active().getByLabel("Next page").click()
check("next page changes rows", (await range()) === "51–100 of 300" && (await col(1))[0] !== n1[0], await range())
await page.keyboard.press("ArrowLeft")
check("ArrowLeft goes back", (await range()).startsWith("1–"), await range())
await page.keyboard.press("ArrowRight")
check("ArrowRight goes forward", (await range()).startsWith("51–"), await range())
await active().getByLabel("Last page").click()
check("last page", (await range()) === "251–300 of 300", await range())
await active().getByLabel("Rows per page").click()
await portal().getByRole("menuitem", { name: "25", exact: true }).click()
check("page size 25", (await active().locator("tbody tr").count()) === 25 && (await range()) === "1–25 of 300", await range())
const pagesTxt = await active().locator('[data-jd="pagination"]').textContent()
check("pagination shows ellipsis", pagesTxt.includes("…"), pagesTxt)
await page.keyboard.press("/")
await page.keyboard.type("grafana")
await settle()
const names = await col("Name")
check("search filters rows ('/' focus)", names.length > 0 && names.length < 25 && names.every((n) => n.includes("grafana")), `${names.length} rows`)
await page.keyboard.press("Escape")
await settle()
check("Esc clears search", (await range()) === "1–25 of 300", await range())
await active().getByRole("button", { name: /^Filter/ }).click()
await portal().getByRole("button", { name: "Type" }).click()
await portal().getByRole("button", { name: "MX" }).click()
await portal().getByRole("button", { name: "Apply" }).click()
await page.waitForTimeout(150)
const types = await col("Type")
check("enum filter type is any of MX", types.length > 0 && types.every((t) => t === "MX"), await range())
await active().getByRole("button", { name: /^Filter/ }).click()
await portal().getByRole("button", { name: "Name" }).click()
await page.keyboard.type("blog")
await page.keyboard.press("Enter")
await page.waitForTimeout(150)
const nm = await col("Name")
check("text filter name contains 'blog' (AND)", nm.length > 0 && nm.every((n) => n.includes("blog")) && (await col("Type")).every((t) => t === "MX"), await range())
const filteredRange = await range()
await active().locator('[data-jd-views-trigger="true"]').click()
await portal().getByRole("menuitem", { name: /Save as new view/ }).click()
await page.keyboard.type("MX blogs")
await page.keyboard.press("Enter")
await page.waitForTimeout(300)
check("save view", (await active().locator('[data-jd-views-trigger="true"]').textContent()).includes("MX blogs"))
await active().getByRole("button", { name: /^clear$/i }).first().click()
await page.waitForTimeout(150)
await active().locator('[data-jd-sort="zone"]').click()
await active().locator('[data-jd-sort="name"]').click({ modifiers: ["Shift"] })
const zones = await col("Zone")
check("sort + shift-click multi-sort", (await count()).includes("zone ↑, name ↑") && zones.join() === [...zones].sort().join(), await count())
await page.screenshot({ path: `${prefix}-sort.png` })
await active().getByRole("button", { name: "Columns" }).click()
await portal().getByRole("menuitem", { name: "Content" }).click()
await page.screenshot({ path: `${prefix}-columns-menu.png` })
await page.keyboard.press("Escape")
check("hide column 'content'", !(await active().locator("thead th").allTextContents()).some((h) => h.startsWith("Content")))

// ── Part 2: override groups (findings, ec2) ─────────────────────
await tab("findings")
const fh = await active().locator("thead th").allTextContents()
const plainH = fh.map((h) => h.replace(/\d+$/, ""))
check("columnOrder (listed first) + computed column", plainH.slice(0, 5).join("|") === "ID|Severity|Risk|Title|Affected", plainH.join(","))
check("pin right moves status last", plainH.at(-1) === "Status", plainH.at(-1))
const idTh = active().locator('thead th[data-jd-pin="left"]')
check("pin left: sticky id header", (await idTh.count()) === 1 && (await idTh.evaluate((el) => getComputedStyle(el).position)) === "sticky")
const idTd = await active().locator("tbody tr").first().locator("td").first().evaluate((el) => [getComputedStyle(el).position, el.style.left].join(" "))
check("pin left: sticky id cells", idTd === "sticky 0px", idTd)
await active().locator('[data-jd-views-trigger="true"]').click()
check("labels override (views 'All rows')", (await portal().getByRole("menuitem", { name: "All rows" }).count()) === 1)
await page.keyboard.press("Escape")
check("defaultSort severity, -cvss", (await count()).includes("sorted by severity ↑, cvss ↓"), await count())
const statuses = await col("Status")
check("defaultFilters status = open (pill shown)", statuses.length > 0 && statuses.every((s) => s === "open") && (await active().textContent()).includes("is any of"), `${await range()}`)
const sev = await col("Severity")
check("default sort applied (critical first)", sev[0] === "critical", sev.slice(0, 3).join(","))
await active().getByLabel("Last page").click()
const sevI = await colIdx("Severity")
const lowStyle = await active().locator("tbody tr").evaluateAll((trs, i) => trs.map((tr) => tr.children[i]?.querySelector('[data-jd-badge="low"]')?.getAttribute("style")).find(Boolean) ?? null, sevI)
check("colors: CSS colour for severity low", String(lowStyle).includes("100, 116, 139") || String(lowStyle).includes("#64748b"), String(lowStyle))
await active().getByLabel("First page").click()
check("colors: tone for status open", (await active().locator('[data-jd-badge="open"]').first().getAttribute("data-jd-tone")) === "red")
const fixTone = await active().locator('[data-jd-badge]').evaluateAll((els) => els.filter((e) => e.closest("td") && e.textContent.startsWith("Use ")).map((e) => e.getAttribute("data-jd-tone"))[0])
check("unknown enum values get calm neutral (slate)", fixTone === "slate", fixTone)
const risk = await col("Risk")
check("computed column value(row) + format number:1", risk.length > 0 && risk.every((r) => /^\d+\.\d$/.test(r)), risk.slice(0, 3).join(","))
const cost = await col("Est. cost")
check("format currency:USD", cost.some((c) => c.startsWith("$")), cost.slice(0, 2).join(","))
const seen = await col("First seen")
check("format relative", seen.some((s) => /ago|last|yesterday|year|month/.test(s)), seen.slice(0, 2).join(","))
const href = await active().locator('[data-jd-link="id"]').first().getAttribute("href")
const firstId = (await col("ID"))[0]
check("link template", href === `https://tracker.example.test/finding/${firstId}`, href)
const detailTitle = await active().locator("tbody tr").first().locator("td").nth(await colIdx("Detail")).getAttribute("title")
check("tooltip on detail", (detailTitle ?? "").length > 30, (detailTitle ?? "").slice(0, 30))
check("rowClass", (await active().locator("tbody tr.demo-critical").count()) > 0)
await active().locator("tbody tr").nth(2).locator("td").nth(await colIdx("Title")).click()
check("onRowClick", (await page.locator("#clicked").textContent()) === (await col("ID"))[2], await page.locator("#clicked").textContent())
await active().getByRole("button", { name: /^Filter/ }).click()
const pickerFields = await portal().getByRole("button").allTextContents()
check("filter: false on detail (not in picker)", pickerFields.includes("Severity") && !pickerFields.includes("Detail"), pickerFields.join(","))
await page.keyboard.press("Escape")
await page.screenshot({ path: `${prefix}-findings.png` })

await tab("ec2")
const codes = await active().locator("tbody code.ec2-id").count()
check("custom detector + registered type renders (ec2 instance id)", codes === 50, `${codes} code nodes`)
const eh = await active().locator("thead th").allTextContents()
check("acronyms in ec2 headers", eh.includes("Public IP") && eh.includes("Instance ID"), eh.join(","))
await page.screenshot({ path: `${prefix}-ec2.png` })

check("no config issues box on a valid config", (await page.locator('[data-jd="issues"]').count()) === 0)

const desc = JSON.parse(await page.locator("#describe").textContent())
check(
	"describe(): plain JSON of resolved config",
	desc.tables.findings.columns.severity.colors.critical === "red" &&
		desc.tables.dns.columns.ttl.label === "TTL" &&
		desc.tables.ec2.columns.instance_id.type === "instance-id" &&
		desc.tables.findings.columns.risk.computed === true &&
		desc.tables.findings.columns.detail.filter === false &&
		desc.tables.findings.defaultSort.join() === "severity,-cvss" &&
		(desc.issues?.length ?? 0) === 0,
	`keys: ${Object.keys(desc).join(",")}`,
)

// ── Theme, isolation, persistence ─────────────────────────────────────────
await tab("dns")
check("exactly one theme toggle (the navbar's)", (await page.locator('[data-jd="theme-toggle"], [data-jd-site-theme]').count()) === 1)
await page.locator("[data-jd-site-theme]").click()
await page.waitForTimeout(250)
check("dark toggle", (await page.locator("[data-jd-theme]").getAttribute("data-jd-theme")) === "dark")
await page.screenshot({ path: `${prefix}-dark.png` })
await active().getByRole("button", { name: /^Filter/ }).click()
await page.waitForTimeout(200)
await page.screenshot({ path: `${prefix}-dark-popup.png` })
const popBg = await portal().locator('[data-slot="popover-content"]').first().evaluate((el) => getComputedStyle(el).backgroundColor).catch((e) => String(e))
check("popup is dark too (zinc-900 card surface)", popBg === "rgb(24, 24, 27)", popBg)
await page.keyboard.press("Escape")
const pad = await active().locator("tbody td").first().evaluate((el) => getComputedStyle(el).paddingLeft)
check("host CSS does not leak (td padding)", pad === "12px", pad)
check("no horizontal page scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
await page.reload()
await page.waitForSelector("[data-jd-tab]")
await tab("dns")
await page.waitForTimeout(200)
await active().locator('[data-jd-views-trigger="true"]').click()
await page.waitForTimeout(300)
const listed = await portal().getByRole("menuitem", { name: /MX blogs/ }).count()
check("saved view persists after reload", listed > 0)
if (listed) {
	await portal().getByRole("menuitem", { name: /MX blogs/ }).first().click()
	await page.waitForTimeout(200)
	check("selecting saved view restores filters", (await range()) === filteredRange, `${await range()} vs ${filteredRange}`)
}
const p2page = await browser.newPage({ viewport: { width: 1400, height: 900 }, colorScheme: "dark" })
p2page.on("pageerror", (e) => errors.push(String(e)))
await p2page.goto(url)
await p2page.waitForSelector("[data-jd-tab]")
check("follows prefers-color-scheme: dark", (await p2page.locator("[data-jd-theme]").getAttribute("data-jd-theme")) === "dark")
// ── M4: quick filters on the findings tab (two-way with the pills) ──
await page.goto(url)
await page.waitForSelector("[data-jd-tab]")
{
	const qf = page.locator('[data-jd-tabpanel]:not([hidden]) [data-jd="quick-filters"]')
	check("quick filters strip renders (chips, ranges, toggle)", (await qf.locator("[data-jd-chip]").count()) >= 7 && (await qf.locator('[data-jd-range="min"]').count()) === 2)
	await qf.locator('[data-jd-chip="severity=critical"]').click()
	await page.waitForTimeout(150)
	const sevs = await col("Severity")
	check("quick filter chips filter and add a pill", sevs.length > 0 && sevs.every((v) => v === "critical") && (await active().textContent()).includes("is any of"), sevs.length)
	await qf.locator('[data-jd-quick="cvss"] [data-jd-range="min"]').fill("7")
	await page.waitForTimeout(150)
	const cv = await col("CVSS")
	check("quick filter range (min) filters numbers", cv.length > 0 && cv.every((v) => Number(v) >= 7), cv.slice(0, 3).join(","))
	await qf.locator('[data-jd-quick="exploitable"]').click()
	await page.waitForTimeout(150)
	check("quick filter toggle", (await qf.locator('[data-jd-quick="exploitable"]').getAttribute("aria-pressed")) === "true")
	await page.screenshot({ path: `${prefix}-m4-quick-filters.png` })
	// two-way: removing the pills clears the strip
	await active().getByRole("button", { name: /^clear$/i }).first().click()
	await page.waitForTimeout(150)
	check("quick filters sync back when pills are cleared", (await qf.locator('[data-jd-chip="severity=critical"]').getAttribute("aria-pressed")) === "false" && (await qf.locator('[data-jd-quick="cvss"] [data-jd-range="min"]').inputValue()) === "")
}

// No stray scrollbars (classic 12px bars forced on; headless hides them otherwise), light and dark.
for (const scheme of ["light", "dark"]) {
	const sb = await browser.newPage({ viewport: { width: 1400, height: 900 }, colorScheme: scheme })
	for (const u of SCROLL_PAGES) {
		await sb.goto(u)
		await sb.waitForTimeout(700)
		const offs = await scrollOffenders(sb)
		check(`no stray scrollbars: ${u.split("/").pop()} (${scheme})`, offs.length === 0, offs.join(" | "))
		const tall = await rowHeightOffenders(sb)
		check(`compact rows ≤ 30px (data, group, header, nested): ${u.split("/").pop()} (${scheme})`, tall.length === 0, tall.slice(0, 6).join(" | "))
	}
	await sb.close()
}
check("no console errors", errors.length === 0, errors.join(" | "))
await browser.close()
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.info ? `  [${r.info}]` : ""}`)
console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
