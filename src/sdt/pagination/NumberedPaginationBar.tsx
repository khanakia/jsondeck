import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLabels } from "@/lib/labels"
import { fill } from "../../core/labels"
import { pageList } from "../../core/query"

type Props = {
	/** 1-based current page. */
	page: number
	pageCount: number
	pageSize: number
	total: number
	onPage: (page: number) => void
}

/**
 * Numbered pagination for in-memory data: "1–50 of N", first/prev, page
 * numbers with "…" gaps, next/last. Replaces the server-paged
 * CursorPaginationBar (cursor paging only knows next/prev); same look.
 */
export function NumberedPaginationBar({ page, pageCount, pageSize, total, onPage }: Props) {
	const from = total === 0 ? 0 : (page - 1) * pageSize + 1
	const to = Math.min(total, page * pageSize)
	const last = Math.max(1, pageCount)
	const nav = "jd:h-6 jd:w-6"
	const L = useLabels()
	return (
		<div className="jd:flex jd:items-center jd:gap-1" data-jd="pagination">
			<span className="jd:text-muted-foreground jd:mr-1 jd:text-[11px] jd:tabular-nums" data-jd="range">
				{fill(L.range, { from, to, total })}
			</span>
			<Button variant="outline" size="icon-sm" className={nav} onClick={() => onPage(1)} disabled={page <= 1} aria-label="First page">
				<ChevronsLeft className="jd:h-3 jd:w-3" />
			</Button>
			<Button variant="outline" size="icon-sm" className={nav} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
				<ChevronLeft className="jd:h-3 jd:w-3" />
			</Button>
			{pageList(page, pageCount).map((p, i) =>
				p === "…" ? (
					// A gap has no identity of its own; its position is its key.
					<span key={`gap-${i}`} className="jd:text-muted-foreground jd:px-0.5 jd:text-[11px]">
						…
					</span>
				) : (
					<Button
						key={p}
						variant={p === page ? "default" : "outline"}
						size="xs"
						className={cn("jd:h-6 jd:min-w-6 jd:px-1.5 jd:tabular-nums")}
						onClick={() => onPage(p)}
						aria-label={`Page ${p}`}
						aria-current={p === page ? "page" : undefined}
					>
						{p}
					</Button>
				),
			)}
			<Button variant="outline" size="icon-sm" className={nav} onClick={() => onPage(page + 1)} disabled={page >= last} aria-label="Next page">
				<ChevronRight className="jd:h-3 jd:w-3" />
			</Button>
			<Button variant="outline" size="icon-sm" className={nav} onClick={() => onPage(last)} disabled={page >= last} aria-label="Last page">
				<ChevronsRight className="jd:h-3 jd:w-3" />
			</Button>
		</div>
	)
}
