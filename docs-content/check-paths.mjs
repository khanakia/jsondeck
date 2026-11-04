// Checks that every config path named in features.json and in the guides exists
// in config-reference.json. Run from the repo root: node docs-content/check-paths.mjs
import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const ref = JSON.parse(readFileSync(join(here, "config-reference.json"), "utf8"))
const known = new Set(ref.map((r) => r.path))
const bad = []

// features.json: comma-separated config paths.
for (const f of JSON.parse(readFileSync(join(here, "features.json"), "utf8"))) {
	for (const p of (f.config ?? "").split(",").map((s) => s.trim()).filter(Boolean)) if (!known.has(p)) bad.push(`features.json ${f.id}: ${p}`)
}
// Guides: inline-code paths that look like config paths (tables.<table>…, pages[]…, guess.…).
for (const file of readdirSync(join(here, "guides"))) {
	const text = readFileSync(join(here, "guides", file), "utf8")
	for (const m of text.matchAll(/`((?:tables|pages|guess|types|relations|views)(?:\.|\[\])[^`\s(]*)`/g)) {
		const p = m[1].replace(/\(.*$/, "")
		if (!known.has(p)) bad.push(`guides/${file}: ${p}`)
	}
}
if (bad.length) {
	console.log(`${bad.length} unknown config path(s):`)
	for (const b of bad) console.log(`  ${b}`)
	process.exit(1)
}
console.log(`all config paths found (${known.size} known keys)`)
