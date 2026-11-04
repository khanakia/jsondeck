/**
 * Entry point: the only place that reads config. `JsonDeck.mount(el, config)`
 * resolves data + config once (core/resolve.ts) and renders the Deck from the
 * resolved spec. `JsonDeck.describe(data, config)` returns that spec as JSON.
 */
import { createRoot, type Root } from "react-dom/client"
import { Deck } from "./components/Deck"
import { Toaster } from "./components/Toast"
import { ExampleShell } from "./components/Example"
import type { CodeLang } from "./core/highlight"
import { DEFAULT_LABELS } from "./core/labels"
import { htmlSnippet } from "./core/serialize"
import { restoreTheme } from "./lib/theme"
import type { JsonDeckConfig } from "./core/config"
import { resolvePages } from "./core/layout"
import { describeDeck, resolveDeck } from "./core/resolve"
import { formatIssue } from "./core/validate"

export type * from "./core/config"
export type { Labels } from "./core/labels"
export type { Issue } from "./core/validate"
export type { ResolvedColumn, ResolvedDeck, ResolvedTable } from "./core/resolve"
/** @deprecated name kept from milestone 1; use JsonDeckConfig. */
export type MountConfig = JsonDeckConfig

export type Mounted = { unmount: () => void; issues: string[] }

function resolveEl(el: Element | string): Element {
	const found = typeof el === "string" ? document.querySelector(el) : el
	if (!found) throw new Error(`JsonDeck.mount: no element matches ${String(el)}`)
	return found
}

/** Data may be inline or a selector of a <script type="application/json"> tag. */
function resolveData(data: JsonDeckConfig["data"]): unknown {
	if (typeof data !== "string") return data ?? {}
	const tag = document.querySelector(data)
	if (!tag) throw new Error(`JsonDeck: no data element matches ${data}`)
	try {
		return JSON.parse(tag.textContent ?? "{}")
	} catch (e) {
		throw new Error(`JsonDeck: ${data} does not hold valid JSON (${(e as Error).message})`)
	}
}

/** Parsed JSON as config data: an object of arrays, a bare array, or nothing usable ({}). */
function toData(v: unknown): JsonDeckConfig["data"] {
	if (Array.isArray(v)) return v
	if (v !== null && typeof v === "object") return Object.fromEntries(Object.entries(v))
	return {}
}

/** Package version (CDN URLs in generated snippets). */
export const version = "0.1.0"

const roots = new WeakMap<Element, Root>()

// A theme chosen earlier (setTheme) applies as soon as the library loads.
restoreTheme()

/** Resolve a config once and build its Deck element (shared by mount and example). */
function buildDeck(config: JsonDeckConfig) {
	const deck = resolveDeck({ ...config, data: toData(resolveData(config.data)) })
	const layout = resolvePages(deck)
	const issues = [...deck.issues, ...layout.issues].map(formatIssue)
	if (issues.length) console.warn(`[jsondeck] ${issues.length} config issue(s):\n  ${issues.join("\n  ")}`)
	return { deck, issues, element: <Deck deck={deck} configs={layout.configs} layoutIssues={layout.issues} /> }
}

/** One toast host for the whole page, created on the first mount. */
let toasterMounted = false
function ensureToaster(): void {
	if (toasterMounted || typeof document === "undefined") return
	toasterMounted = true
	const host = document.createElement("div")
	host.setAttribute("data-jd", "toaster-host")
	document.body.appendChild(host)
	createRoot(host).render(<Toaster />)
}

function rootFor(target: Element): Root {
	ensureToaster()
	roots.get(target)?.unmount()
	const root = createRoot(target)
	roots.set(target, root)
	return root
}

export function mount(el: Element | string, config: JsonDeckConfig): Mounted {
	const target = resolveEl(el)
	const { issues, element } = buildDeck(config)
	const root = rootFor(target)
	root.render(element)
	return {
		issues,
		unmount: () => {
			root.unmount()
			roots.delete(target)
		},
	}
}

export type ExampleOptions = {
	title?: string | undefined
	description?: string | undefined
	/** Mounted in the Preview tab. Without it only the Code tab shows. */
	config?: JsonDeckConfig | undefined
	/** Code tab text. Default: a complete HTML page (CDN tags, trimmed data, mount call) generated from `config`. */
	code?: string | undefined
	lang?: CodeLang | undefined
}

/**
 * A Preview / Code box: the config mounted in Preview, copyable code in Code.
 *
 *   JsonDeck.example("#ex1", { title: "Zero config", config: { data: { hosts } } })
 */
export function example(el: Element | string, opts: ExampleOptions): Mounted {
	const target = resolveEl(el)
	const built = opts.config ? buildDeck(opts.config) : null
	const code = opts.code ?? (opts.config ? htmlSnippet({ ...opts.config, data: toData(resolveData(opts.config.data)) }, { version }) : "")
	const lang: CodeLang = opts.lang ?? (opts.code === undefined ? "html" : "js")
	const root = rootFor(target)
	root.render(<ExampleShell labels={built?.deck.labels ?? DEFAULT_LABELS} title={opts.title} description={opts.description} code={code} lang={lang} preview={built?.element} />)
	return {
		issues: built?.issues ?? [],
		unmount: () => {
			root.unmount()
			roots.delete(target)
		},
	}
}

/**
 * The full resolved config as plain JSON (functions left out), in the same
 * shape as the input config: copy it, edit only what is wrong, pass it back.
 */
export function describe(data: JsonDeckConfig["data"], config: Omit<Partial<JsonDeckConfig>, "data"> = {}): Record<string, unknown> {
	const deck = resolveDeck({ ...config, data: toData(resolveData(data)) })
	const layout = resolvePages(deck)
	const out = describeDeck(deck)
	if (deck.config.pages) out.pages = JSON.parse(JSON.stringify(deck.config.pages))
	const all = [...deck.issues, ...layout.issues]
	if (all.length) out.issues = all.map(formatIssue)
	return out
}

export { BUILTIN_FORMATS } from "./core/formats"
export { DEFAULT_GUESS } from "./core/guess"
export { DEFAULT_ACRONYMS, DEFAULT_LABELS, humanize } from "./core/labels"
export { htmlSnippet, toSource } from "./core/serialize"
export { CLASS_SLOTS, THEME_TOKENS, TOKEN_NAMES, type ClassNames, type ClassSlot, type ThemeTokenName, type ThemeTokens } from "./core/theme-tokens"
export { pageTheme, setTheme, type PageTheme, type ThemeChoice } from "./lib/theme"
export type { CodeLang } from "./core/highlight"


export { defineConfig } from "./core/typed"
export type { AnyData, ColumnName, ColumnRef, Config, RowOf, TypedColumn, TypedItem, TypedPage, TypedSection, TypedTable, TypedTableSettings } from "./core/typed"
