// Proves the config types catch mistakes: tsc on examples/typed-error.ts must
// fail, with an error on every line marked `// @expect-error`.
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const file = "examples/typed-error.ts"
const expected = readFileSync(file, "utf8").split("\n").flatMap((l, i) => (l.includes("@expect-error") ? [i + 1] : []))
let out = ""
try {
	execFileSync("npx", ["tsc", "--noEmit", "-p", "tsconfig.examples-error.json"], { encoding: "utf8", stdio: "pipe" })
} catch (e) {
	out = `${e.stdout ?? ""}${e.stderr ?? ""}`
}
if (!out) {
	console.error(`FAIL: ${file} type-checked cleanly, but it must not`)
	process.exit(1)
}
const lines = new Set([...out.matchAll(/typed-error\.ts\((\d+),/g)].map((m) => Number(m[1])))
const missed = expected.filter((l) => !lines.has(l))
if (missed.length) {
	console.error(`FAIL: no type error on line(s) ${missed.join(", ")} of ${file}\n${out}`)
	process.exit(1)
}
console.log(`ok: ${file} fails as expected (${expected.length} marked lines, ${lines.size} lines with errors)`)
