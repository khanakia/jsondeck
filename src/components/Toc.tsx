/**
 * "On this page": the headings of the current page's markdown items (## and
 * ###), as links to their anchors, with scroll-spy (the heading nearest above
 * the sticky line is marked current). Sticky below `--jds-sticky-top`; hidden
 * on narrow screens, where it would only repeat the content below it.
 */
import * as React from "react"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"

type Head = { anchor: string; id: string; text: string; level: 2 | 3 }

/** How far below the sticky line a heading still counts as "current". */
const SPY_SLACK_PX = 24

export function Toc({ pageId, className }: { pageId: string; className?: string | undefined }) {
	const L = useLabels()
	const ref = React.useRef<HTMLElement>(null)
	const [heads, setHeads] = React.useState<Head[]>([])
	const [active, setActive] = React.useState<string | null>(null)

	React.useEffect(() => {
		const nav = ref.current
		if (!nav) return
		const scope = nav.closest('[data-jd="page"]') ?? nav.ownerDocument
		const els = [...scope.querySelectorAll<HTMLElement>('[data-jd="markdown"] h3[id], [data-jd="markdown"] h4[id]')]
		setHeads(
			els.map((el) => ({
				anchor: el.getAttribute("data-jd-heading") ?? el.id,
				id: el.id,
				// The hover "#" link is part of the heading's text; drop it.
				text: (el.textContent ?? "").replace(/#$/, "").trim(),
				level: el.tagName === "H4" ? 3 : 2,
			})),
		)
		const spy = () => {
			const line = Number.parseFloat(getComputedStyle(nav).getPropertyValue("--jds-sticky-top")) || 0
			let cur = els[0]?.id ?? null
			for (const el of els) if (el.getBoundingClientRect().top <= line + SPY_SLACK_PX) cur = el.id
			const doc = nav.ownerDocument.documentElement
			// At the very bottom the last heading may never reach the line: mark it.
			if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) cur = els[els.length - 1]?.id ?? cur
			setActive(cur)
		}
		spy()
		// Capture: catches scrolling of any container the deck sits in, not just the window.
		document.addEventListener("scroll", spy, { capture: true, passive: true })
		window.addEventListener("resize", spy)
		return () => {
			document.removeEventListener("scroll", spy, { capture: true })
			window.removeEventListener("resize", spy)
		}
	}, [pageId])

	return (
		<nav
			ref={ref}
			aria-label={L.onThisPage}
			data-jd="toc"
			className={cn(
				"jd:sticky jd:top-[calc(var(--jds-sticky-top)+8px)] jd:max-h-[calc(100vh-var(--jds-sticky-top)-16px)] jd:overflow-y-auto jd:overflow-x-hidden jd:max-md:hidden jd:text-[12px]",
				className,
			)}
		>
			{heads.length > 0 && (
				<>
					<div className="jd:mb-1 jd:font-semibold jd:text-foreground">{L.onThisPage}</div>
					<ul className="jd:flex jd:flex-col jd:border-l jd:border-card-border">
						{heads.map((h) => (
							<li key={h.id}>
								<a
									href={`#/${encodeURIComponent(pageId)}/${h.anchor}`}
									data-jd-toc-link={h.anchor}
									aria-current={active === h.id ? "location" : undefined}
									className={cn(
										"jd:-ml-px jd:block jd:truncate jd:border-l jd:py-0.5 jd:leading-5",
										h.level === 3 ? "jd:pl-5" : "jd:pl-3",
										active === h.id ? "jd:border-foreground jd:text-foreground jd:font-medium" : "jd:border-transparent jd:text-muted-foreground jd:hover:text-foreground",
									)}
								>
									{h.text}
								</a>
							</li>
						))}
					</ul>
				</>
			)}
		</nav>
	)
}
