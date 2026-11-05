/**
 * The grouped sidebar page navigation (`nav: "sidebar"`), an on-demand chunk
 * loaded before the first render of a deck that uses it
 * (components/first-paint.ts), so the layout never shifts.
 */
import type * as React from "react"
import { cn } from "@/lib/utils"
import type { ResolvedPage } from "../core/layout"

export function SidebarNav({ pages, current, go, searchButton }: { pages: ResolvedPage[]; current: string; go: (id: string) => void; searchButton: React.ReactNode }) {
	// Groups in order of first appearance; ungrouped pages first.
	const groups: { name: string | undefined; pages: ResolvedPage[] }[] = []
	for (const p of pages) {
		const g = groups.find((x) => x.name === p.group)
		if (g) g.pages.push(p)
		else groups.push({ name: p.group, pages: [p] })
	}
	return (
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
	)
}
