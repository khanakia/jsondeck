/**
 * A small syntax highlighter for the Code tab: JS/TS (also JSON) and HTML
 * (with JS inside <script>). Pure: text in, tokens out; the component maps
 * token kinds to colours. Good enough for config snippets, not a parser.
 */

export const TOKEN_KINDS = ["plain", "comment", "string", "number", "keyword", "literal", "punct", "tag", "attr", "property"] as const
export type TokenKind = (typeof TOKEN_KINDS)[number]
export type Token = { kind: TokenKind; text: string }
export const CODE_LANGS = ["js", "ts", "json", "html"] as const
export type CodeLang = (typeof CODE_LANGS)[number]

const KEYWORDS = new Set([
	"const", "let", "var", "function", "return", "if", "else", "for", "of", "in", "new", "import", "from", "export",
	"type", "interface", "as", "await", "async", "typeof", "default", "class", "extends", "while", "switch", "case", "break",
])
const LITERALS = new Set(["true", "false", "null", "undefined"])

/** One regex, alternatives in priority order; group index → token kind. */
const JS_RE =
	/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\b\d[\d_.]*(?:e[+-]?\d+)?\b)|([A-Za-z_$][\w$]*)(\s*:)?|([{}()[\];,.=<>+\-*/!?:&|%])/g

export function highlightJs(src: string): Token[] {
	const out: Token[] = []
	let last = 0
	for (const m of src.matchAll(JS_RE)) {
		const i = m.index ?? 0
		if (i > last) out.push({ kind: "plain", text: src.slice(last, i) })
		const [whole, comment, str, num, word, colon, punct] = m
		if (comment) out.push({ kind: "comment", text: comment })
		else if (str) out.push({ kind: "string", text: str })
		else if (num) out.push({ kind: "number", text: num })
		else if (word) {
			const kind: TokenKind = KEYWORDS.has(word) ? "keyword" : LITERALS.has(word) ? "literal" : colon ? "property" : "plain"
			out.push({ kind, text: word })
			if (colon) out.push({ kind: "punct", text: colon })
		} else if (punct) out.push({ kind: "punct", text: punct })
		else out.push({ kind: "plain", text: whole })
		last = i + whole.length
	}
	if (last < src.length) out.push({ kind: "plain", text: src.slice(last) })
	return out
}

const TAG_RE = /<!--[\s\S]*?-->|<\/?[A-Za-z!][^>]*>/g
const ATTR_RE = /([\w:-]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)?/g

function highlightTag(tag: string): Token[] {
	if (tag.startsWith("<!--")) return [{ kind: "comment", text: tag }]
	const m = tag.match(/^(<\/?[\w!-]+)([\s\S]*?)(\/?>)$/)
	if (!m) return [{ kind: "tag", text: tag }]
	const [, open = "", rest = "", close = ""] = m
	const out: Token[] = [{ kind: "tag", text: open }]
	let last = 0
	for (const a of rest.matchAll(ATTR_RE)) {
		const i = a.index ?? 0
		if (i > last) out.push({ kind: "plain", text: rest.slice(last, i) })
		out.push({ kind: "attr", text: a[1] ?? "" })
		if (a[2]) out.push({ kind: "punct", text: a[2] })
		if (a[3]) out.push({ kind: "string", text: a[3] })
		last = i + a[0].length
	}
	if (last < rest.length) out.push({ kind: "plain", text: rest.slice(last) })
	out.push({ kind: "tag", text: close })
	return out
}

/** HTML: tags + attributes; the body of <script> is highlighted as JS (JSON data tags too). */
export function highlightHtml(src: string): Token[] {
	const out: Token[] = []
	let last = 0
	let inScript = false
	for (const m of src.matchAll(TAG_RE)) {
		const i = m.index ?? 0
		const tag = m[0]
		if (i > last) {
			const text = src.slice(last, i)
			if (inScript) out.push(...highlightJs(text))
			else out.push({ kind: "plain", text })
		}
		out.push(...highlightTag(tag))
		if (/^<script\b/i.test(tag)) inScript = true
		else if (/^<\/script/i.test(tag)) inScript = false
		last = i + tag.length
	}
	if (last < src.length) out.push({ kind: "plain", text: src.slice(last) })
	return out
}

export function highlight(src: string, lang: CodeLang): Token[] {
	return lang === "html" ? highlightHtml(src) : highlightJs(src)
}
