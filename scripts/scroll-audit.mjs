// Stray-scrollbar audit. Headless Chrome hides scrollbars, so this forces
// classic 12px scrollbars, then lists every element that would show one it
// should not: overflow-y auto/scroll with scrollHeight > clientHeight
// (strict: a 1px overflow still shows a bar on a Mac set to always show them;
// and the same sideways), minus a short allowlist of real scroll areas.
//   node scripts/scroll-audit.mjs <url> [<url>…]      (exit 1 on offenders)
// Also exported as `scrollOffenders(page)` for verify.mjs / verify-m3.mjs.
import { chromium } from "playwright"

/** Real scroll areas: the capped table box, the drawer body, popups, the code block, the copied-config textarea, the search hit list, and the sticky sidebar / table of contents (taller than a short window). */
const ALLOW = ['[data-jd="drawer-json"]', '[data-jd="table-scroll"]', '[data-jd="drawer-body"]', '[data-jd="portal"] *', '[data-jd="code"]', '[data-jd="config-json"]', '[data-jd="search-hits"]', '[data-jd="toc"]', 'nav[data-jd="pages-nav"]', "#describe", "html", "body"]
const CLASSIC = "::-webkit-scrollbar{width:12px;height:12px;background:#ddd}::-webkit-scrollbar-thumb{background:#999}"

export async function scrollOffenders(page) {
	await page.addStyleTag({ content: CLASSIC })
	await page.waitForTimeout(150)
	return page.evaluate((allow) => {
		const out = []
		const name = (el) => {
			const id = el.getAttribute("data-jd") || el.getAttribute("data-jd-item") || el.getAttribute("data-jd-chart") || ""
			return `${el.tagName.toLowerCase()}${id ? `[${id}]` : ""}.${String(el.className?.baseVal ?? el.className ?? "").split(" ").slice(0, 3).join(".")}`
		}
		for (const el of document.querySelectorAll("*")) {
			if (allow.some((s) => el.matches(s))) continue
			const cs = getComputedStyle(el)
			if (cs.display === "none" || el.offsetParent === null && cs.position !== "fixed") continue
			const y = (cs.overflowY === "auto" || cs.overflowY === "scroll") && el.scrollHeight > el.clientHeight
			const x = (cs.overflowX === "auto" || cs.overflowX === "scroll") && el.scrollWidth > el.clientWidth && !el.closest('[data-jd="tabs"], [data-jd="pages-nav"]')
			// Fixed-height chart boxes clip instead of scrolling: a clipped chart is a failure too.
			if (el.matches('[data-jd="chart-box"]') && el.clientHeight > 0 && el.scrollHeight > el.clientHeight + 1) out.push(`CLIP ${name(el)} ${el.scrollHeight}>${el.clientHeight}`)
			if (y) out.push(`Y ${name(el)} ${el.scrollHeight}>${el.clientHeight}`)
			if (x) out.push(`X ${name(el)} ${el.scrollWidth}>${el.clientWidth}`)
		}
		// Text cut at the viewport edge (e.g. a negative margin or a clipped card): a failure too.
		for (const el of document.querySelectorAll("figcaption, h1, h2, h3, [data-jd=card-title], th")) {
			const r = el.getBoundingClientRect()
			// Content of a sideways scroll area (a wide table) is allowed past the edge.
			let scroller = el.parentElement
			while (scroller && !(/(auto|scroll)/.test(getComputedStyle(scroller).overflowX) && scroller.scrollWidth > scroller.clientWidth)) scroller = scroller.parentElement
			if (scroller) continue
			if (r.width > 0 && r.height > 0 && (r.left < -0.5 || r.right > innerWidth + 0.5)) out.push(`EDGE ${name(el)} left=${Math.round(r.left)} right=${Math.round(r.right)}`)
		}
		return out
	}, ALLOW)
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const b = await chromium.launch({ args: ["--hide-scrollbars=false"] })
	let bad = 0
	for (const url of process.argv.slice(2)) {
		for (const scheme of ["light", "dark"]) {
			const p = await b.newPage({ viewport: { width: 1400, height: 900 }, colorScheme: scheme })
			await p.goto(url)
			await p.waitForTimeout(900)
			const offs = await scrollOffenders(p)
			bad += offs.length
			console.log(`${offs.length ? "FAIL" : "PASS"}  ${url.split("/").slice(-2).join("/")} (${scheme}): ${offs.length} offender(s)${offs.length ? `\n    ${[...new Set(offs)].join("\n    ")}` : ""}`)
			await p.close()
		}
	}
	await b.close()
	process.exit(bad ? 1 : 0)
}
