/**
 * The dashboard shell: config issues, page navigation (tabs or sidebar, page
 * in the URL hash), theme toggle, the layout editor toolbar, the row drawer and
 * the page "bus" that lets charts and facets filter tables. It renders a list
 * of placed components; the no-`pages` default is one page with a tab per table.
 */
import { Check, Copy, LayoutGrid, Moon, RotateCcw, Search, Sun, TriangleAlert } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { LabelsContext } from "@/lib/labels"
import { ClassNamesContext } from "@/lib/classnames"
import { NestedContext } from "@/lib/nested"
import { tokenStyle } from "../core/theme-tokens"
import { PortalContainerContext } from "@/lib/portal"
import { setTheme, usePageTheme, useSystemTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import type { PageConfig, PageItem, Row } from "../core/config"
import { fill } from "../core/labels"
import { addItem, moveItem, plainPage, type ResolvedSection, removeItem, resolvePage, restorePage, slug, updateItem, withItemIds } from "../core/layout"
import { buildRelations } from "../core/relations"
import { buildSearchIndex, type SearchHit } from "../core/search"
import type { ResolvedDeck } from "../core/resolve"
import { formatIssue, type Issue } from "../core/validate"
import type { TableApi } from "../sdt/ClientDataTable"
import type { RenderCtx } from "./cells"
import { PageContext, type PageCtx } from "./Items"
import { SegmentedTabs } from "./Tabs"
import { ICON_BTN, LABEL_BTN, Tip, ToolbarLabelsContext } from "./Tip"
import { type LayoutOps, PageView } from "./Page"
import { type DrawerTarget, RowDrawer } from "./RowDrawer"
import { SearchDialog } from "./SearchDialog"

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

function IssuesBox({ issues, label }: { issues: Issue[]; label: string }) {
	if (issues.length === 0) return null
	return (
		<details open className="jd:rounded-md jd:border jd:border-amber-300 jd:bg-amber-50 jd:px-2 jd:py-1 jd:text-[12px] jd:text-amber-900 jd:dark:border-amber-800 jd:dark:bg-amber-950 jd:dark:text-amber-200" data-jd="issues">
			<summary className="jd:flex jd:cursor-pointer jd:items-center jd:gap-1.5 jd:font-medium">
				<TriangleAlert className="jd:h-3.5 jd:w-3.5" />
				{fill(label, { n: issues.length })}
			</summary>
			<ul className="jd:mt-1 jd:flex jd:flex-col jd:gap-0.5 jd:pl-5 jd:font-mono jd:text-[11px]">
				{issues.map((i) => (
					<li key={`${i.path}|${i.message}`}>{formatIssue(i)}</li>
				))}
			</ul>
		</details>
	)
}

/** `#/<page>` or `#/<page>/<heading anchor>` → { page, anchor }. */
function hashRoute(): { page: string | null; anchor: string | null } {
	const m = typeof window !== "undefined" ? window.location.hash.match(/^#\/([^/?]+)(?:\/([^?]+))?/) : null
	return { page: m?.[1] ? decodeURIComponent(m[1]) : null, anchor: m?.[2] ? decodeURIComponent(m[2]) : null }
}
const hashPage = () => hashRoute().page

/** Typing in a field: page-level single-key shortcuts stay out of the way. */
const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))

export function Deck({ deck, configs, layoutIssues }: { deck: ResolvedDeck; configs: PageConfig[]; layoutIssues: Issue[] }) {
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
		const issues: Issue[] = []
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
	const ops = React.useMemo<LayoutOps>(
		() => ({
			move: (id, path, index) => applyEdit((p) => moveItem(p, id, path, index)),
			update: (id, patch) => applyEdit((p) => updateItem(p, id, patch)),
			remove: (id) => applyEdit((p) => removeItem(p, id)),
			add: (path, item: PageItem) => applyEdit((p) => addItem(p, path, item)),
		}),
		[applyEdit],
	)
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

	// Row drawer + relations.
	const relIndex = React.useMemo(() => buildRelations(
				Object.fromEntries(deck.tables.map((t) => [t.name, t.rows])),
				deck.relations.map((r) => ({ from: r.from, to: r.to, ...(r.label ? { label: r.label } : {}), ...(r.reverseLabel ? { reverseLabel: r.reverseLabel } : {}) })),
			), [deck])
	const [drawer, setDrawer] = React.useState<DrawerTarget | null>(null)
	const renderCtx = React.useMemo<RenderCtx>(
		() => ({
			types: deck.types,
			renderers: deck.renderers,
			formats: deck.formats,
			statusColors: deck.statusColors,
			badgeClass: deck.classNames.badge,
			onRelation: (table, field, value) => {
				const row = relIndex.find(table, field, value)[0]
				if (row) setDrawer({ table, row })
			},
		}),
		[deck, relIndex],
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
	const toggle = showToggle ? (
		<Tip label={dark ? L.lightMode : L.darkMode}>
			<Button
				variant="ghost"
				size="icon-sm"
				className={ICON_BTN}
				aria-label={dark ? L.lightMode : L.darkMode}
				data-jd="theme-toggle"
				onClick={() => {
					// Flips the whole page (every deck), and drops this deck's own override.
					setOverride("inherit")
					setTheme(dark ? "light" : "dark")
				}}
			>
				{dark ? <Sun className="jd:h-3.5 jd:w-3.5" /> : <Moon className="jd:h-3.5 jd:w-3.5" />}
			</Button>
		</Tip>
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
	const showHeader = (ids.length > 1 && !sidebar) || editable

	// Site search (⌘K / Ctrl+K anywhere; "/" on a page without a table, where "/" is free).
	const searchOn = deck.config.search ?? deck.config.nav === "sidebar"
	const [searchOpen, setSearchOpen] = React.useState(false)
	const searchEntries = React.useMemo(
		() =>
			searchOn
				? buildSearchIndex(
						pageCfgs.map((config, i) => ({ id: ids[i] ?? "", config, title: resolved.pages[i]?.title ?? config.title })),
						(table) => deck.datasets[table] ?? [],
						(table, row) => {
							const cols = deck.tables.find((t) => t.name === table)?.columns.filter((c) => !c.hidden).slice(0, 2) ?? []
							return cols.map((c) => String(row[c.id] ?? "")).filter(Boolean).join(" · ")
						},
					)
				: [],
		[searchOn, pageCfgs, resolved, deck, ids.join("|")],
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

	// Sidebar groups, in order of first appearance; ungrouped pages first.
	const groups = React.useMemo(() => {
		const out: { name: string | undefined; pages: typeof resolved.pages }[] = []
		for (const p of resolved.pages) {
			const g = out.find((x) => x.name === p.group)
			if (g) g.pages.push(p)
			else out.push({ name: p.group, pages: [p] })
		}
		return out
	}, [resolved])

	const nav = sidebar ? (
		<nav
			className="jd:sticky jd:top-[calc(var(--jds-sticky-top)+8px)] jd:flex jd:max-h-[calc(100vh-var(--jds-sticky-top)-16px)] jd:w-56 jd:shrink-0 jd:flex-col jd:gap-0.5 jd:self-start jd:overflow-y-auto jd:overflow-x-hidden jd:max-md:static jd:max-md:max-h-none jd:max-md:w-full jd:max-md:flex-row jd:max-md:flex-wrap"
			data-jd="pages-nav"
		>
			{searchButton && <div className="jd:mb-2 jd:max-md:w-full">{searchButton}</div>}
			{groups.map((g) => (
				<div key={g.name ?? ""} className="jd:flex jd:flex-col jd:gap-0.5 jd:pb-2 jd:max-md:flex-row jd:max-md:flex-wrap jd:max-md:items-center" data-jd="nav-group" data-jd-group-name={g.name}>
					{g.name && <div className="jd:px-2.5 jd:pb-0.5 jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-wide jd:text-muted-foreground">{g.name}</div>}
					{g.pages.map((p) => (
				<a
					key={p.id}
					href={`#/${encodeURIComponent(p.id)}`}
					data-jd-page-link={p.id}
					title={p.title}
					aria-current={p.id === current ? "page" : undefined}
					onClick={(e) => {
						e.preventDefault()
						go(p.id)
					}}
					className={cn(
						"jd:flex jd:h-7 jd:items-center jd:whitespace-nowrap jd:rounded-md jd:px-2.5 jd:text-[13px]",
						p.id === current ? "jd:bg-card jd:text-foreground jd:font-medium" : "jd:text-muted-foreground jd:hover:text-foreground",
					)}
				>
					<span className="jd:truncate">{p.title}</span>
				</a>
					))}
				</div>
			))}
		</nav>
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
						<IssuesBox issues={[...deck.issues, ...layoutIssues, ...resolved.issues.filter((i) => !layoutIssues.some((l) => l.path === i.path && l.message === i.message))]} label={L.configIssues} />
						{showHeader && (
							<div className="jd:flex jd:items-center jd:gap-2 jd:pb-0.5" data-jd="deck-header">
								{!sidebar && ids.length > 1 ? nav : <span className="jd:text-[13px] jd:font-semibold">{page?.title}</span>}
								{!sidebar && searchButton && <div className="jd:w-48">{searchButton}</div>}
								<span className="jd:flex-1" />
								{editable && edit && (
									<>
										<Tip label={copied ? L.copied : L.copyConfig}>
											<Button variant="ghost" size="sm" aria-label={L.copyConfig} className={withLabels ? LABEL_BTN : ICON_BTN} data-jd="copy-config" onClick={copyConfig}>
												{copied ? <Check className="jd:h-3.5 jd:w-3.5" /> : <Copy className="jd:h-3.5 jd:w-3.5" />}
												{withLabels && (copied ? L.copied : L.copyConfig)}
											</Button>
										</Tip>
										<Tip label={L.resetLayout}>
											<Button variant="ghost" size="sm" aria-label={L.resetLayout} className={withLabels ? LABEL_BTN : ICON_BTN} data-jd="reset-layout" onClick={resetLayout}>
												<RotateCcw className="jd:h-3.5 jd:w-3.5" />
												{withLabels && L.resetLayout}
											</Button>
										</Tip>
									</>
								)}
								{editable && (
									<Tip label={edit ? L.done : L.edit}>
										<Button
											variant={edit ? "default" : "ghost"}
											size="sm"
											aria-label={edit ? L.done : L.edit}
											className={withLabels || edit ? LABEL_BTN : ICON_BTN}
											data-jd="edit-toggle"
											aria-pressed={edit}
											onClick={() => setEdit((e) => !e)}
										>
											<LayoutGrid className="jd:h-3.5 jd:w-3.5" />
											{(withLabels || edit) && (edit ? L.done : L.edit)}
										</Button>
									</Tip>
								)}
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
					{searchOpen && <SearchDialog entries={searchEntries} onPick={pickHit} onClose={() => setSearchOpen(false)} />}
					{drawer && <RowDrawer deck={deck} index={relIndex} target={drawer} ctx={renderCtx} onOpen={setDrawer} onClose={() => setDrawer(null)} />}
					<div ref={setPortal} data-jd="portal" />
				</PortalContainerContext.Provider>
				</ToolbarLabelsContext.Provider>
			</LabelsContext.Provider>
			</NestedContext.Provider>
			</ClassNamesContext.Provider>
		</div>
	)
}

