/**
 * The <script> build loads every third-party library (React, Base UI,
 * react-day-picker, ...) from a public CDN through an import map (see
 * src/externals/ and the loader). These helpers are shared by the loader and
 * by the on-demand parts that preload their CDN files.
 *
 * A host page may define its own import map (for example to use its own
 * React). Its entries always win: the loader only adds the specifiers the
 * page does not map, and nothing here preloads a file of a package the page
 * maps itself, so the page never downloads a second, unused copy.
 */

/** Marks the import map and preload links jsondeck adds, so they are never taken for the page's own. */
export const OWN_ATTR = "data-jsondeck"

/** npm package of a bare specifier ("@base-ui/react/menu" -> "@base-ui/react", "react/jsx-runtime" -> "react"). */
export function packageOfSpecifier(spec: string): string {
	const parts = spec.split("/")
	return spec.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? spec)
}

/** npm package of a CDN file URL (".../npm:@base-ui/react@1.9.0/x.mjs" or ".../npm/reselect@5.3.0/+esm"), or null. */
export function packageOfUrl(url: string): string | null {
	const m = /\/npm[:/]((?:@[^/@]+\/)?[^/@]+)@/.exec(url)
	return m?.[1] ?? null
}

/** Top-level "imports" keys of the import maps the host page defined itself (never jsondeck's own). */
export function pageMappedSpecifiers(): Set<string> {
	const keys = new Set<string>()
	for (const el of Array.from(document.querySelectorAll(`script[type="importmap"]:not([${OWN_ATTR}])`))) {
		let parsed: unknown
		try {
			parsed = JSON.parse(el.textContent ?? "")
		} catch {
			continue // An invalid map is the browser's to report; it maps nothing.
		}
		if (typeof parsed !== "object" || parsed === null || !("imports" in parsed)) continue
		const imports = parsed.imports
		if (typeof imports === "object" && imports !== null) for (const k of Object.keys(imports)) keys.add(k)
	}
	return keys
}

/**
 * Start fetching CDN module files in parallel (`<link rel="modulepreload">`),
 * so a part's whole dependency tree arrives in one round trip instead of one
 * per import level. Skips files of packages the host page maps itself, and
 * files already preloaded.
 */
export function preloadExternals(urls: readonly string[]): void {
	const skip = new Set(Array.from(pageMappedSpecifiers(), packageOfSpecifier))
	// Only React DOM imports the scheduler: with the page's own React DOM, ours is never used.
	if (skip.has("react-dom")) skip.add("scheduler")
	const have = new Set(Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="modulepreload"]'), (l) => l.href))
	for (const url of urls) {
		const pkg = packageOfUrl(url)
		if ((pkg && skip.has(pkg)) || have.has(url)) continue
		const link = document.createElement("link")
		link.rel = "modulepreload"
		link.href = url
		link.setAttribute(OWN_ATTR, "")
		document.head.appendChild(link)
	}
}

/**
 * Base UI's ES module files (served as published by the CDN) guard their
 * development-only code with `process.env.NODE_ENV`, which does not exist in a
 * browser, so loading them throws "process is not defined". Bundlers replace
 * that expression at build time; from a CDN nothing does. So, just before
 * Base UI first loads, define a minimal `process` holding only
 * `env.NODE_ENV = "production"`, and only when the page has no `process` of
 * its own (a page that defines one keeps it). React itself only checks
 * `typeof process.emit`, which stays undefined.
 */
export function ensureProcessEnv(): void {
	if ("process" in globalThis) return
	Object.defineProperty(globalThis, "process", { configurable: true, writable: true, value: { env: { NODE_ENV: "production" } } })
}
