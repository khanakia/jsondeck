/**
 * The dashboard shell: config issues, page navigation (tabs or sidebar, page
 * in the URL hash), theme toggle, the layout editor toolbar, the row drawer and
 * the page "bus" that lets charts and facets filter tables. It renders a list
 * of placed components; the no-`pages` default is one page with a tab per table.
 */
import { Search } from "lucide-react"
import * as React from "react"
import { LabelsContext } from "@/lib/labels"
import { ClassNamesContext } from "@/lib/classnames"
import { NestedContext } from "@/lib/nested"
import { tokenStyle } from "../core/theme-tokens"
import { PortalContainerContext } from "@/lib/portal"
import { deferred, preload } from "@/components/ui/deferred"
import { setTheme, usePageTheme, useSystemTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { PageConfig, PageItem, Row } from "../core/config"
import { plainPage, type ResolvedSection, resolvePage, restorePage, slug, withItemIds } from "../core/layout"
import type { RelationIndex } from "../core/relations"
import type { SearchHit } from "../core/search"
import type { ResolvedDeck } from "../core/resolve"
import { type RawIssue, sameIssue } from "../core/validate"
import type { TableApi } from "../sdt/ClientDataTable"
import type { RenderCtx } from "./cells"
import { PageContext, type PageCtx } from "./Items"
import { SegmentedTabs } from "./Tabs"
import { ToolbarLabelsContext } from "./Tip"
import { type LayoutOps, PageView } from "./Page"
import { deckButtonsPart, relationsPart, sidebarPart } from "./parts"
import { DeckEditTools, IssuesBox, OnDemand, preloadSearchWhenIdle, RowDrawer, SearchDialog } from "./lazy"
import type { DrawerTarget } from "./RowDrawer"
import type { SearchSource } from "./SearchDialog"

/** No relations configured: every lookup is empty (and the relations chunk is never fetched). */
const NO_RELATIONS: RelationIndex = { lookup: () => [], counts: () => [], find: () => [], linksFrom: () => [], invalid: [] }

/** The deck's relation index, built with the loaded relations module. */
function relationIndexOf(m: typeof import("../core/relations"), deck: ResolvedDeck): RelationIndex {
	return m.buildRelations(
		Object.fromEntries(deck.tables.map((t) => [t.name, t.rows])),
		deck.relations.map((r) => ({ from: r.from, to: r.to, ...(r.label ? { label: r.label } : {}), ...(r.reverseLabel ? { reverseLabel: r.reverseLabel } : {}) })),
	)
}

/** Layout edit functions (core/layout-edit.ts), an on-demand chunk shared with the editor tools; loaded when edit mode is switched on. */
const layoutEdits = deferred(() => import("../core/layout-edit"))

const LAYOUT_KEY = (pageId: string) => `jsondeck:layout:${pageId}`

/** localStorage can throw (file://, private mode); layout saving then just does nothing. */
function storageGet(key: string): unknown {
	try {
		const raw = window.localStorage.getItem(key)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}
function storageSet(key: string, value: unknown | null): void {
	try {
		if (value === null) window.localStorage.removeItem(key)
		else window.localStorage.setItem(key, JSON.stringify(value))
	} catch {
		// Storage unavailable: the edit still applies for this session.
	}
}

/** `#/<page>` or `#/<page>/<heading anchor>` → { page, anchor }. */
function hashRoute(): { page: string | null; anchor: string | null } {
	const m = typeof window !== "undefined" ? window.location.hash.match(/^#\/([^/?]+)(?:\/([^?]+))?/) : null
	return { page: m?.[1] ? decodeURIComponent(m[1]) : null, anchor: m?.[2] ? decodeURIComponent(m[2]) : null }
}
const hashPage = () => hashRoute().page

/** Typing in a field: page-level single-key shortcuts stay out of the way. */
const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

export function Deck({ deck, configs, layoutIssues }: { deck: ResolvedDeck; configs: PageConfig[]; layoutIssues: RawIssue[] }) {
	const L = deck.labels
	// One theme for the page: "inherit" follows <html data-theme>, "auto" the OS, light/dark pin this deck.
	const pageThemeNow = usePageTheme()
	const system = useSystemTheme()
	const [override, setOverride] = React.useState(deck.theme)
	const dark = override === "inherit" ? pageThemeNow === "dark" : override === "auto" ? system === "dark" : override === "dark"
	const [portal, setPortal] = React.useState<HTMLDivElement | null>(null)

	// Page configs: originals with explicit item ids, replaced by a saved layout when one exists.
	const originals = React.useMemo(() => configs.map((c, i) => withItemIds(c, typeof c.id === "string" ? c.id : slug(c.title ?? `page-${i + 1}`))), [configs])
	const ids = originals.map((c, i) => (typeof c.id === "string" ? c.id : slug(c.title ?? `page-${i + 1}`)))
	const editable = deck.config.editable ?? deck.config.pages !== undefined
	const [pageCfgs, setPageCfgs] = React.useState<PageConfig[]>(() =>
		originals.map((c, i) => (editable ? restorePage(c, storageGet(LAYOUT_KEY(ids[i] ?? ""))) : null) ?? c),
	)
	const resolved = React.useMemo(() => {
		const issues: RawIssue[] = []
		const pages = pageCfgs.map((c, i) => resolvePage(deck, { ...c, id: ids[i] }, i, issues))
		return { pages, issues }
		// ids derive from originals; pageCfgs and deck are the real inputs.
	}, [deck, pageCfgs, ids.join("|")])

	const [current, setCurrent] = React.useState(() => {
		const h = hashPage()
		return h && ids.includes(h) ? h : (ids[0] ?? "")
	})
	// Heading anchor from the hash (`#/page/anchor`); bumped on every visit so the same link scrolls again.
	const [anchor, setAnchor] = React.useState<{ id: string | null; n: number }>(() => ({ id: hashRoute().anchor, n: 0 }))
	React.useEffect(() => {
		const on = () => {
			const h = hashRoute()
			if (h.page && ids.includes(h.page)) {
				setCurrent(h.page)
				setAnchor((a) => ({ id: h.anchor, n: a.n + 1 }))
			}
		}
		window.addEventListener("hashchange", on)
		return () => window.removeEventListener("hashchange", on)
	}, [ids.join("|")])
	const go = (id: string, toAnchor?: string) => {
		setCurrent(id)
		setAnchor((a) => ({ id: toAnchor ?? null, n: a.n + 1 }))
		if (ids.length > 1 || toAnchor) window.location.hash = `/${encodeURIComponent(id)}${toAnchor ? `/${toAnchor}` : ""}`
	}
	// Scroll to the anchored heading once the page has rendered; without an anchor, a page switch starts at the top of the deck.
	const rootRef = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		if (anchor.n === 0 && !anchor.id) return
		let tries = 0
		let raf = 0
		const run = () => {
			const el = anchor.id ? document.getElementById(`${current}--${anchor.id}`) : null
			if (el) el.scrollIntoView({ block: "start" })
			else if (anchor.id && tries++ < 10) raf = requestAnimationFrame(run)
			else if (!anchor.id && rootRef.current && rootRef.current.getBoundingClientRect().top < 0) rootRef.current.scrollIntoView({ block: "start" })
		}
		raf = requestAnimationFrame(run)
		return () => cancelAnimationFrame(raf)
	}, [current, anchor])

	const [edit, setEdit] = React.useState(false)
	const [copied, setCopied] = React.useState<string | null>(null)
	const pageIndex = Math.max(0, ids.indexOf(current))
	const page = resolved.pages[pageIndex]

	const applyEdit = React.useCallback(
		(fn: (p: PageConfig) => PageConfig) => {
			setPageCfgs((all) =>
				all.map((p, i) => {
					if (i !== pageIndex) return p
					const next = fn(p)
					storageSet(LAYOUT_KEY(ids[i] ?? ""), plainPage(next))
					return next
				}),
			)
		},
		[pageIndex, ids.join("|")],
	)
	const edits = layoutEdits.use()
	React.useEffect(() => {
		if (edit) preload(layoutEdits)
	}, [edit])
	const ops = React.useMemo<LayoutOps>(() => {
		// Loaded when edit mode turns on, so in practice an edit applies at once; a very early one waits for the chunk.
		const withEdits = (fn: (e: NonNullable<typeof edits>) => void) => (edits ? fn(edits) : void layoutEdits.load().then(fn, () => undefined))
		return {
			move: (id, path, index) => withEdits((e) => applyEdit((p) => e.moveItem(p, id, path, index))),
			update: (id, patch) => withEdits((e) => applyEdit((p) => e.updateItem(p, id, patch))),
			remove: (id) => withEdits((e) => applyEdit((p) => e.removeItem(p, id))),
			add: (path, item: PageItem) => withEdits((e) => applyEdit((p) => e.addItem(p, path, item))),
		}
	}, [applyEdit, edits])
	const resetLayout = () => {
		storageSet(LAYOUT_KEY(ids[pageIndex] ?? ""), null)
		setPageCfgs((all) => all.map((p, i) => (i === pageIndex ? (originals[i] ?? p) : p)))
	}
	const copyConfig = () => {
		const json = JSON.stringify(pageCfgs.map(plainPage), null, 2)
		setCopied(json)
		navigator.clipboard?.writeText(json).catch(() => {
			// file:// or no permission: the JSON is shown in the panel to copy by hand.
		})
	}

	// Row drawer + relations. The relation index (core/relations.ts) is an on-demand chunk, fetched right
	// after the first render when the config has relations; nothing on the first paint needs it (link cells
	// come from the resolved columns), only a click on a link, the drawer and expanded rows.
	const hasRelations = deck.relations.length > 0
	const relMod = relationsPart.use()
	React.useEffect(() => {
		if (hasRelations) preload(relationsPart)
	}, [hasRelations])
	const relIndex = React.useMemo(() => (hasRelations && relMod ? relationIndexOf(relMod, deck) : NO_RELATIONS), [deck, hasRelations, relMod])
	const [drawer, setDrawer] = React.useState<DrawerTarget | null>(null)
	const renderCtx = React.useMemo<RenderCtx>(
		() => ({
			types: deck.types,
			renderers: deck.renderers,
			formats: deck.formats,
			statusColors: deck.statusColors,
			badgeClass: deck.classNames.badge,
			onRelation: (table, field, value) => {
				const open = (idx: RelationIndex) => {
					const row = idx.find(table, field, value)[0]
					if (row) setDrawer({ table, row })
				}
				// A click in the moment before the index arrived: wait for it.
				if (relIndex === NO_RELATIONS && hasRelations) relationsPart.load().then((m) => open(relationIndexOf(m, deck)), () => undefined)
				else open(relIndex)
			},
		}),
		[deck, relIndex, hasRelations],
	)

	const nestedCtx = React.useMemo(() => ({ deck, relIndex, renderCtx }), [deck, relIndex, renderCtx])

	// Page bus: placed tables register; charts / facets add filters to their targets.
	const tablesRef = React.useRef(new Map<string, TableApi>())
	const register = React.useCallback((id: string, api: TableApi) => {
		tablesRef.current.set(id, api)
		return () => {
			tablesRef.current.delete(id)
		}
	}, [])
	const [pageFilters, setPageFilters] = React.useState<Record<string, Record<string, string>>>({})
	const [focusedId, setFocused] = React.useState<string | null>(null)
	// Master–detail: selected rows per table item, and a reset counter per item for the chip's ✕.
	const [selections, setSelections] = React.useState<Record<string, Row[]>>({})
	const [resetKeys, setResetKeys] = React.useState<Record<string, number>>({})
	const pageItems = React.useMemo(() => {
		const out: { id: string; table?: string | undefined; master?: string | undefined }[] = []
		const walk = (secs: ResolvedSection[]) =>
			secs.forEach((sec) => {
				for (const it of sec.items) out.push({ id: it.id, table: it.table, master: it.spec.component === "table" ? it.spec.master : undefined })
				walk(sec.sections)
			})
		walk(page?.sections ?? [])
		return out
	}, [page])
	const masters = React.useMemo(() => new Set(pageItems.flatMap((i) => (i.master ? [i.master] : []))), [pageItems])
	const firstTableId = React.useMemo(() => {
		const find = (secs: ResolvedSection[]): string | undefined => {
			for (const s of secs) {
				const t = s.items.find((i) => i.kind === "table")
				if (t) return t.id
				const inner = find(s.sections)
				if (inner) return inner
			}
			return undefined
		}
		return page ? (find(page.sections) ?? null) : null
	}, [page])

	const showToggle = deck.config.themeToggle === true
	const withLabels = deck.config.toolbarLabels === true
	// Theme toggle and edit button (with their icons): an on-demand chunk, loaded before the first render
	// of a deck that shows either (components/first-paint.ts).
	const buttons = deckButtonsPart.use()
	React.useEffect(() => {
		if (showToggle || editable) preload(deckButtonsPart)
	}, [showToggle, editable])
	const toggle =
		showToggle && buttons ? (
			<buttons.ThemeToggle
				dark={dark}
				labels={L}
				onToggle={() => {
					// Flips the whole page (every deck), and drops this deck's own override.
					setOverride("inherit")
					setTheme(dark ? "light" : "dark")
				}}
			/>
		) : null
	const pf = pageFilters[current] ?? {}
	const ctx: PageCtx | null = page
		? {
				deck,
				pageId: current,
				renderCtx,
				pageFilters: pf,
				register,
				select: (source, field, value) => {
					// A table's own facets sidebar filters only that table.
					const targets = source.spec.component === "chart" || source.spec.component === "facets" ? source.spec.targets : source.spec.component === "table" ? [source.id] : undefined
					for (const [id, api] of tablesRef.current) {
						if (targets ? targets.includes(id) : api.table === source.table) api.addFilter(field, value)
					}
				},
				focusedId: focusedId ?? firstTableId,
				setFocused,
				openRow: (table: string, row: Row) => setDrawer({ table, row }),
				selections,
				setSelection: (id, rows) => setSelections((all) => ({ ...all, [id]: rows })),
				resetKeys,
				clearSelection: (id) => {
					setSelections((all) => ({ ...all, [id]: [] }))
					setResetKeys((all) => ({ ...all, [id]: (all[id] ?? 0) + 1 }))
				},
				itemTable: (id) => pageItems.find((i) => i.id === id)?.table,
				masters,
				toolbarEnd: ids.length > 1 || editable ? undefined : toggle,
			}
		: null
	const sidebar = deck.config.nav === "sidebar" && ids.length > 1
	const allIssues = [...deck.issues, ...layoutIssues, ...resolved.issues.filter((i) => !layoutIssues.some((l) => sameIssue(l, i)))]
	const showHeader = (ids.length > 1 && !sidebar) || editable

	// Site search (⌘K / Ctrl+K anywhere; "/" on a page without a table, where "/" is free).
	const searchOn = deck.config.search ?? deck.config.nav === "sidebar"
	const [searchOpen, setSearchOpen] = React.useState(false)
	React.useEffect(() => (searchOn ? preloadSearchWhenIdle() : undefined), [searchOn])
	// What the search index is built from; SearchDialog (an on-demand chunk with core/search) builds it on first open.
	const searchSource = React.useMemo<SearchSource>(
		() => ({
			pages: pageCfgs.map((config, i) => ({ id: ids[i] ?? "", config, title: resolved.pages[i]?.title ?? config.title })),
			rows: (table) => deck.datasets[table] ?? [],
			rowLabel: (table, row) => {
				const cols = deck.tables.find((t) => t.name === table)?.columns.filter((c) => !c.hidden).slice(0, 2) ?? []
				return cols.map((c) => String(row[c.id] ?? "")).filter(Boolean).join(" · ")
			},
		}),
		[pageCfgs, resolved, deck, ids.join("|")],
	)
	const hasTable = firstTableId !== null
	React.useEffect(() => {
		if (!searchOn) return
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault()
				setSearchOpen((o) => !o)
			} else if (e.key === "/" && !hasTable && !isTyping(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
				e.preventDefault()
				setSearchOpen(true)
			}
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [searchOn, hasTable])
	const pickHit = (h: SearchHit) => {
		setSearchOpen(false)
		go(h.pageId, h.kind === "heading" || h.kind === "text" ? h.anchor : undefined)
		if (h.kind === "row" && h.table && h.row) setDrawer({ table: h.table, row: h.row })
	}
	const searchButton = searchOn ? (
		<button
			type="button"
			data-jd="search-open"
			onClick={() => setSearchOpen(true)}
			className="jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-2 jd:rounded-md jd:border jd:border-card-border jd:bg-card jd:px-2 jd:text-[12px] jd:text-muted-foreground jd:hover:text-foreground"
		>
			<Search aria-hidden="true" className="jd:h-3.5 jd:w-3.5" />
			<span className="jd:flex-1 jd:text-left">{L.siteSearch}…</span>
			<kbd className="jd:rounded jd:border jd:px-1 jd:text-[10px]">⌘K</kbd>
		</button>
	) : null

	// The grouped sidebar is an on-demand chunk, loaded before the first render (components/first-paint.ts);
	// a deck that switches to it later shows an empty column of the same width for the moment it takes.
	const sidebarMod = sidebarPart.use()
	React.useEffect(() => {
		if (sidebar) preload(sidebarPart)
	}, [sidebar])
	const nav = sidebar ? (
		sidebarMod ? (
			<sidebarMod.SidebarNav pages={resolved.pages} current={current} go={go} searchButton={searchButton} />
		) : (
			<nav data-jd="pages-nav" aria-busy="true" className="jd:w-56 jd:shrink-0 jd:max-md:w-full" />
		)
	) : (
		<SegmentedTabs
			dataJd="pages-nav"
			label="Pages"
			value={current}
			onChange={go}
			items={resolved.pages.map((p) => ({ key: p.id, label: p.title, href: `#/${encodeURIComponent(p.id)}`, attrs: { "data-jd-page-link": p.id } }))}
		/>
	)

	return (
		<div
			ref={rootRef}
			className={cn("jd-root", dark && "jd-dark", deck.classNames.root)}
			data-jd="root"
			data-jd-theme={dark ? "dark" : "light"}
			// Token overrides from config become CSS variables here (CSS on .jd-root works the same way).
			style={tokenStyle(dark ? deck.tokens.dark : deck.tokens.light)}
		>
			<ClassNamesContext.Provider value={deck.classNames}>
			<NestedContext.Provider value={nestedCtx}>
			<LabelsContext.Provider value={L}>
				<ToolbarLabelsContext.Provider value={withLabels}>
				<PortalContainerContext.Provider value={portal}>
					<div className="jd:flex jd:flex-col jd:gap-2 jd:p-2">
						{allIssues.length > 0 && (
							<OnDemand>
								<IssuesBox issues={allIssues} label={L.configIssues} />
							</OnDemand>
						)}
						{showHeader && (
							<div className="jd:flex jd:items-center jd:gap-2 jd:pb-0.5" data-jd="deck-header">
								{!sidebar && ids.length > 1 ? nav : <span className="jd:text-[13px] jd:font-semibold">{page?.title}</span>}
								{!sidebar && searchButton && <div className="jd:w-48">{searchButton}</div>}
								<span className="jd:flex-1" />
								{editable && edit && (
									<OnDemand>
										<DeckEditTools copied={copied !== null} onCopy={copyConfig} onReset={resetLayout} />
									</OnDemand>
								)}
								{editable && buttons && <buttons.EditToggle edit={edit} withLabels={withLabels} labels={L} onToggle={() => setEdit((e) => !e)} />}
								{toggle}
							</div>
						)}
						{copied && edit && (
							<textarea readOnly value={copied} data-jd="config-json" className="jd:h-40 jd:w-full jd:rounded jd:border jd:bg-muted jd:p-2 jd:font-mono jd:text-[11px]" onFocus={(e) => e.currentTarget.select()} />
						)}
						<div className={cn(sidebar && "jd:flex jd:gap-3 jd:max-md:flex-col")}>
							{sidebar && nav}
							<div className="jd:min-w-0 jd:flex-1">
								{page && ctx && (
									<PageContext.Provider value={ctx}>
										<PageView
											key={page.id}
											page={page}
											config={pageCfgs[pageIndex] ?? { title: "", sections: [] }}
											edit={edit}
											ops={ops}
											pageFilters={pf}
											onPageFilter={(field, value) =>
												setPageFilters((all) => {
													const cur = { ...(all[current] ?? {}) }
													if (value === undefined) delete cur[field]
													else cur[field] = value
													return { ...all, [current]: cur }
												})
											}
										/>
									</PageContext.Provider>
								)}
								{deck.tables.length === 0 && <div className="jd:text-muted-foreground jd:p-6 jd:text-center">{L.noTables}</div>}
							</div>
						</div>
					</div>
					{searchOpen && (
						<OnDemand>
							<SearchDialog source={searchSource} onPick={pickHit} onClose={() => setSearchOpen(false)} />
						</OnDemand>
					)}
					{drawer && (
						<OnDemand>
							<RowDrawer deck={deck} index={relIndex} target={drawer} ctx={renderCtx} onOpen={setDrawer} onClose={() => setDrawer(null)} />
						</OnDemand>
					)}
					<div ref={setPortal} data-jd="portal" />
				</PortalContainerContext.Provider>
				</ToolbarLabelsContext.Provider>
			</LabelsContext.Provider>
			</NestedContext.Provider>
			</ClassNamesContext.Provider>
		</div>
	)
}

