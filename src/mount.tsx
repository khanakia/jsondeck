/**
 * The render path: `mount(el, config)` resolves data + config once
 * (core/resolve.ts) and renders the Deck from the resolved spec; `example`
 * renders a Preview / Code box. This module and what it imports statically is
 * the core every page downloads; the rest of the public API (describe,
 * htmlSnippet, the constants) is in extras.ts, and index.tsx publishes both.
 */
import * as React from "react"
import { createRoot, type Root } from "react-dom/client"
import { Deck } from "./components/Deck"
import type { ExampleShellProps } from "./components/Example"
import type { CodeLang } from "./core/highlight"
import { DEFAULT_LABELS } from "./core/labels"
import { restoreTheme } from "./lib/theme"
import type { JsonDeckConfig } from "./core/config"
import { resolvePages } from "./core/layout"
import { resolveDeck } from "./core/resolve"
import type { RawIssue } from "./core/validate"
import { preloadFor } from "./components/first-paint"
import { preloadCodeView } from "./components/lazy"
import { version } from "./version"

export { version }

/**
 * What mount / example return. `issues` lists the config's problems as
 * sentences; it fills in (and the console warning is printed) a moment after
 * the call, once the sentences have loaded, and `ready` resolves then, after
 * the first render. With a valid config `issues` stays empty.
 */
export type Mounted = { unmount: () => void; issues: string[]; ready: Promise<void> }

/** Resolves when the whole API is usable: at once here; with the <script> loader, once the library has loaded. */
export const ready: Promise<void> = Promise.resolve()

function resolveEl(el: Element | string): Element {
	const found = typeof el === "string" ? document.querySelector(el) : el
	if (!found) throw new Error(`JsonDeck.mount: no element matches ${String(el)}`)
	return found
}

/** Data may be inline or a selector of a <script type="application/json"> tag. */
export function resolveData(data: JsonDeckConfig["data"]): unknown {
	if (typeof data !== "string") return data ?? {}
	const tag = document.querySelector(data)
	if (!tag) throw new Error(`JsonDeck: no data element matches ${data}`)
	try {
		return JSON.parse(tag.textContent ?? "{}")
	} catch (e) {
		throw new Error(`JsonDeck: ${data} does not hold valid JSON (${e instanceof Error ? e.message : String(e)})`)
	}
}

/** Parsed JSON as config data: an object of arrays, a bare array, or nothing usable ({}). */
export function toData(v: unknown): JsonDeckConfig["data"] {
	if (Array.isArray(v)) return v
	if (v !== null && typeof v === "object") return Object.fromEntries(Object.entries(v))
	return {}
}

const roots = new WeakMap<Element, Root>()

// A theme chosen earlier (setTheme) applies as soon as the library loads.
restoreTheme()

/** Resolve a config once and build its Deck element (shared by mount and example). */
function buildDeck(config: JsonDeckConfig) {
	const deck = resolveDeck({ ...config, data: toData(resolveData(config.data)) })
	const layout = resolvePages(deck)
	const raw: RawIssue[] = [...deck.issues, ...layout.issues]
	return { deck, raw, preload: preloadFor(deck, layout), element: <Deck deck={deck} configs={layout.configs} layoutIssues={layout.issues} /> }
}

/**
 * The config's problems as sentences, logged once. The sentences are an
 * on-demand chunk (core/explain.ts): a valid config never loads it.
 */
function explainInto(raw: RawIssue[], out: string[]): Promise<void> {
	if (raw.length === 0) return Promise.resolve()
	return import("./core/explain").then(({ issueLines }) => {
		const lines = issueLines(raw)
		out.push(...lines)
		console.warn(`[jsondeck] ${lines.length} config issue(s):\n  ${lines.join("\n  ")}`)
	})
}

function rootFor(target: Element): Root {
	roots.get(target)?.unmount()
	const root = createRoot(target)
	roots.set(target, root)
	return root
}

/**
 * Render once the parts this deck shows on its first paint have loaded (a
 * stored default view, pinned columns, the sidebar: see core/needs.ts), so
 * nothing jumps when they arrive. Usually there are none and it renders now.
 */
function renderWhenReady(root: Root, element: React.ReactNode, preload: Promise<unknown> | null, isLive: () => boolean): Promise<void> {
	if (!preload) {
		root.render(element)
		return Promise.resolve()
	}
	const go = () => {
		if (isLive()) root.render(element)
	}
	return preload.then(go, (e: unknown) => {
		// A part failed to load: render anyway (that part falls back to loading on use).
		console.error("[jsondeck] could not load a part of the page:", e)
		go()
	})
}

/** Render (after the first-paint parts) and return the handle; `issues` and `ready` fill in as described on Mounted. */
function show(target: Element, element: React.ReactNode, preload: Promise<unknown> | null, raw: RawIssue[]): Mounted {
	const root = rootFor(target)
	let live = true
	const rendered = renderWhenReady(root, element, preload, () => live && roots.get(target) === root)
	const issues: string[] = []
	const ready = Promise.all([rendered, explainInto(raw, issues)]).then(() => undefined)
	return {
		issues,
		ready,
		unmount: () => {
			if (!live) return
			live = false
			root.unmount()
			if (roots.get(target) === root) roots.delete(target)
		},
	}
}

export function mount(el: Element | string, config: JsonDeckConfig): Mounted {
	const { raw, element, preload } = buildDeck(config)
	return show(resolveEl(el), element, preload, raw)
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

/** The Preview / Code shell with the snippet writer, an on-demand chunk. */
const ExampleShell = React.lazy(() => import("./components/Example").then((m) => ({ default: m.ExampleShell })))

/**
 * A Preview / Code box: the config mounted in Preview, copyable code in Code.
 *
 *   JsonDeck.example("#ex1", { title: "Zero config", config: { data: { hosts } } })
 */
export function example(el: Element | string, opts: ExampleOptions): Mounted {
	const target = resolveEl(el)
	const built = opts.config ? buildDeck(opts.config) : null
	const props: ExampleShellProps = {
		labels: built?.deck.labels ?? DEFAULT_LABELS,
		title: opts.title,
		description: opts.description,
		code: opts.code,
		config: opts.config ? { ...opts.config, data: toData(resolveData(opts.config.data)) } : undefined,
		lang: opts.lang ?? (opts.code === undefined ? "html" : "js"),
		preview: built?.element,
	}
	// The Code tab's highlighter loads in parallel with the shell, not after it.
	preloadCodeView()
	const element = (
		<React.Suspense fallback={null}>
			<ExampleShell {...props} />
		</React.Suspense>
	)
	return show(target, element, built?.preload ?? null, built?.raw ?? [])
}
