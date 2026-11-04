// Headless check of the page-layout dashboard (demo/index.html):
//   node scripts/verify-m3.mjs <url-of-demo/index.html> <shot-prefix>
// The default no-pages layout is checked by scripts/verify.mjs on demo/tabs.html.
import { readFileSync } from "node:fs"
import { chromium } from "playwright"
import { rowHeightOffenders } from "./row-heights.mjs"
import { scrollOffenders } from "./scroll-audit.mjs"
import { shadowOffenders } from "./no-shadows.mjs"

const [url, prefix = "shots/m3"] = process.argv.slice(2)
const browser = await chromium.launch({ headless: true, args: ["--hide-scrollbars=false"] })
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, colorScheme: "light", acceptDownloads: true })
const page = await ctx.newPage()
const errors = []
page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
page.on("pageerror", (e) => errors.push(String(e)))
const results = []
const SCROLL_PAGES = ["#/overview", "#/inventory", "#/findings"].map((h) => `${url.split("#")[0]}${h}`)
const check = (name, ok, info = "") => results.push({ name, ok: !!ok, info: String(info).slice(0, 160) })
const item = (id) => page.locator(`[data-jd-item="${id}"]`)
const tableCol = async (id, label) => {
	const t = item(id)
	const heads = (await t.locator("thead th").allTextContents()).map((h) => h.replace(/\d+$/, "").toLowerCase())
	const i = heads.indexOf(label.toLowerCase())
	return t.locator("tbody tr").evaluateAll((trs, i) => trs.map((tr) => tr.children[i]?.textContent ?? ""), i)
}
const range = (id) => item(id).locator('[data-jd="range"]').textContent()
const go = async (id) => {
	await page.locator(`[data-jd-page-link="${id}"]`).click()
	await page.waitForTimeout(250)
}

await page.goto(url)
await page.waitForSelector("[data-jd-page-link]")

// 1. pages + navigation + hash
const links = await page.locator("[data-jd-page-link]").allTextContents()
check("pages: 3 pages in the nav", links.join("|") === "Overview|Inventory|Findings", links.join("|"))
await go("inventory")
check("navigation sets the URL hash", (await page.evaluate(() => location.hash)) === "#/inventory")
check("page content switches", (await item("ec2-table").count()) === 1 && (await item("sev-chart").count()) === 0)
const base = url.split("#")[0]
await page.goto(`${base}#/findings`)
await page.waitForSelector("[data-jd-page-link]")
check("opening #/findings shows that page", (await page.locator('[data-jd-page-link="findings"]').getAttribute("aria-current")) === "page" && (await item("rich-table").count()) === 1)
await page.goto(`${base}#/overview`)
await page.waitForSelector("[data-jd-page-link]")
await page.screenshot({ path: `${prefix}-overview.png`, fullPage: true })

// 2. sections
const pageEl = page.locator("[data-jd-page]")
check("section titles + description", (await pageEl.getByText("Breakdown", { exact: true }).count()) === 1 && (await pageEl.getByText("Click a bar or slice").count()) === 1)
check("collapsed section hides its items", (await item("notes").count()) === 0)
await page.locator('[data-jd="section-toggle"]', { hasText: "Notes" }).click()
check("collapsible section expands (markdown renders)", (await item("notes").locator('[data-jd="markdown"] strong').count()) > 0)

// 3. grid
const cols = async (attr) => page.locator(`[data-jd="grid"][data-jd-columns="${attr}"]`).first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length)
check("grid: columns: 4", (await cols("1,1,1,1")) === 4)
const ratio = await page.locator('[data-jd="grid"][data-jd-columns="2,1"]').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").map(parseFloat))
check("grid: ratios [2, 1]", ratio.length === 2 && Math.abs(ratio[0] / ratio[1] - 2) < 0.1, ratio.join(" "))
check("item height applied", (await item("sev-chart").evaluate((el) => el.getBoundingClientRect().height)) === 260)

// 4. components
const stats = await page.locator('[data-jd="stat-value"]').allTextContents()
check("stat tiles render", stats.length === 4 && stats.every((v) => /\d/.test(v)), stats.join(","))
check("charts render (bar + donut)", (await page.locator('[data-jd-chart="bar"]').count()) === 1 && (await page.locator('[data-jd-chart="donut"]').count()) === 1)
check("facets render counts", (await page.locator("[data-jd-facet]").count()) > 5)
check("table renders with placement overrides (columnOrder, pageSize 25, detail hidden)", (await range("find-table")) === "1–25 of 120" && !(await item("find-table").locator("thead th").allTextContents()).some((h) => h.startsWith("Detail")), await range("find-table"))

const barKeys = await page.locator('[data-jd-chart="bar"] [aria-label]').evaluateAll((els) => els.slice(1).map((e) => e.getAttribute("aria-label")))
check("bar chart follows the column's value order (severity)", barKeys.join(",") === "critical,high,medium,low", barKeys.join(","))

// 5. page filter bar
const openBefore = stats[0]
await page.locator('[data-jd-page-filter="severity"]').selectOption("critical")
await page.waitForTimeout(200)
const sev = await tableCol("find-table", "severity")
const statsAfter = await page.locator('[data-jd="stat-value"]').allTextContents()
check("page filter applies to the table", sev.length > 0 && sev.every((s) => s === "critical"), await range("find-table"))
check("page filter applies to stats and charts", statsAfter[0] !== openBefore && (await page.locator('[data-jd-chart="bar"] [aria-label]').count()) <= 2, `${openBefore} → ${statsAfter[0]}`)
check("page filter skips components without the field (DNS stat)", statsAfter[3] === stats[3], statsAfter[3])
await page.locator('[data-jd-page-filter="severity"]').selectOption("")
await page.waitForTimeout(150)

// 7. chart click filters the table
await page.locator('[data-jd-chart="bar"] [aria-label="high"]').first().click()
await page.waitForTimeout(200)
const sev2 = await tableCol("find-table", "severity")
check("chart bar click filters the table (pill added)", sev2.length > 0 && sev2.every((s) => s === "high") && (await item("find-table").textContent()).includes("is any of"), await range("find-table"))
await page.screenshot({ path: `${prefix}-chart-filter.png`, fullPage: true })
await item("find-table").getByRole("button", { name: /^clear$/i }).first().click()
await page.waitForTimeout(150)

// 4b. facets click filters the table
await page.locator('[data-jd-facet="area=network"]').click()
await page.waitForTimeout(200)
const areas = await tableCol("find-table", "area")
check("facet click filters the table", areas.length > 0 && areas.every((a) => a === "network"), await range("find-table"))
const filteredTotal = Number((await range("find-table")).split(" of ")[1])

// 4c. export CSV / JSON of the filtered rows
await item("find-table").getByRole("button", { name: "Export" }).click()
let dl = page.waitForEvent("download")
await page.locator('[data-jd="portal"]').getByRole("menuitem", { name: /All matching as CSV/ }).click()
let d = await dl
const csvLines = readFileSync(await d.path(), "utf8").trim().split("\n")
check("export CSV of filtered rows", d.suggestedFilename() === "findings.csv" && csvLines.length === filteredTotal + 1, `${d.suggestedFilename()} ${csvLines.length - 1} rows vs ${filteredTotal}`)
await item("find-table").getByRole("button", { name: "Export" }).click()
dl = page.waitForEvent("download")
await page.locator('[data-jd="portal"]').getByRole("menuitem", { name: /All matching as JSON/ }).click()
d = await dl
const json = JSON.parse(readFileSync(await d.path(), "utf8"))
check("export JSON of filtered rows", d.suggestedFilename() === "findings.json" && json.length === filteredTotal && json.every((r) => r.area === "network"), `${json.length} rows`)
await item("find-table").getByRole("button", { name: /^clear$/i }).first().click()
await page.waitForTimeout(150)

// 6. relations + drawer
const relLink = item("find-table").locator('[data-jd-rel="ec2.instance_id"]').first()
const relValue = (await relLink.textContent()).trim()
await relLink.click()
await page.waitForTimeout(200)
check("relation cell opens the related row in the drawer", (await page.locator('[data-jd="drawer-title"]').textContent()) === relValue, relValue)
const relatedTxt = await page.locator('[data-jd="drawer-related"]').textContent().catch(() => "")
check("drawer lists related rows from other tables", /Findings \(\d+\)/.test(relatedTxt) && !/Findings \(0\)/.test(relatedTxt), relatedTxt.slice(0, 80))
await page.screenshot({ path: `${prefix}-drawer.png` })
await page.locator('[data-jd="drawer"]').getByRole("button", { name: "Close" }).click()
await item("find-table").locator("tbody tr[data-jd-row]").first().locator("td").nth(4).click()
await page.waitForTimeout(150)
const fieldsTxt = await page.locator('[data-jd="drawer-fields"]').textContent().catch(() => "")
check("row click opens the drawer with all fields", fieldsTxt.includes("Severity") && fieldsTxt.includes("Detail"), fieldsTxt.slice(0, 60))
await page.keyboard.press("Escape")

// 2b. nested section tabs + per-instance state
await go("inventory")
const tabs = await page.locator("[data-jd-tab]").allTextContents()
check("tabs inside a section", tabs.length === 2 && tabs[0].startsWith("DNS (zero config)"), tabs.join("|"))
await page.locator("[data-jd-tab]").first().focus()
await page.keyboard.press("ArrowRight")
await page.waitForTimeout(100)
const sel = await page.locator("[data-jd-tab]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-selected")))
const focusedTab = await page.evaluate(() => document.activeElement?.getAttribute("data-jd-tab"))
check("segmented tabs: arrow keys move selection and focus (roving tabindex)", sel.join(",") === "false,true" && focusedTab === "ec2", `${sel} ${focusedTab}`)
await page.keyboard.press("ArrowLeft")
check("kv card renders", (await item("ec2-kv").locator('[data-jd="kv"]').count()) === 1)
await page.locator('[data-jd-tabpanel]').nth(1).evaluate(() => {})
await page.locator("[data-jd-tab]").nth(1).click()
check("second tab renders its placement (include override)", (await item("ec2-compact").locator("thead th").count()) === 4)
check("dashboard has no config issues box (bad config moved to tabs.html / examples)", (await page.locator('[data-jd="issues"]').count()) === 0)

// 8. layout editing
await go("overview")
await page.locator('[data-jd="edit-toggle"]').click()
check("edit mode shows item tools", (await page.locator('[data-jd="item-tools"]').count()) >= 8)
const sizeBefore = await item("sev-chart").locator('[data-jd="item-size"]').textContent()
await item("sev-chart").getByRole("button", { name: "Wider" }).click()
const sizeWide = await item("sev-chart").locator('[data-jd="item-size"]').textContent()
const wideCols = await item("sev-chart").evaluate((el) => getComputedStyle(el).gridColumnEnd)
await item("sev-chart").getByRole("button", { name: "Narrower" }).click()
const sizeAfter = await item("sev-chart").locator('[data-jd="item-size"]').textContent()
check("resize span (wider / narrower)", sizeBefore.startsWith("1/2") && sizeWide.startsWith("2/2") && wideCols.includes("2") && sizeAfter.startsWith("1/2"), `${sizeBefore} → ${sizeWide} (${wideCols}) → ${sizeAfter}`)
await item("sev-chart").getByRole("button", { name: "Taller" }).click()
check("resize height", (await item("sev-chart").locator('[data-jd="item-size"]').textContent()).includes("340px"), await item("sev-chart").locator('[data-jd="item-size"]').textContent())
// move: drag the donut chart before the bar chart
await item("state-chart").locator('[data-jd="drag-handle"]').dragTo(item("sev-chart"))
await page.waitForTimeout(150)
const order = await page.locator('[data-jd="grid"][data-jd-columns="2,1"] > [data-jd-item]').evaluateAll((els) => els.map((e) => e.getAttribute("data-jd-item")))
check("drag to move within a section", order.join(",") === "state-chart,sev-chart", order.join(","))
// move between sections: drag the DNS stat into the Breakdown section's drop zone
await item("stat-dns").locator('[data-jd="drag-handle"]').dragTo(page.locator('[data-jd="add-item"][data-jd-section="1"]'))
await page.waitForTimeout(150)
const order2 = await page.locator('[data-jd="grid"][data-jd-columns="2,1"] > [data-jd-item]').evaluateAll((els) => els.map((e) => e.getAttribute("data-jd-item")))
check("drag to move between sections", order2.includes("stat-dns"), order2.join(","))
await item("notes").getByRole("button", { name: "Remove" }).click().catch(() => {})
check("remove an item", (await item("notes").count()) === 0)
await page.locator('[data-jd="add-item"][data-jd-section="1"] [data-jd="add-kind"]').selectOption("markdown")
await page.locator('[data-jd="add-item"][data-jd-section="1"] [data-jd="add-button"]').click()
check("add an item", (await page.locator('[data-jd="grid"][data-jd-columns="2,1"] [data-jd-kind="markdown"]').count()) === 1)
await page.screenshot({ path: `${prefix}-edit.png`, fullPage: true })
await page.locator('[data-jd="copy-config"]').click()
const copied = JSON.parse(await page.locator('[data-jd="config-json"]').inputValue())
check("copy config exports the edited pages JSON", copied[0].sections[1].items.some((i) => i.component === "markdown") && copied[0].sections[1].items[0].id === "state-chart", JSON.stringify(copied[0].sections[1].items.map((i) => i.id)))
await page.reload()
await page.waitForSelector("[data-jd-page-link]")
const order3 = await page.locator('[data-jd="grid"][data-jd-columns="2,1"] > [data-jd-item]').evaluateAll((els) => els.map((e) => e.getAttribute("data-jd-item")))
check("edited layout persists after reload (localStorage)", order3[0] === "state-chart" && order3.includes("stat-dns"), order3.join(","))
await page.locator('[data-jd="edit-toggle"]').click()
await page.locator('[data-jd="reset-layout"]').click()
await page.waitForTimeout(150)
const order4 = await page.locator('[data-jd="grid"][data-jd-columns="2,1"] > [data-jd-item]').evaluateAll((els) => els.map((e) => e.getAttribute("data-jd-item")))
check("reset layout restores the config", order4.join(",") === "sev-chart,state-chart", order4.join(","))
await page.locator('[data-jd="edit-toggle"]').click()

// 3b. narrow screen stacks the grid
await page.setViewportSize({ width: 600, height: 900 })
await page.waitForTimeout(200)
check("narrow screen: grid stacks to one column", (await cols("1,1,1,1")) === 1)
await page.screenshot({ path: `${prefix}-narrow.png`, fullPage: true })
check("narrow screen: no horizontal page scroll", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
await page.setViewportSize({ width: 1400, height: 1000 })

// dark
check("exactly one theme toggle on the dashboard (the navbar's)", (await page.locator('[data-jd="theme-toggle"], [data-jd-site-theme]').count()) === 1)
// Toolbar icon buttons: tooltip with label + key hint, on hover and on keyboard focus.
await item("find-table").getByRole("button", { name: "Columns" }).hover()
await page.waitForTimeout(500)
const tipTxt = await page.locator('[data-jd="tooltip"]').textContent().catch(() => "")
await page.mouse.move(5, 5)
await item("find-table").getByRole("button", { name: "Sort" }).focus()
await page.waitForTimeout(100)
const tipFocus = await page.locator('[data-jd="tooltip"]').textContent().catch(() => "")
check("icon buttons show a tooltip with the key hint (hover and focus)", tipTxt === "ColumnsC" && tipFocus.startsWith("Sort") && tipFocus.endsWith("S"), `${tipTxt} | ${tipFocus}`)
await page.locator("[data-jd-site-theme]").click()
await page.waitForTimeout(250)
await page.screenshot({ path: `${prefix}-dark.png`, fullPage: true })
check("dark mode", (await page.locator("[data-jd-theme]").getAttribute("data-jd-theme")) === "dark")
// ── M4: expand, drill-down, master–detail, grouping, operators, selection, right-click ──
{
	const ctx4 = await browser.newContext({ viewport: { width: 1400, height: 1000 }, permissions: url.startsWith("http") ? ["clipboard-read", "clipboard-write"] : [] })
	const p4 = await ctx4.newPage()
	p4.on("pageerror", (e) => errors.push(String(e)))
	const base4 = url.split("#")[0]
	await p4.goto(`${base4}#/overview`)
	await p4.waitForSelector("[data-jd-page-link]")
	const ft = p4.locator('[data-jd-item="find-table"]')
	check("expand: chevron column", (await ft.locator('[data-jd="expand"]').count()) === 25)
	await ft.locator('[data-jd="expand"]').first().click()
	const fieldsShown = await ft.locator("[data-jd-detail-field]").evaluateAll((els) => els.map((e) => e.getAttribute("data-jd-detail-field")))
	check("expand: detail shows the hidden columns", ["detail", "fix_idea", "break_risk", "first_seen"].every((f) => fieldsShown.includes(f)), fieldsShown.join(","))
	check("drill-down: nested related table with breadcrumb", (await ft.locator('[data-jd="nested"]').count()) === 1 && (await ft.locator('[data-jd="breadcrumb"]').first().textContent()).includes("Instance"))
	await ft.locator('[data-jd="nested"] [data-jd="expand"]').first().click()
	check("drill-down: nested table expands again (recursive)", (await ft.locator('[data-jd="row-detail"][data-jd-depth="1"]').count()) === 1)
	await p4.screenshot({ path: `${prefix}-m4-expanded.png` })
	// Enter on a focused row toggles it
	const row2 = ft.locator("tbody tr[data-jd-row]").nth(2)
	await row2.focus()
	await p4.keyboard.press("Enter")
	check("expand: Enter on the focused row", (await row2.getAttribute("aria-expanded")) === "true")
	await p4.keyboard.press("Enter")
	// In-detail toggle in the Columns menu
	await ft.getByRole("button", { name: "Columns" }).first().click()
	await p4.locator('[data-jd="portal"] [data-jd-detail-toggle="title"]').click()
	await p4.keyboard.press("Escape")
	check("columns menu: In-detail toggle adds a field", (await ft.locator('[data-jd="row-detail"][data-jd-depth="0"] [data-jd-detail-field="title"]').count()) >= 1)
	// collapse the expanded first row again so the row indexes below are plain rows
	await ft.locator('[data-jd="expand"]').first().click()
	// right-click menu
	const cell = ft.locator("tbody tr[data-jd-row]").nth(3).locator("td").nth(3)
	await cell.scrollIntoViewIfNeeded()
	await p4.waitForTimeout(150)
	const cb = await cell.boundingBox()
	await p4.mouse.click(cb.x + 10, cb.y + 5, { button: "right" })
	await p4.waitForTimeout(150)
	const menuTxt = await p4.locator('[data-jd="menu"]').first().textContent().catch(() => "")
	check("right-click menu: copy / filter / exclude / expand", ["Copy cell", "Copy row as", "Filter by this value", "Exclude this value", "Expand"].every((x) => menuTxt.includes(x)), menuTxt.slice(0, 80))
	await p4.screenshot({ path: `${prefix}-m4-context-menu.png` })
	await p4.locator('[data-jd="menu"] [role="menuitem"]', { hasText: "Filter by this value" }).click()
	await p4.waitForTimeout(150)
	check("right-click: Filter by this value adds a pill", (await ft.getByRole("button", { name: /^clear$/i }).count()) >= 1 && (await ft.locator("[data-jd-row]").count()) < 25)
	await ft.getByRole("button", { name: /^clear$/i }).first().click()
	// Shift+F10 on the focused row
	const row3 = ft.locator("tbody tr[data-jd-row]").nth(1)
	await row3.focus()
	await p4.keyboard.press("Shift+F10")
	await p4.waitForTimeout(100)
	check("keyboard: Shift+F10 opens the row menu", (await p4.locator('[data-jd="menu"]').count()) === 1)
	await p4.locator('[data-jd="menu"] [role="menuitem"]', { hasText: "Copy row as" }).hover()
	await p4.waitForTimeout(150)
	await p4.locator('[role="menuitem"]', { hasText: /^JSON$/ }).first().click()
	await p4.waitForTimeout(400)
	const toastTxt = (await p4.locator("[role=status]").allTextContents()).join(" ")
	check("copy row as JSON shows a toast", /Copied 1 row as JSON/.test(toastTxt), toastTxt)
	// master–detail
	await p4.goto(`${base4}#/inventory`)
	await p4.waitForSelector('[data-jd-item="ec2-table"]')
	const before = await p4.locator('[data-jd-item="inv-findings"] [data-jd="range"]').textContent()
	await p4.locator('[data-jd-item="ec2-table"] tbody tr[data-jd-row]').first().locator("td").nth(2).click()
	await p4.waitForTimeout(200)
	const after = await p4.locator('[data-jd-item="inv-findings"] [data-jd="range"]').textContent()
	const chip = await p4.locator('[data-jd-item="inv-findings"] [data-jd="master-chip"]').textContent().catch(() => "")
	check("master–detail: selecting a master row filters the detail (chip)", before.endsWith("of 120") && !after.endsWith("of 120") && chip.startsWith("Filtered by i-"), `${before} → ${after} | ${chip}`)
	await p4.screenshot({ path: `${prefix}-m4-master-detail.png` })
	await p4.locator('[data-jd-item="inv-findings"] [data-jd="master-chip"] button').click()
	await p4.waitForTimeout(150)
	check("master–detail: ✕ clears the master selection", (await p4.locator('[data-jd-item="inv-findings"] [data-jd="range"]').textContent()).endsWith("of 120"))
	// grouping + selection + rowActions + operators on the Findings page
	await p4.goto(`${base4}#/findings`)
	await p4.waitForSelector('[data-jd-item="grouped"]')
	const gt = p4.locator('[data-jd-item="grouped"]')
	const g0 = await gt.locator("[data-jd-group]").first().textContent()
	check("group by: group rows with count and aggregates", (await gt.locator("[data-jd-group]").count()) >= 2 && g0.includes("critical") && (await gt.locator("[data-jd-agg]").count()) >= 2, g0)
	await gt.locator('[data-jd="group-toggle"]').first().click()
	// Collapsed: the line after the first group header is the next group header, not a row.
	check("group by: collapsing a group hides its rows", (await gt.locator('[data-jd="group-toggle"]').first().getAttribute("aria-expanded")) === "false" && (await gt.locator("tbody tr").nth(1).getAttribute("data-jd-group")) !== null)
	await gt.locator('[data-jd="group-toggle"]').first().click()
	await p4.screenshot({ path: `${prefix}-m4-grouped.png`, fullPage: true })
	const rt = p4.locator('[data-jd-item="rich-table"]')
	await rt.locator('[data-jd="select-row"]').nth(0).click()
	await rt.locator('[data-jd="select-row"]').nth(3).click({ modifiers: ["Shift"] })
	check("selection: shift-click range → selection bar", (await rt.locator('[data-jd="selection-bar"]').textContent()).startsWith("4 selected"))
	await rt.locator('[data-jd="copy-selected"]').click()
	await p4.locator('[data-jd="portal"] [role="menuitem"]', { hasText: "CSV" }).click()
	await p4.waitForTimeout(250)
	const clip = url.startsWith("http") ? await p4.evaluate(() => navigator.clipboard.readText()).catch(() => "") : "(file)"
	check("selection: copy 4 rows as CSV (toast; clipboard on http)", /Copied 4 rows as CSV/.test(await p4.locator("[role=status]").first().textContent().catch(() => "")) && (clip === "(file)" || clip.trim().split("\n").length === 5), clip.split("\n").length)
	await rt.locator("tbody tr[data-jd-row]").nth(5).locator("td").nth(4).click({ modifiers: ["Meta"] })
	check("selection: cmd-click toggles a row", (await rt.locator('[data-jd="selection-bar"]').textContent()).startsWith("5 selected"))
	await rt.locator('[data-jd="select-all-matches"]').click()
	check("selection: select all matches", /^\d+ selected/.test(await rt.locator('[data-jd="selection-bar"]').textContent()) && !(await rt.locator('[data-jd="selection-bar"]').textContent()).startsWith("5 "))
	await rt.locator('[data-jd="clear-selection"]').click()
	// operators reachable in the picker: number between, text not contains, date before/after
	const opsFor = async (field) => {
		await rt.getByRole("button", { name: "Filter" }).first().click()
		await p4.locator('[data-jd="portal"]').getByRole("button", { name: field, exact: true }).click()
		const opBtn = p4.locator('[data-jd="portal"]').getByRole("button", { name: /^(is|contains|between|=|is any of)/ }).first()
		await opBtn.click()
		await p4.waitForTimeout(100)
		const txt = await p4.locator('[data-jd="portal"] [role="menu"]').last().textContent().catch(() => "")
		await p4.keyboard.press("Escape")
		await p4.keyboard.press("Escape")
		await p4.waitForTimeout(100)
		return txt
	}
	const numOps = await opsFor("CVSS")
	const textOps = await opsFor("Title")
	const dateOps = await opsFor("First seen")
	check("operators: number has = ≠ > ≥ < ≤ between empty", ["is", "is not", ">", "≥", "<", "≤", "between", "is empty", "is not empty"].every((o) => numOps.includes(o)), numOps)
	check("operators: text has contains / does not contain / starts / ends / empty", ["contains", "does not contain", "starts with", "ends with", "is empty"].every((o) => textOps.includes(o)), textOps)
	check("operators: date has between / before / after", ["between", "before", "after"].every((o) => dateOps.includes(o)), dateOps)
	// custom rowActions in the menu
	const rc = rt.locator("tbody tr[data-jd-row]").nth(0).locator("td").nth(4)
	const rb = await rc.boundingBox()
	await p4.mouse.click(rb.x + 10, rb.y + 5, { button: "right" })
	await p4.locator('[data-jd="menu"] [role="menuitem"]', { hasText: "Show id below the table" }).click()
	check("rowActions: a custom menu item runs", /^F-\d+/.test(await p4.locator("#clicked").textContent()), await p4.locator("#clicked").textContent())
	// Theming example: token overrides, class slots, cellClass, item className, CSS-only data-jd override.
	await p4.goto(url.split("#")[0].replace(/index\.html$/, "examples.html"))
	await p4.waitForSelector("#ex-theming [data-jd-row]")
	const th = p4.locator("#ex-theming")
	const tok = await th.locator('[data-jd="root"]').evaluate((el) => [getComputedStyle(el).getPropertyValue("--jds-primary").trim(), getComputedStyle(el).getPropertyValue("--jds-card").trim()])
	const cardBg = await th.locator('[data-jd-item="ex-th-table"]').evaluate((el) => getComputedStyle(el).backgroundColor)
	const pageBtn = await th.locator('[data-jd-item="ex-th-table"] [aria-current="page"]').evaluate((el) => getComputedStyle(el).backgroundColor).catch(() => "")
	check("theme tokens: config overrides change computed styles", tok[0] === "#2563eb" && tok[1] === "#fffbf5" && cardBg === "rgb(255, 251, 245)" && (pageBtn === "" || pageBtn === "rgb(37, 99, 235)"), `${tok} ${cardBg} ${pageBtn}`)
	const slots = await th.evaluate((root) => ({
		tr: root.querySelectorAll("tr.ex-row").length,
		td: root.querySelectorAll("td.ex-cell").length,
		hot: [...root.querySelectorAll("td.ex-hot")].every((td) => td.getAttribute("data-col-id") === "severity" && td.textContent.includes("critical")) && root.querySelectorAll("td.ex-hot").length > 0,
		itemClass: !!root.querySelector('[data-jd-item="ex-th-chart"].ex-brand-card'),
		cardClass: root.querySelectorAll(".ex-theme-card").length,
	}))
	check("classNames land on rows, cells, cellClass, item className and card slot", slots.tr > 0 && slots.td > 0 && slots.hot && slots.itemClass && slots.cardClass >= 2, JSON.stringify(slots))
	const titleColor = await th.locator('[data-jd="card-title"]').first().evaluate((el) => getComputedStyle(el).color)
	check("CSS-only override via data-jd", titleColor === "rgb(37, 99, 235)", titleColor)
	await th.screenshot({ path: `${prefix}-theming.png` })
	// Facets on a placed table: clicking a value filters that table; expand: { relation } shows only the related rows.
	const fc = p4.locator("#ex-facets")
	const fcBefore = await fc.locator("tbody tr[data-jd-row]").count()
	const facetBtn = fc.locator('[data-jd-facet^="area="]').first()
	const facetVal = (await facetBtn.getAttribute("data-jd-facet")).split("=")[1]
	await facetBtn.click()
	await p4.waitForTimeout(200)
	const fcAreas = await fc.locator('tbody tr[data-jd-row] td[data-col-id="area"]').allTextContents()
	check("facets on a placed table filter it", fcAreas.length > 0 && fcAreas.every((t) => t.includes(facetVal)) && fcBefore >= fcAreas.length, `${facetVal}: ${fcAreas.length}/${fcBefore}`)
	await fc.screenshot({ path: `${prefix}-facets.png` })
	const xr = p4.locator("#ex-expand-relation")
	await xr.locator('[data-jd="expand"]').first().click()
	await p4.waitForTimeout(200)
	const xrInfo = await xr.locator('[data-jd="row-detail"]').first().evaluate((el) => ({ nested: el.querySelectorAll("[data-jd-instance] tbody tr[data-jd-row]").length, fields: el.querySelectorAll("dl").length }))
	check("expand: { relation } shows only the related rows", xrInfo.nested > 0 && xrInfo.fields === 0, JSON.stringify(xrInfo))
	await xr.screenshot({ path: `${prefix}-expand-relation.png` })
	await ctx4.close()
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
// Borders only: no card, tile, block, drawer, tab chip or demo box casts a shadow (light and dark).
{
	const dir = url.split("#")[0].replace(/index\.html$/, "")
	const SHADOW_PAGES = [...SCROLL_PAGES, `${dir}viz.html`, `${dir}examples.html`, `${dir}tabs.html`, `${dir.replace(/demo\/$/, "")}index.html`]
	for (const scheme of ["light", "dark"]) {
		const sp = await browser.newPage({ viewport: { width: 1400, height: 900 }, colorScheme: scheme })
		for (const u of SHADOW_PAGES) {
			await sp.goto(u)
			await sp.waitForTimeout(600)
			// Open a row drawer where there is one, so the drawer is measured too.
			const row = sp.locator("[data-jd-row]").first()
			if (u.includes("#/inventory") && (await row.count())) await row.locator("td").nth(2).click().catch(() => {})
			await sp.waitForTimeout(200)
			const offs = await shadowOffenders(sp)
			check(`no box-shadow on cards/blocks: ${u.split("/").pop()} (${scheme})`, offs.length === 0, offs.slice(0, 4).join(" | "))
		}
		await sp.close()
	}
}
check("no console errors", errors.length === 0, errors.join(" | "))
await browser.close()
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.info ? `  [${r.info}]` : ""}`)
console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`)
process.exit(results.every((r) => r.ok) ? 0 : 1)
