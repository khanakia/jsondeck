/**
 * Row detail drawer: every field of one row (rendered like its table cells)
 * plus the related rows from other tables (relations.ts index). Clicking a
 * related row opens it in the same drawer.
 */
import { X } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import type { Row } from "../core/config"
import { toText } from "../core/query"
import type { RelationIndex } from "../core/relations"
import type { ResolvedDeck } from "../core/resolve"
import { type RenderCtx, renderCell } from "./cells"

/** Related rows listed per group before "+N more". */
const MAX_RELATED = 10

export type DrawerTarget = { table: string; row: Row }

export function RowDrawer({ deck, index, target, ctx, onOpen, onClose }: { deck: ResolvedDeck; index: RelationIndex; target: DrawerTarget; ctx: RenderCtx; onOpen: (t: DrawerTarget) => void; onClose: () => void }) {
	const L = useLabels()
	const t = deck.tables.find((x) => x.name === target.table)
	// Focus moves into the drawer on open and back to what had it (the clicked row) on close.
	const closeRef = React.useRef<HTMLButtonElement>(null)
	React.useEffect(() => {
		const before = document.activeElement
		closeRef.current?.focus()
		return () => {
			if (before instanceof HTMLElement && before.isConnected) before.focus()
		}
	}, [])
	React.useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [onClose])
	if (!t) return null
	const title = (r: Row, table: string) => {
		const tb = deck.tables.find((x) => x.name === table)
		const keyCol = tb?.key ?? tb?.columns[0]?.id
		return keyCol ? toText(r[keyCol]) : ""
	}
	const groups = index.lookup(target.table, target.row)
	return (
		<>
		{/* Overlay layer: above any host page chrome (sticky headers, navbars). */}
		<div data-jd="drawer-backdrop" aria-hidden="true" onClick={onClose} className="jd:fixed jd:inset-0 jd:z-[2147483000] jd:bg-black/20" />
		<aside
			data-jd="drawer"
			data-jd-slot="drawer"
			role="dialog"
			aria-modal="true"
			aria-label={t.label}
			className={cn("jd:bg-card jd:fixed jd:inset-y-0 jd:right-0 jd:z-[2147483001] jd:flex jd:h-dvh jd:w-[440px] jd:max-w-full jd:flex-col jd:border-l jd:border-card-border jd:shadow-(--jds-card-shadow)", deck.classNames.drawer)}
		>
			<div className="jd:flex jd:h-10 jd:items-center jd:gap-2 jd:border-b jd:px-3">
				<span className="jd:text-muted-foreground jd:text-[11px] jd:uppercase jd:tracking-wider">{t.label}</span>
				<span className="jd:truncate jd:text-[13px] jd:font-semibold" data-jd="drawer-title">
					{title(target.row, target.table)}
				</span>
				<span className="jd:flex-1" />
				<Button ref={closeRef} variant="ghost" size="icon-sm" aria-label={L.close} onClick={onClose} data-jd="drawer-close">
					<X />
				</Button>
			</div>
			<div data-jd="drawer-body" className="jd:flex-1 jd:overflow-y-auto jd:overflow-x-hidden jd:p-3">
				<div className="jd:text-muted-foreground jd:mb-1 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">{L.fields}</div>
				<dl className="jd:grid jd:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] jd:gap-x-3 jd:gap-y-1 jd:text-[12px]" data-jd="drawer-fields">
					{t.columns.map((c) => (
						<React.Fragment key={c.id}>
							<dt className="jd:text-muted-foreground jd:truncate">{c.label}</dt>
							<dd className="jd:flex jd:min-w-0 jd:items-center jd:break-words">
								{typeof target.row[c.id] === "object" && target.row[c.id] !== null ? (
									<pre data-jd="drawer-json" className="jd:bg-muted/50 jd:max-h-48 jd:w-full jd:overflow-auto jd:whitespace-pre-wrap jd:break-all jd:rounded jd:p-1.5 jd:font-mono jd:text-[11px]">
										{JSON.stringify(target.row[c.id], null, 2)}
									</pre>
								) : (
									renderCell(target.row[c.id], target.row, { ...c, wrap: true }, ctx)
								)}
							</dd>
						</React.Fragment>
					))}
				</dl>
				{groups.length > 0 && (
					<>
						<div className="jd:text-muted-foreground jd:mt-4 jd:mb-1 jd:text-[10px] jd:font-semibold jd:uppercase jd:tracking-wider">{L.related}</div>
						<div className="jd:flex jd:flex-col jd:gap-2" data-jd="drawer-related">
							{groups.map((g) => (
								<div key={`${g.direction}:${g.relation.from}:${g.relation.to}`} data-jd-related={g.table}>
									<div className="jd:text-[12px] jd:font-medium">
										{g.label} <span className="jd:text-muted-foreground jd:tabular-nums">({g.rows.length})</span>
									</div>
									{g.rows.length === 0 && <div className="jd:text-muted-foreground jd:text-[11px]">{L.noRelated}</div>}
									<div className="jd:flex jd:flex-col">
										{g.rows.slice(0, MAX_RELATED).map((r, i) => (
											<button
												// Related rows have no guaranteed id; their position in the group is the key.
												key={`${title(r, g.table)}-${i}`}
												type="button"
												onClick={() => onOpen({ table: g.table, row: r })}
												className="jd:hover:bg-muted jd:flex jd:h-6 jd:cursor-pointer jd:items-center jd:rounded jd:px-1.5 jd:text-left jd:text-[12px] jd:text-blue-600 jd:dark:text-blue-400"
											>
												<span className="jd:truncate">{title(r, g.table)}</span>
											</button>
										))}
										{g.rows.length > MAX_RELATED && <span className="jd:text-muted-foreground jd:px-1.5 jd:text-[11px]">+{g.rows.length - MAX_RELATED}</span>}
									</div>
								</div>
							))}
						</div>
					</>
				)}
			</div>
		</aside>
		</>
	)
}
