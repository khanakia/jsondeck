// Borders-only guard: blocks separate from the page by a 1px border, never a
// shadow. Every card-like element (placed items, stat and kv tiles, code views,
// nested-table cards, the drawer, active tab chips, pinned cells, and the demo
// pages' own boxes) must compute box-shadow "none". Floating layers (popups,
// menus, tooltips, toasts, dialogs) are exempt: a faint shadow is what makes
// them read as floating. Used by verify-m3.mjs.
export async function shadowOffenders(page) {
	return page.evaluate(() => {
		const sel = [
			'[data-jd="item"]', '[data-jd="kv"]', '[data-jd="stat"]', '[data-jd="codeview"]', '[data-jd="drawer"]',
			'[data-jd="relations"]', "[data-chart-index]", '[data-jd="row-detail"] .jd\\:bg-card', '[data-jd-slot="tabs"] *',
			'[data-jd="page-nav"] *', "td", "th", ".jd-root .jd\\:bg-card", ".card", ".ex-box", "section",
		].join(",")
		const floating = '[role="menu"],[role="dialog"],[role="tooltip"],[role="listbox"],[data-jd="menu"],[data-jd="toast"],[data-floating]'
		const out = []
		for (const el of document.querySelectorAll(sel)) {
			if (el.closest(floating) || el.offsetParent === null) continue
			const cs = getComputedStyle(el)
			if (cs.position === "fixed" && !el.matches('[data-jd="drawer"]')) continue
			const bs = cs.boxShadow
			// Inset bars (e.g. a host's left severity stripe) are markers, not shadows around a border.
			if (bs !== "none" && !bs.includes("inset")) {
				out.push(`${el.tagName.toLowerCase()}${el.getAttribute("data-jd") ? `[data-jd=${el.getAttribute("data-jd")}]` : ""}.${String(el.className).slice(0, 40)}: ${bs.slice(0, 50)}`)
			}
		}
		return [...new Set(out)]
	})
}
