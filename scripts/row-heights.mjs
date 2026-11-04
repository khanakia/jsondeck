// Compact-density guard: in tables with data-jd-density="compact", no data
// row, group row or header row may be taller than 30px (28px + 1px borders).
// Expands the first expandable row of each top-level table first, so nested
// tables are measured too. A row is exempt only when one of its wrap: true
// cells really runs onto several lines (wrapping is the point there).
// Used by verify.mjs, verify-m3.mjs and verify-docs.mjs.
/** 28px rows plus up to 1px border either side. */
export const MAX_COMPACT_ROW = 30

export async function rowHeightOffenders(page) {
	await page.evaluate(() => {
		for (const t of document.querySelectorAll('[data-jd-density="compact"]:not([data-jd-compact])')) {
			const btn = t.querySelector('[data-jd="expand"]')
			if (btn && btn.closest("[data-jd-instance]") === t && !t.querySelector('[data-jd="row-detail"]')) btn.click()
		}
	})
	await page.waitForTimeout(250)
	return page.evaluate((max) => {
		const out = []
		for (const t of document.querySelectorAll('[data-jd-density="compact"]')) {
			const id = t.getAttribute("data-jd-instance")
			const own = (sel) => [...t.querySelectorAll(sel)].filter((el) => el.closest("[data-jd-instance]") === t && el.offsetParent !== null)
			// Lines of text in a cell: distinct line boxes of its text.
			const lines = (td) => {
				const r = document.createRange()
				r.selectNodeContents(td)
				return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size
			}
			for (const tr of own("tbody tr[data-jd-row], tbody tr[data-jd-group], thead tr")) {
				if ([...tr.querySelectorAll("td[data-jd-wrap]")].some((td) => lines(td) > 1)) continue
				const h = tr.getBoundingClientRect().height
				if (h > max) out.push(`${id}: ${tr.hasAttribute("data-jd-group") ? "group" : tr.closest("thead") ? "header" : "row"} ${Math.round(h)}px`)
			}
		}
		return out
	}, MAX_COMPACT_ROW)
}
