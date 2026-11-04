/**
 * The ⌘K search box over a deck's pages: an input and a ranked hit list
 * (pages, sections, text, table rows). Arrow keys move, Enter opens, Esc or a
 * click outside closes. Ranking lives in core/search; this only renders and
 * reports the pick, the Deck navigates.
 */
import { FileText, Hash, Rows3, Search } from "lucide-react"
import * as React from "react"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { type SearchEntry, type SearchHit, type SearchKind, searchIndex } from "../core/search"

const KIND_ICON: Record<SearchKind, typeof FileText> = { page: FileText, heading: Hash, text: FileText, row: Rows3 }

export function SearchDialog({ entries, onPick, onClose }: { entries: SearchEntry[]; onPick: (hit: SearchHit) => void; onClose: () => void }) {
	const L = useLabels()
	const [q, setQ] = React.useState("")
	const [sel, setSel] = React.useState(0)
	const hits = React.useMemo(() => searchIndex(entries, q), [entries, q])
	const listRef = React.useRef<HTMLUListElement>(null)
	const kindLabel: Record<SearchKind, string> = { page: L.searchKindPage, heading: L.searchKindHeading, text: L.searchKindText, row: L.searchKindRow }

	React.useEffect(() => setSel(0), [q])
	// Esc closes even when focus is not in the box (e.g. taken by a closing drawer).
	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [onClose])
	React.useEffect(() => {
		listRef.current?.querySelector(`[data-jd-hit-index="${sel}"]`)?.scrollIntoView({ block: "nearest" })
	}, [sel])

	const onKey = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowDown") {
			e.preventDefault()
			setSel((s) => Math.min(hits.length - 1, s + 1))
		} else if (e.key === "ArrowUp") {
			e.preventDefault()
			setSel((s) => Math.max(0, s - 1))
		} else if (e.key === "Enter") {
			const h = hits[sel]
			if (h) onPick(h)
		} else if (e.key === "Escape") {
			e.preventDefault()
			onClose()
		}
	}

	return (
		<div
			className="jd:fixed jd:inset-0 jd:z-[2147483002] jd:flex jd:items-start jd:justify-center jd:bg-black/30 jd:px-4 jd:pt-[12vh]"
			data-jd="search-overlay"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose()
			}}
		>
			<div role="dialog" aria-modal="true" aria-label={L.siteSearch} data-jd="site-search" className="jd:flex jd:max-h-[70vh] jd:w-full jd:max-w-xl jd:flex-col jd:overflow-hidden jd:rounded-lg jd:border jd:border-border jd:bg-popover jd:text-popover-foreground jd:shadow-lg">
				<div className="jd:flex jd:items-center jd:gap-2 jd:border-b jd:px-3">
					<Search aria-hidden="true" className="jd:h-4 jd:w-4 jd:text-muted-foreground" />
					<input
						// Opened on purpose by a key or click: focus belongs in the box.
						autoFocus
						value={q}
						onChange={(e) => setQ(e.target.value)}
						onKeyDown={onKey}
						placeholder={L.searchPlaceholder}
						aria-label={L.siteSearch}
						aria-controls="jd-search-hits"
						aria-activedescendant={hits[sel] ? `jd-hit-${sel}` : undefined}
						data-jd="search-input"
						className="jd:h-10 jd:flex-1 jd:bg-transparent jd:text-[13px] jd:outline-none"
					/>
					<kbd className="jd:rounded jd:border jd:px-1 jd:text-[10px] jd:text-muted-foreground">Esc</kbd>
				</div>
				{q.trim() !== "" && (
					<ul ref={listRef} id="jd-search-hits" role="listbox" className="jd:flex-1 jd:overflow-y-auto jd:overflow-x-hidden jd:p-1" data-jd="search-hits">
						{hits.length === 0 && <li className="jd:px-2 jd:py-6 jd:text-center jd:text-muted-foreground">{L.searchNoMatches.replace("{q}", q.trim())}</li>}
						{hits.map((h, i) => {
							const Icon = KIND_ICON[h.kind]
							return (
								<li
									key={`${h.kind}:${h.pageId}:${h.anchor ?? ""}:${h.label}:${i}`}
									id={`jd-hit-${i}`}
									role="option"
									aria-selected={i === sel}
									data-jd-hit-index={i}
									data-jd-hit-kind={h.kind}
									onMouseMove={() => setSel(i)}
									onMouseDown={(e) => {
										e.preventDefault()
										onPick(h)
									}}
									className={cn("jd:flex jd:cursor-pointer jd:items-start jd:gap-2 jd:rounded-md jd:px-2 jd:py-1.5", i === sel && "jd:bg-accent jd:text-accent-foreground")}
								>
									<Icon aria-hidden="true" className="jd:mt-0.5 jd:h-3.5 jd:w-3.5 jd:shrink-0 jd:text-muted-foreground" />
									<div className="jd:min-w-0 jd:flex-1">
										<div className="jd:flex jd:items-baseline jd:gap-2">
											<span className="jd:truncate jd:font-medium">{h.label}</span>
											<span className="jd:shrink-0 jd:text-[11px] jd:text-muted-foreground">
												{kindLabel[h.kind]} · {h.pageTitle}
											</span>
										</div>
										{h.snippet && <div className="jd:line-clamp-2 jd:text-[12px] jd:text-muted-foreground">{h.snippet}</div>}
									</div>
								</li>
							)
						})}
					</ul>
				)}
				<div className="jd:border-t jd:px-3 jd:py-1 jd:text-[11px] jd:text-muted-foreground">{L.searchHint}</div>
			</div>
		</div>
	)
}
