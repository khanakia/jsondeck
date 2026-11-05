/**
 * dist/jsondeck.js: the classic <script> entry. A few kB with no React in it;
 * it loads the real library (dist/chunks/index.js, an ES module) with
 * `import()`, from next to itself, and every further part of the page
 * (charts, menus, the calendar, ...) loads the same way when first used.
 *
 * Our chunks hold only our own code. Every third-party library (React, React
 * DOM, Base UI, react-day-picker, ...) comes from a public CDN at the exact
 * version jsondeck was built with: the loader first adds an import map
 * (src/externals/map.gen.ts) that points each bare specifier ("react",
 * "@base-ui/react/menu", ...) at one pinned file, so every module on the page,
 * ours and the libraries', gets the same single React. React comes with the
 * first render; Base UI only when a menu or popover is first used; the
 * calendar libraries only when a date filter opens.
 *
 * If the page defines its own import map, its entries win: the loader adds
 * only the specifiers the page does not map (for example, a page that maps
 * "react" and "react-dom" keeps its own React, and jsondeck uses it). A page
 * with its own map needs a browser that accepts more than one import map, or
 * must map every specifier in src/externals/map.gen.ts itself.
 *
 *   <script src=".../dist/jsondeck.js"></script>
 *   <script>JsonDeck.mount("#app", { data })</script>
 *
 * It also links dist/jsondeck.css when the page does not link it already.
 *
 * The mount call above runs before the library has arrived, so the loader
 * keeps the API usable at once:
 *  - `mount` and `example` are queued and return their handle straight away
 *    (`issues` fills in once mounted; `unmount` works before or after;
 *    `ready` resolves when it has rendered);
 *  - `setTheme`, `pageTheme`, `defineConfig` and `version` work right away;
 *  - everything else (`describe`, `htmlSnippet`, `THEME_TOKENS`, ...) is there
 *    once `await JsonDeck.ready` resolves, and throws a clear error before.
 *    Reading `JsonDeck.ready` is what fetches that part (its own chunk), so a
 *    page that only mounts never downloads it.
 *
 * Pages opened from file:// cannot load modules (browsers block it), so the
 * loader shows a message pointing at jsondeck.full.js, the single offline file
 * with everything bundled. Any other load failure is reported in the console.
 */
import { defineConfig } from "./core/typed"
import { IMPORT_MAP } from "./externals/map.gen"
import { FILES as REACT_FILES } from "./externals/react.gen"
import { OWN_ATTR, pageMappedSpecifiers, preloadExternals } from "./lib/importmap"
import { pageTheme, restoreTheme, setTheme } from "./lib/theme-dom"
import { version } from "./version"

/** What dist/chunks/index.js exports (src/split.ts). */
type Api = typeof import("./split")
type Extras = typeof import("./extras")
type MountConfig = Parameters<Api["mount"]>[1]
type ExampleOptions = Parameters<Api["example"]>[1]
/** What mount / example return from the loader: the real handle's fields, filled in once rendered. */
export type Handle = { issues: string[]; unmount: () => void; ready: Promise<void> }

/** Where this file was loaded from. Read while the script runs: `currentScript` is null afterwards. */
function ownUrl(): string {
	const current = document.currentScript
	if (current instanceof HTMLScriptElement && current.src) return current.src
	// Loaded some other way (async injection, a bundler): fall back to the last script that looks like us.
	const tags = Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).filter((s) => /jsondeck(\.min)?\.js(\?|#|$)/.test(s.src))
	return tags[tags.length - 1]?.src ?? document.baseURI
}

const base = new URL(".", ownUrl())
const entry = new URL("chunks/index.js", base).href
const FULL_HINT = "Pages opened from file:// cannot load the split build (browsers block module loading there); use jsondeck.full.js instead, the single file with everything in it."

// A theme chosen earlier applies now, before the library arrives (no flash of the wrong theme).
restoreTheme()

/**
 * One tag is enough: link jsondeck.css from next to this file unless the page
 * already has it (a `<link>` to jsondeck.css, or the single file's injected
 * `<style data-jsondeck>`). It loads in parallel with the library, which
 * renders nothing before it arrives anyway.
 */
function ensureCss(): void {
	if (document.querySelector("style[data-jsondeck], link[data-jsondeck]")) return
	for (const l of Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]'))) if (/(^|\/)jsondeck(\.min)?\.css(\?|#|$)/.test(l.getAttribute("href") ?? "")) return
	const link = document.createElement("link")
	link.rel = "stylesheet"
	link.href = new URL("jsondeck.css", base).href
	link.setAttribute("data-jsondeck", "")
	;(document.head ?? document.documentElement).appendChild(link)
}
ensureCss()

/**
 * Add the import map for the CDN libraries. It must be in the document before
 * the first module loads, which is why the classic loader does it, before its
 * own `import()`. Only specifiers the page does not map itself are added.
 */
function installImportMap(): void {
	if (document.querySelector(`script[type="importmap"][${OWN_ATTR}]`)) return // a second copy of the loader
	const page = pageMappedSpecifiers()
	const imports: Record<string, string> = {}
	for (const [spec, url] of Object.entries(IMPORT_MAP)) if (!page.has(spec)) imports[spec] = url
	if (Object.keys(imports).length === 0) return
	const el = document.createElement("script")
	el.type = "importmap"
	el.setAttribute(OWN_ATTR, "")
	el.textContent = JSON.stringify({ imports })
	;(document.head ?? document.documentElement).appendChild(el)
}

/** Fetch the core, its static dependencies and React from the CDN in parallel (else each import is one more round trip). */
function preloadCore(): void {
	preloadExternals(REACT_FILES)
	for (const path of __JSONDECK_PRELOAD__) {
		const href = new URL(path, base).href
		if (document.querySelector(`link[rel="modulepreload"][href="${href}"]`)) continue
		const link = document.createElement("link")
		link.rel = "modulepreload"
		link.href = href
		document.head.appendChild(link)
	}
}

function loadCore(): Promise<Api> {
	if (base.protocol === "file:") return Promise.reject(new Error(`jsondeck: ${FULL_HINT}`))
	installImportMap()
	preloadCore()
	// The URL is only known at run time; a static string would make bundlers of this file try to resolve it.
	return import(/* @vite-ignore */ entry).then((m: Api) => m)
}

/** Shown inside the mount element on file://, where the split build cannot load (other failures go to the console only). */
function showError(el: Element | string, err: unknown): void {
	if (base.protocol !== "file:") return
	const target = typeof el === "string" ? document.querySelector(el) : el
	if (!target) return
	const box = document.createElement("div")
	box.setAttribute("data-jd", "load-error")
	box.setAttribute("role", "alert")
	box.style.cssText = "font:13px/1.4 system-ui,sans-serif;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px 10px"
	box.textContent = err instanceof Error ? err.message : `jsondeck: could not load (${String(err)})`
	target.replaceChildren(box)
}

const core = loadCore()
core.catch((err: unknown) => {
	console.error(err instanceof Error ? err.message : err, `\n(loader: ${entry})`)
})

/** A mount / example call made through the loader: runs once the core is there. */
function queued(run: (api: Api) => Handle, el: Element | string): Handle {
	let real: { unmount: () => void } | null = null
	let cancelled = false
	const issues: string[] = []
	const ready = core.then(
		(api) => {
			if (cancelled) return
			const m = run(api)
			real = m
			// The real handle's issues fill in when its own `ready` resolves.
			return m.ready.then(() => {
				issues.push(...m.issues)
			})
		},
		(err: unknown) => {
			showError(el, err)
			throw err
		},
	)
	// The handle's own promise must not report an unhandled rejection twice (the console already has it).
	ready.catch(() => undefined)
	return {
		issues,
		ready,
		unmount: () => {
			cancelled = true
			real?.unmount()
		},
	}
}

function notYet(name: string): never {
	throw new Error(`JsonDeck.${name}: jsondeck is still loading. Call it after \`await JsonDeck.ready\` (or load jsondeck.full.js, which has everything at once).`)
}

/** Names the core adds when it arrives; reading one earlier throws the "still loading" error. */
const LATER = ["describe", "htmlSnippet", "toSource", "humanize", "BUILTIN_FORMATS", "DEFAULT_GUESS", "DEFAULT_ACRONYMS", "DEFAULT_LABELS", "CLASS_SLOTS", "THEME_TOKENS", "TOKEN_NAMES"] as const

const api: Record<string, unknown> = {
	version,
	setTheme,
	pageTheme,
	defineConfig,
	mount: (el: Element | string, config: MountConfig): Handle => queued((a) => a.mount(el, config), el),
	example: (el: Element | string, opts: ExampleOptions): Handle => queued((a) => a.example(el, opts), el),
}
for (const name of LATER) Object.defineProperty(api, name, { configurable: true, enumerable: true, get: () => notYet(name) })

/** Point each name at the real thing (mount / example keep returning handles with `ready`). */
function adopt(mod: Api | Extras): void {
	for (const [name, value] of Object.entries(mod)) {
		if (name === "version" || name === "ready" || name === "loadExtras") continue
		Object.defineProperty(api, name, { configurable: true, enumerable: true, writable: true, value })
	}
}
core.then(adopt, () => undefined)

/**
 * `JsonDeck.ready`: resolves once the whole API is there, rejects if it could
 * not load (already reported in the console, so not again as "unhandled").
 * Created on first read, which is what fetches the extras chunk.
 */
let whole: Promise<void> | null = null
Object.defineProperty(api, "ready", {
	configurable: true,
	enumerable: true,
	get: (): Promise<void> => {
		if (!whole) {
			whole = core.then((a) => a.loadExtras()).then(adopt)
			whole.catch((err: unknown) => console.error(err instanceof Error ? err.message : err))
		}
		return whole
	},
})

export default api
