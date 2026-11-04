/**
 * Preview / Code box: optional title + description, two
 * tabs, a Copy button that says "Copied" only when the copy really worked,
 * and a highlighted code block collapsed to ~20 lines with "Show all".
 */
import { Check, Copy } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { useLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"
import { type CodeLang, highlight, type TokenKind } from "../core/highlight"
import { SegmentedTabs } from "./Tabs"
import { ICON_BTN, Tip } from "./Tip"

/** Lines shown before "Show all". */
const COLLAPSED_LINES = 20
/** How long "Copied" stays before the button resets. */
const COPIED_MS = 1600

/** Token colours for the code block, which is zinc-950 in light and dark mode alike. */
const TOKEN_CLASS: Record<TokenKind, string | undefined> = {
	plain: undefined,
	comment: "jd:text-zinc-500 jd:italic",
	string: "jd:text-emerald-300",
	number: "jd:text-amber-300",
	keyword: "jd:text-violet-300",
	literal: "jd:text-amber-300",
	punct: "jd:text-zinc-500",
	tag: "jd:text-sky-300",
	attr: "jd:text-orange-300",
	property: "jd:text-sky-200",
}

/**
 * Copy text: the clipboard API first, then a selected textarea + execCommand
 * (file:// and older browsers). Resolves true only when a copy happened.
 */
export async function copyText(text: string, host: HTMLElement | null): Promise<boolean> {
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text)
			return true
		}
	} catch {
		// Fall through to the textarea path.
	}
	const ta = document.createElement("textarea")
	ta.value = text
	ta.setAttribute("readonly", "")
	ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none"
	;(host ?? document.body).appendChild(ta)
	ta.select()
	let ok = false
	try {
		ok = document.execCommand("copy")
	} catch {
		ok = false
	}
	ta.remove()
	return ok
}

export function CodeBlock({ code, lang }: { code: string; lang: CodeLang }) {
	const L = useLabels()
	const lines = code.replace(/\n$/, "").split("\n")
	const [all, setAll] = React.useState(lines.length <= COLLAPSED_LINES)
	const shown = all ? lines.join("\n") : lines.slice(0, COLLAPSED_LINES).join("\n")
	const tokens = React.useMemo(() => highlight(shown, lang), [shown, lang])
	return (
		<div className="jd:relative">
			<pre
				data-jd="code"
				className="jd:max-w-full jd:overflow-x-auto jd:overflow-y-hidden jd:whitespace-pre jd:bg-zinc-950 jd:p-3 jd:font-mono jd:text-[12px] jd:leading-[1.55] jd:text-zinc-100"
			>
				<code>
					{tokens.map((t, i) => (
						// Tokens are positional; index is their identity within this render.
						<span key={i} className={TOKEN_CLASS[t.kind]}>
							{t.text}
						</span>
					))}
				</code>
			</pre>
			{lines.length > COLLAPSED_LINES && (
				<div className="jd:flex jd:justify-center jd:border-t jd:border-zinc-800 jd:bg-zinc-950 jd:py-1">
					<Button variant="ghost" size="xs" data-jd="code-toggle" className="jd:text-zinc-300 jd:hover:bg-zinc-800 jd:hover:text-zinc-50" onClick={() => setAll((a) => !a)}>
						{all ? L.showLess : `${L.showAllCode} (${lines.length})`}
					</Button>
				</div>
			)}
		</div>
	)
}

export function CodeView({
	title,
	description,
	code,
	lang,
	preview,
	bare,
}: {
	title?: string | undefined
	description?: string | undefined
	code: string
	lang: CodeLang
	/** Without a preview, only the Code tab shows. */
	preview?: React.ReactNode | undefined
	/** Code only, slim header: the language name instead of tabs (markdown code fences). */
	bare?: boolean | undefined
}) {
	const L = useLabels()
	const hasPreview = preview !== undefined && preview !== null
	const [tab, setTab] = React.useState<"preview" | "code">(hasPreview ? "preview" : "code")
	const [copied, setCopied] = React.useState<"ok" | "fail" | null>(null)
	const ref = React.useRef<HTMLDivElement>(null)
	const copy = async () => {
		const ok = await copyText(code, ref.current)
		setCopied(ok ? "ok" : "fail")
		setTimeout(() => setCopied(null), COPIED_MS)
	}
	return (
		<div ref={ref} className="jd:flex jd:min-w-0 jd:flex-col jd:overflow-hidden jd:border-card-border jd:bg-card jd:rounded-lg jd:border jd:shadow-(--jds-card-shadow)" data-jd="codeview">
			{(title || description) && (
				<div className="jd:border-b jd:px-3 jd:py-2">
					{title && <div className="jd:text-[13px] jd:font-semibold">{title}</div>}
					{description && <div className="jd:text-muted-foreground jd:text-[12px]">{description}</div>}
				</div>
			)}
			<div className={cn("jd:flex jd:items-center jd:gap-1 jd:border-b jd:px-2", bare ? "jd:py-0.5" : "jd:py-1.5")}>
				{bare ? (
					<span className="jd:px-1 jd:font-mono jd:text-[11px] jd:text-muted-foreground" data-jd="code-lang">{lang}</span>
				) : (
				<SegmentedTabs
					surface="card"
					value={tab}
					onChange={(k) => setTab(k === "code" ? "code" : "preview")}
					items={[
						...(hasPreview ? [{ key: "preview", label: L.preview, attrs: { "data-jd-codetab": "preview" } }] : []),
						{ key: "code", label: L.code, attrs: { "data-jd-codetab": "code" } },
					]}
				/>
				)}
				<span className="jd:flex-1" />
				<Tip label={copied === "ok" ? L.copiedCode : copied === "fail" ? L.copyFailed : L.copyCode}>
					<Button variant="ghost" size="sm" aria-label={L.copyCode} className={ICON_BTN} data-jd="copy-code" data-jd-copied={copied ?? undefined} onClick={copy}>
						{copied === "ok" ? <Check className="jd:h-3.5 jd:w-3.5 jd:text-emerald-600" /> : <Copy className="jd:h-3.5 jd:w-3.5" />}
					</Button>
				</Tip>
				{/* Announce the copy result for screen readers (the button is icon-only). */}
				<span className="jd:sr-only" aria-live="polite">
					{copied === "ok" ? L.copiedCode : copied === "fail" ? L.copyFailed : ""}
				</span>
			</div>
			{/* Both stay mounted: switching tabs keeps the preview's state. */}
			<div hidden={tab !== "preview"} className={cn("jd:min-w-0 jd:p-2", tab !== "preview" && "jd:hidden")} data-jd="codeview-preview">
				{preview}
			</div>
			<div hidden={tab !== "code"} className={cn("jd:min-w-0", tab !== "code" && "jd:hidden")} data-jd="codeview-code">
				<CodeBlock code={code} lang={lang} />
			</div>
		</div>
	)
}
