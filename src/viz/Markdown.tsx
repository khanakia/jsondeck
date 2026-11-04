/**
 * Markdown: a small renderer that builds React elements directly, never an
 * HTML string. Raw HTML in the source is shown as text, so there is nothing
 * to sanitize: no script, no on* attributes can exist. Links are kept only
 * for safe schemes (http, https, mailto, #anchor, relative paths).
 *
 * Supported: # headings, paragraphs, **bold**, *italic*, `code`, [links](url),
 * - / * / 1. lists, > quotes, ``` fenced code, --- rules, | tables |, and
 * directive blocks:
 *   :::tip / :::note / :::info / :::warning / :::danger [title]  → callout
 *   :::steps  (a numbered list, or ### headings, one step each)   → stepper
 * Fenced code in js / ts / json / html renders as the CodeView (highlight +
 * copy); other fences are a plain block.
 *
 * Headings: with `anchorPage` set, every heading gets a stable id
 * (`<page>--<slug>`, the same slugs `core/search` indexes) and a hover "#"
 * link to `#/<page>/<slug>`, so sections can be linked and searched.
 */
import { Info, Lightbulb, OctagonAlert, TriangleAlert } from "lucide-react"
import { Fragment, type ReactNode } from "react"
import { CodeView } from "../components/CodeView"
import { CODE_LANGS, type CodeLang } from "../core/highlight"
import type { Labels } from "../core/labels"
import { headingSlugs, markdownHeadings } from "../core/search"
import { useLabels } from "../lib/labels"
import "./viz.css"

/** Schemes a link may use. Anything else (javascript:, data:, vbscript:) renders as plain text. */
const SAFE_HREF = /^(https?:|mailto:|#|\/|\.\/|\.\.\/)|^[^:]*$/i

export function safeHref(href: string): string | null {
	// Strip control and space characters browsers ignore inside a scheme ("java\tscript:").
	const h = href.replace(/[\u0000- \u007f]/g, "")
	return SAFE_HREF.test(h) ? href : null
}

const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/

function inline(text: string, key = "i"): ReactNode[] {
	const out: ReactNode[] = []
	let rest = text
	let n = 0
	while (rest) {
		const m = INLINE.exec(rest)
		if (!m) { out.push(rest); break }
		if (m.index > 0) out.push(rest.slice(0, m.index))
		const tok = m[0]
		const k = `${key}-${n++}`
		if (m[1]) out.push(<code key={k} className="jd:rounded jd:bg-muted jd:px-1 jd:font-mono jd:text-[12px]">{tok.slice(1, -1)}</code>)
		else if (m[2]) out.push(<strong key={k} className="jd:font-semibold">{inline(tok.slice(2, -2), k)}</strong>)
		else if (m[3]) out.push(<em key={k}>{inline(tok.slice(1, -1), k)}</em>)
		else if (m[4]) {
			const lm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(tok)
			const href = lm ? safeHref(lm[2] ?? "") : null
			out.push(
				href && lm ? (
					<a key={k} href={href} target={/^https?:/i.test(href) ? "_blank" : undefined} rel="noopener noreferrer" className="jd:underline jd:decoration-border jd:underline-offset-2">
						{inline(lm[1] ?? "", k)}
					</a>
				) : (
					<Fragment key={k}>{lm?.[1] ?? tok}</Fragment>
				),
			)
		}
		rest = rest.slice(m.index + tok.length)
	}
	return out
}

const splitRow = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())

/** Callout kinds and how each looks (borders and a tint only, no shadow). */
const CALLOUTS = {
	tip: { icon: Lightbulb, cls: "jd:border-emerald-500/30 jd:bg-emerald-500/5", iconCls: "jd:text-emerald-600 jd:dark:text-emerald-400", title: (L: Labels) => L.calloutTip },
	note: { icon: Info, cls: "jd:border-sky-500/30 jd:bg-sky-500/5", iconCls: "jd:text-sky-600 jd:dark:text-sky-400", title: (L: Labels) => L.calloutNote },
	warning: { icon: TriangleAlert, cls: "jd:border-amber-500/40 jd:bg-amber-500/5", iconCls: "jd:text-amber-600 jd:dark:text-amber-400", title: (L: Labels) => L.calloutWarning },
	danger: { icon: OctagonAlert, cls: "jd:border-red-500/35 jd:bg-red-500/5", iconCls: "jd:text-red-600 jd:dark:text-red-400", title: (L: Labels) => L.calloutDanger },
} as const
type CalloutKind = keyof typeof CALLOUTS
const CALLOUT_ALIASES: Record<string, CalloutKind> = { tip: "tip", note: "note", info: "note", warning: "warning", caution: "warning", danger: "danger", error: "danger" }

/** Fence language → highlighter language (null = plain block). */
function fenceLang(info: string): CodeLang | null {
	const l = info.trim().toLowerCase()
	const mapped = l === "javascript" || l === "jsx" || l === "mjs" ? "js" : l === "typescript" || l === "tsx" ? "ts" : l
	return CODE_LANGS.find((c) => c === mapped) ?? null
}

/** Shared while rendering one markdown text: heading anchors are handed out in document order. */
type Ctx = { anchors: string[]; next: number; page?: string | undefined; L: Labels }

/** Lines of a `:::name` block starting at `start` (the opening line); nested blocks are kept whole. */
function directiveBody(lines: string[], start: number): { body: string[]; end: number } {
	let depth = 1
	let i = start + 1
	const body: string[] = []
	let fence = false
	while (i < lines.length) {
		const l = lines[i] ?? ""
		if (/^```/.test(l)) fence = !fence
		if (!fence && /^:::\s*$/.test(l.trim())) {
			depth--
			if (depth === 0) break
		} else if (!fence && /^:::[a-z]/i.test(l.trim())) depth++
		body.push(l)
		i++
	}
	return { body, end: i + 1 }
}

// Called as plain functions (not components) so heading anchors are handed out in document order.
function heading(level: number, text: string, ctx: Ctx, k: string): ReactNode {
	const anchor = ctx.anchors[ctx.next++]
	const cls =
		level === 1 ? "jd:text-lg jd:font-semibold jd:mt-1 jd:mb-2" : level === 2 ? "jd:text-[15px] jd:font-semibold jd:mt-5 jd:mb-1.5 jd:pb-1 jd:border-b" : "jd:text-[13px] jd:font-semibold jd:mt-3 jd:mb-1"
	const H = level === 1 ? "h2" : level === 2 ? "h3" : "h4"
	const id = ctx.page && anchor ? `${ctx.page}--${anchor}` : undefined
	return (
		<H key={k} id={id} data-jd-heading={anchor} className={`jd:group jd:scroll-mt-[calc(var(--jds-sticky-top)+12px)] ${cls}`}>
			{inline(text, k)}
			{id && (
				<a
					href={`#/${encodeURIComponent(ctx.page ?? "")}/${anchor}`}
					aria-label={ctx.L.headingLink}
					data-jd="heading-anchor"
					className="jd:ml-1.5 jd:text-muted-foreground jd:no-underline jd:opacity-0 jd:group-hover:opacity-100 jd:focus-visible:opacity-100"
				>
					#
				</a>
			)}
		</H>
	)
}

function steps(body: string[], ctx: Ctx, k: string): ReactNode {
	// Steps are either ### headings (with content under each) or the items of one list.
	const list: { title?: string | undefined; lines: string[] }[] = []
	if (body.some((l) => /^#{1,6}\s/.test(l))) {
		for (const l of body) {
			const h = /^#{1,6}\s+(.*)$/.exec(l)
			if (h) list.push({ title: h[1] ?? "", lines: [] })
			else list[list.length - 1]?.lines.push(l)
		}
	} else {
		for (const l of body) {
			const m = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(l)
			if (m) list.push({ lines: [m[2] ?? ""] })
			else if (l.trim()) list[list.length - 1]?.lines.push(l.trim())
		}
	}
	return (
		<ol key={k} className="jd:my-2 jd:flex jd:flex-col" data-jd="steps">
			{list.map((s, i) => (
				<li key={i} className="jd:relative jd:flex jd:gap-3 jd:pb-3 jd:last:pb-0" data-jd="step">
					{/* Rail between numbers. */}
					{i < list.length - 1 && <span aria-hidden="true" className="jd:absolute jd:left-[11px] jd:top-6 jd:bottom-0 jd:w-px jd:bg-card-border" />}
					<span className="jd:flex jd:h-6 jd:w-6 jd:shrink-0 jd:items-center jd:justify-center jd:rounded-full jd:border jd:border-card-border jd:bg-muted jd:text-[11px] jd:font-semibold jd:tabular-nums">
						{i + 1}
					</span>
					<div className="jd:min-w-0 jd:flex-1 jd:pt-0.5 jd:[&>*:first-child]:mt-0 jd:[&>*:last-child]:mb-0">
						{s.title !== undefined && stepTitle(s.title, ctx, `${k}s${i}`)}
						{renderBlocks(s.lines, ctx, `${k}s${i}`)}
					</div>
				</li>
			))}
		</ol>
	)
}

/** A heading-style step title: consumes its anchor so later headings keep theirs. */
function stepTitle(title: string, ctx: Ctx, k: string): ReactNode {
	ctx.next++
	return <div className="jd:font-semibold">{inline(title, k)}</div>
}

function renderBlocks(lines: string[], ctx: Ctx, key: string): ReactNode[] {
	// Every loop below checks i < lines.length first, so the "" fallback is never read as content.
	const at = (j: number) => lines[j] ?? ""
	const blocks: ReactNode[] = []
	let i = 0
	let para: string[] = []
	const flush = () => {
		if (para.length) blocks.push(<p key={`${key}p${blocks.length}`} className="jd:my-1.5">{inline(para.join(" "), `${key}p${blocks.length}`)}</p>)
		para = []
	}
	while (i < lines.length) {
		const line = at(i)
		const b = `${key}-${blocks.length}`
		const fence = /^```\s*(\S*)/.exec(line)
		if (fence) {
			flush()
			const code: string[] = []
			i++
			while (i < lines.length && !/^```/.test(at(i))) code.push(at(i++))
			i++
			const lang = fenceLang(fence[1] ?? "")
			blocks.push(
				lang ? (
					<div key={`c${b}`} className="jd:my-2" data-jd="md-code">
						<CodeView code={code.join("\n")} lang={lang} bare />
					</div>
				) : (
					<pre key={`c${b}`} className="jd:my-1.5 jd:overflow-x-auto jd:overflow-y-hidden jd:rounded jd:bg-muted jd:p-2 jd:font-mono jd:text-[12px]"><code>{code.join("\n")}</code></pre>
				),
			)
			continue
		}
		const dir = /^:::\s*([a-z]+)\s*(.*)$/i.exec(line.trim())
		if (dir) {
			flush()
			const { body, end } = directiveBody(lines, i)
			i = end
			const name = (dir[1] ?? "").toLowerCase()
			if (name === "steps") {
				blocks.push(steps(body, ctx, `s${b}`))
				continue
			}
			const kind = CALLOUT_ALIASES[name] ?? "note"
			const c = CALLOUTS[kind]
			const Icon = c.icon
			const title = (dir[2] ?? "").trim()
			blocks.push(
				<div key={`d${b}`} role="note" data-jd="callout" data-jd-callout={kind} className={`jd:my-2 jd:flex jd:gap-2 jd:rounded-md jd:border jd:px-3 jd:py-2 ${c.cls}`}>
					<Icon aria-hidden="true" className={`jd:mt-0.5 jd:h-4 jd:w-4 jd:shrink-0 ${c.iconCls}`} />
					<div className="jd:min-w-0 jd:flex-1 jd:[&>*:first-child]:mt-0 jd:[&>*:last-child]:mb-0">
						<div className="jd:mb-0.5 jd:font-semibold">{title ? inline(title, `d${b}t`) : c.title(ctx.L)}</div>
						{renderBlocks(body, ctx, `d${b}`)}
					</div>
				</div>,
			)
			continue
		}
		const h = /^(#{1,6})\s+(.*)$/.exec(line)
		if (h) {
			flush()
			blocks.push(heading((h[1] ?? "#").length, h[2] ?? "", ctx, `h${b}`))
			i++
			continue
		}
		if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); blocks.push(<hr key={`r${b}`} className="jd:my-3 jd:border-t" />); i++; continue }
		if (/^\s*>/.test(line)) {
			flush()
			const q: string[] = []
			while (i < lines.length && /^\s*>/.test(at(i))) q.push(at(i++).replace(/^\s*>\s?/, ""))
			blocks.push(<blockquote key={`q${b}`} className="jd:my-1.5 jd:border-l-2 jd:pl-2 jd:text-muted-foreground">{inline(q.join(" "), `q${b}`)}</blockquote>)
			continue
		}
		if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) {
			flush()
			const ordered = /^\s*\d/.test(line)
			const items: string[] = []
			while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(at(i))) items.push(at(i++).replace(/^\s*([-*+]|\d+[.)])\s+/, ""))
			const L = ordered ? "ol" : "ul"
			blocks.push(
				<L key={`l${b}`} className={`jd:my-1.5 jd:pl-5 ${ordered ? "jd:list-decimal" : "jd:list-disc"}`}>
					{items.map((it, j) => <li key={j} className="jd:my-0.5">{inline(it, `l${b}-${j}`)}</li>)}
				</L>,
			)
			continue
		}
		if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(at(i + 1))) {
			flush()
			const head = splitRow(line)
			i += 2
			const body: string[][] = []
			while (i < lines.length && /^\s*\|.*\|\s*$/.test(at(i))) body.push(splitRow(at(i++)))
			blocks.push(
				<div key={`t${b}`} className="jd:my-2 jd:max-w-full jd:overflow-x-auto jd:overflow-y-hidden">
					<table className="jd:text-[12px]">
						<thead><tr>{head.map((c, j) => <th key={j} className="jd:border-b jd:px-2 jd:py-1 jd:text-left jd:font-medium">{inline(c, `t${b}h${j}`)}</th>)}</tr></thead>
						<tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j} className="jd:border-b jd:px-2 jd:py-1 jd:align-top">{inline(c, `t${b}${ri}-${j}`)}</td>)}</tr>)}</tbody>
					</table>
				</div>,
			)
			continue
		}
		if (line.trim() === "") { flush(); i++; continue }
		para.push(line.trim())
		i++
	}
	flush()
	return blocks
}

export function Markdown({ text, className, anchorPage }: { text: string; className?: string | undefined; anchorPage?: string | undefined }) {
	const L = useLabels()
	const src = (text ?? "").replace(/\r\n?/g, "\n")
	// Anchors come from the same scan the search index uses, so ids and hits agree.
	const ctx: Ctx = { anchors: headingSlugs(markdownHeadings(src).map((h) => h.text)), next: 0, page: anchorPage, L }
	return (
		<div className={`jd:min-w-0 jd:text-[13px] jd:leading-relaxed jd:text-foreground ${className ?? ""}`} data-jd="markdown">
			{renderBlocks(src.split("\n"), ctx, "m")}
		</div>
	)
}
