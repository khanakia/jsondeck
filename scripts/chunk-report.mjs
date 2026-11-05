// Prints what is inside each chunk of the last `pnpm analyze` run, grouped by
// package / source folder, largest first (sizes before minification, gzip per
// module, so use them to compare, not as final numbers; scripts/size.mjs has those).
//   node scripts/chunk-report.mjs [chunk-name-filter] [rows]
import { readFileSync } from "node:fs"

const stats = JSON.parse(readFileSync(new URL("../.analyze/stats.json", import.meta.url), "utf8"))
const [filter = "", rowsArg = "25"] = process.argv.slice(2)
const byChunk = new Map()
const keyOf = (id) => {
	const nm = id.lastIndexOf("node_modules/")
	if (nm >= 0) {
		const rest = id.slice(nm + 13).split("/")
		return rest[0].startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0]
	}
	const m = id.match(/src\/(.*)$/)
	return m ? `src/${m[1]}` : id
}
for (const meta of Object.values(stats.nodeMetas)) {
	for (const [chunk, uid] of Object.entries(meta.moduleParts)) {
		if (!chunk.includes(filter)) continue
		const part = stats.nodeParts[uid]
		const k = keyOf(meta.id)
		const agg = byChunk.get(chunk) ?? new Map()
		const cur = agg.get(k) ?? { raw: 0, gz: 0 }
		cur.raw += part.renderedLength
		cur.gz += part.gzipLength
		agg.set(k, cur)
		byChunk.set(chunk, agg)
	}
}
for (const [chunk, agg] of byChunk) {
	const rows = [...agg].sort((a, b) => b[1].raw - a[1].raw)
	const total = rows.reduce((s, [, v]) => s + v.raw, 0)
	console.log(`\n== ${chunk} (${(total / 1024).toFixed(1)} kB before minify)`)
	for (const [k, v] of rows.slice(0, Number(rowsArg))) console.log(`${(v.raw / 1024).toFixed(1).padStart(8)} ${(v.gz / 1024).toFixed(1).padStart(6)}  ${k}`)
}
