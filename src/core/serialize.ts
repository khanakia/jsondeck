/**
 * Config → source text for the Code tab. Pure. Functions are shown as their
 * own source (fn.toString()), so a copied snippet still runs. Also builds the
 * complete, copy-pasteable HTML page for an example.
 */

const IDENT = /^[A-Za-z_$][\w$]*$/

/** A JS object-literal rendering of a value (2-space indent, functions as source). */
export function toSource(value: unknown, indent = 0): string {
	const pad = "  ".repeat(indent)
	const inner = "  ".repeat(indent + 1)
	if (typeof value === "function") return reindent(value.toString(), pad)
	if (value === undefined) return "undefined"
	if (value === null || typeof value !== "object") return typeof value === "string" ? quote(value) : String(value)
	if (Array.isArray(value)) {
		if (value.length === 0) return "[]"
		const parts = value.map((v) => toSource(v, indent + 1))
		const flat = `[${parts.join(", ")}]`
		return flat.length <= 72 && !flat.includes("\n") ? flat : `[\n${parts.map((p) => inner + p).join(",\n")}\n${pad}]`
	}
	const entries = Object.entries(value).filter(([, v]) => v !== undefined)
	if (entries.length === 0) return "{}"
	const parts = entries.map(([k, v]) => `${IDENT.test(k) ? k : quote(k)}: ${toSource(v, indent + 1)}`)
	const flat = `{ ${parts.join(", ")} }`
	return flat.length <= 72 && !flat.includes("\n") ? flat : `{\n${parts.map((p) => inner + p).join(",\n")}\n${pad}}`
}

function quote(s: string): string {
	return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n")}'`
}

/** Re-indent a multi-line function body so it sits at the current depth. */
function reindent(src: string, pad: string): string {
	const lines = src.split("\n")
	if (lines.length === 1) return src
	const rest = lines.slice(1)
	const min = Math.min(...rest.filter((l) => l.trim()).map((l) => l.length - l.trimStart().length))
	return [lines[0], ...rest.map((l) => pad + l.slice(Number.isFinite(min) ? min : 0))].join("\n")
}

/** Keep the first `n` rows of every array in the data. */
export function trimData(data: unknown, n: number): unknown {
	if (Array.isArray(data)) return data.slice(0, n)
	if (data !== null && typeof data === "object") return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.slice(0, n) : v]))
	return data
}

export type SnippetOptions = {
	/** Version on the CDN URLs, without the "v" (served from the GitHub tag v<version> through jsDelivr). */
	version: string
	/** Rows kept per table in the embedded data. */
	rows?: number | undefined
}
/** Rows per table in a generated snippet: enough to see the features, short enough to read. */
export const SNIPPET_ROWS = 8

/** A complete HTML page: CDN tags, the data trimmed, and the mount call with the rest of the config. */
export function htmlSnippet(config: Record<string, unknown>, opts: SnippetOptions): string {
	const { data, ...rest } = config
	const json = JSON.stringify(trimData(data, opts.rows ?? SNIPPET_ROWS), null, 2).replace(/</g, "\\u003c")
	const cdn = `https://cdn.jsdelivr.net/gh/khanakia/jsondeck@v${opts.version}/dist`
	const cfg = toSource({ data: "#data", ...rest }, 0)
	return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${cdn}/jsondeck.css">
</head>
<body>
  <div id="app"></div>
  <script type="application/json" id="data">
${json}
  </script>
  <script src="${cdn}/jsondeck.js"></script>
  <script>
    JsonDeck.mount('#app', ${cfg.replace(/\n/g, "\n    ")})
  </script>
</body>
</html>
`
}
