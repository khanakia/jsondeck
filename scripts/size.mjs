// Prints raw, gzip and brotli sizes for every built file in dist/ (maps and
// types skipped), so size changes can be measured before and after a build.
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { brotliCompressSync, constants, gzipSync } from "node:zlib"

const DIR = process.argv[2] ?? "dist"
const kb = (n) => `${(n / 1024).toFixed(1)} kB`
const rows = []
for (const name of readdirSync(DIR).sort()) {
	const path = join(DIR, name)
	if (!statSync(path).isFile() || name.endsWith(".map")) continue
	const buf = readFileSync(path)
	const gz = gzipSync(buf, { level: 9 }).length
	const br = brotliCompressSync(buf, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
	rows.push({ file: name, raw: kb(buf.length), gzip: kb(gz), brotli: kb(br) })
}
console.table(rows)
if (process.argv.includes("--json")) console.log(JSON.stringify(rows))
