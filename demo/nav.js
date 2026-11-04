// Shared top navbar for the jsondeck demo pages. Each page includes it with
// <script src="nav.js"></script> (the root index uses demo/nav.js). Links are
// built relative to this script's own folder, so it works from file:// and
// from the preview server alike. Styles are inline and the bar uses only <a>
// elements, so the demo pages' deliberately hostile host CSS cannot restyle it.
;(function () {
	var src = (document.currentScript && document.currentScript.src) || ""
	var demo = src.slice(0, src.lastIndexOf("/") + 1) // .../demo/
	var root = demo.replace(/demo\/$/, "")

	// One entry per page; `children` are hash routes inside the dashboard.
	var links = [
		{ label: "Home", href: root + "index.html" },
		{
			label: "Dashboard",
			href: demo + "index.html",
			children: [
				{ label: "Overview", hash: "#/overview" },
				{ label: "Inventory", hash: "#/inventory" },
				{ label: "Findings", hash: "#/findings" },
			],
		},
		{ label: "Tables only", href: demo + "tabs.html" },
		{ label: "Charts", href: demo + "viz.html" },
		{ label: "Examples", href: demo + "examples.html" },
		// The docs site is one page; Features is a hash route inside it.
		{ label: "Docs", href: root + "docs/index.html", notHash: "#/features" },
		{ label: "Features", href: root + "docs/index.html#/features", hash: "#/features" },
	]

	// Site-wide theme: apply the stored choice before anything paints.
	var KEY = "jsondeck:theme"
	var html = document.documentElement
	try {
		var stored = localStorage.getItem(KEY)
		if (stored === "dark" || stored === "light") html.setAttribute("data-theme", stored)
	} catch (e) {}
	function effective() {
		var t = html.getAttribute("data-theme")
		if (t === "dark" || t === "light") return t
		if (html.classList.contains("dark")) return "dark"
		return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
	}
	function setTheme(t) {
		// The library's setTheme (when loaded) also updates every deck; same storage key.
		if (window.JsonDeck && window.JsonDeck.setTheme) return window.JsonDeck.setTheme(t)
		html.setAttribute("data-theme", t)
		html.classList.toggle("dark", t === "dark")
		try { localStorage.setItem(KEY, t) } catch (e) {}
	}

	var here = location.href.split("#")[0].replace(/\/$/, "/index.html")
	var c
	// Zinc palette; the bar is a translucent version of the page colour with a backdrop blur.
	function palette() {
		c = effective() === "dark"
			? { bar: "rgba(9,9,11,0.8)", line: "#27272a", ink: "#fafafa", muted: "#a1a1aa", hover: "#27272a" }
			: { bar: "rgba(244,244,245,0.8)", line: "#e4e4e7", ink: "#09090b", muted: "#71717a", hover: "#e4e4e7" }
	}

	var FONT = "font:13px/1 ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;"
	function a(label, href, active, small) {
		var el = document.createElement("a")
		el.textContent = label
		el.href = href
		el.style.cssText =
			"all:unset;cursor:pointer;display:inline-flex;align-items:center;white-space:nowrap;border-radius:6px;" + FONT +
			"font-size:" + (small ? "12px" : "13px") + ";padding:" + (small ? "4px 6px" : "6px 8px") + ";" +
			"color:" + (active ? c.ink : c.muted) + ";font-weight:" + (active ? "500" : "400") + ";"
		el.addEventListener("mouseenter", function () { if (!active) el.style.color = c.ink })
		el.addEventListener("mouseleave", function () { if (!active) el.style.color = c.muted })
		return el
	}
	// Lucide-style 16px icons (stroke = currentColor).
	var ICONS = {
		moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
		sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
		code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
	}
	function iconButton(name, label, href) {
		var el = document.createElement("a")
		el.href = href || "#"
		el.title = label
		el.setAttribute("aria-label", label)
		el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>"
		el.style.cssText = "all:unset;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:6px;color:" + c.ink + ";"
		el.addEventListener("mouseenter", function () { el.style.background = c.hover })
		el.addEventListener("mouseleave", function () { el.style.background = "transparent" })
		el.addEventListener("focus", function () { el.style.boxShadow = "0 0 0 2px " + c.muted })
		el.addEventListener("blur", function () { el.style.boxShadow = "none" })
		return el
	}

	var bar = document.createElement("nav")
	bar.setAttribute("aria-label", "jsondeck demos")
	// Draws (and redraws on a theme change) the bar's contents and colours.
	function render() {
		palette()
		var hash = location.hash
		// Bleed to the page edges by exactly the body margin (pages use 0 or 8px), never past them.
		var bodyStyle = getComputedStyle(document.body)
		bar.style.cssText =
			"all:unset;display:flex;align-items:center;gap:2px;flex-wrap:wrap;position:sticky;top:0;z-index:30;min-height:48px;box-sizing:border-box;" +
			"-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);" +
			"padding:0 16px;margin:-" + bodyStyle.marginTop + " -" + bodyStyle.marginRight + " 12px -" + bodyStyle.marginLeft + ";background:" + c.bar + ";border-bottom:1px solid " + c.line + ";"
		bar.textContent = ""
		var brand = a("jsondeck", root + "index.html", true)
		brand.style.fontWeight = "700"
		brand.style.marginRight = "12px"
		bar.appendChild(brand)
		links.forEach(function (l) {
			if (l.label === "Home") return
			var page = l.href.split("#")[0].replace(/\/$/, "/index.html")
			var onPage = here === page && (l.hash ? hash.indexOf(l.hash) === 0 : !(l.notHash && hash.indexOf(l.notHash) === 0))
			bar.appendChild(a(l.label, l.href, onPage))
			if (l.children && onPage) {
				var sep = document.createElement("span")
				sep.textContent = "/"
				sep.style.cssText = "all:unset;color:" + c.line + ";padding:0 2px;" + FONT
				bar.appendChild(sep)
				l.children.forEach(function (ch, i) {
					var active = hash ? hash === ch.hash : i === 0
					bar.appendChild(a(ch.label, l.href + ch.hash, active, true))
				})
			}
		})
		var spacer = document.createElement("span")
		spacer.style.cssText = "all:unset;flex:1"
		bar.appendChild(spacer)
		bar.appendChild(iconButton("code", "Examples", demo + "examples.html"))
		var dark = effective() === "dark"
		var toggle = iconButton(dark ? "sun" : "moon", dark ? "Switch to light mode" : "Switch to dark mode")
		toggle.setAttribute("role", "button")
		toggle.setAttribute("data-jd-site-theme", dark ? "dark" : "light")
		toggle.addEventListener("click", function (e) {
			e.preventDefault()
			setTheme(effective() === "dark" ? "light" : "dark")
		})
		bar.appendChild(toggle)
	}

	// Keep the dashboard sub-links in step when the page's own nav changes the hash.
	window.addEventListener("hashchange", render)
	// Redraw when the theme changes (this toggle, a deck's toggle, or the OS).
	new MutationObserver(render).observe(html, { attributes: true, attributeFilter: ["data-theme", "class"] })
	if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render)

	var mount = function () {
		render()
		document.body.insertBefore(bar, document.body.firstChild)
	}
	if (document.body) mount()
	else document.addEventListener("DOMContentLoaded", mount)
})()
