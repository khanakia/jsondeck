// Post-process dist/types after `tsc -p tsconfig.build.json`:
//  - drop side-effect CSS imports (`import "./x.css"`): consumers resolve types,
//    not stylesheets, and TS errors on an unresolved side-effect import;
//  - rewrite the "@/components/ui/*" and "@/lib/*" source aliases to relative
//    paths, since a consumer's compiler does not know them.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative } from "node:path"

const ROOT = "dist/types"
const ALIASES = [
	["@/components/ui/", "ui/"],
	["@/lib/", "lib/"],
]
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
let changed = 0
for (const file of walk(ROOT).filter((f) => f.endsWith(".d.ts"))) {
	const src = readFileSync(file, "utf8")
	let out = src.replace(/^import ["'][^"']+\.css["'];?\n/gm, "")
	for (const [alias, target] of ALIASES) {
		out = out.replace(new RegExp(`(["'])${alias.replace(/[/@]/g, "\\$&")}`, "g"), (_m, q) => {
			let rel = relative(dirname(file), join(ROOT, target))
			if (!rel.startsWith(".")) rel = `./${rel}`
			return `${q}${rel}/`
		})
	}
	if (out !== src) {
		writeFileSync(file, out)
		changed++
	}
}
console.log(`fix-dts: ${changed} file(s) updated`)
