// Proves src/lib/merge.ts (our small class merger) matches tailwind-merge for
// jsondeck's own classes: every class used in src/, plus a list of common
// overrides a user might pass through `className` / `classNames`, is merged
// against every other one ("a b", in both orders) with both mergers and the
// results compared. tailwind-merge is a dev dependency only for this check.
//   node scripts/check-merge.mjs        (exit 1 on any difference)
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { extendTailwindMerge } from "tailwind-merge"
import { mergeClasses } from "../src/lib/merge.ts"

const twMerge = extendTailwindMerge({ prefix: "jd" })
const SRC = new URL("../src/", import.meta.url).pathname
const found = new Set()
const literals = new Set()
const walk = (d) => {
	for (const n of readdirSync(d)) {
		const p = join(d, n)
		if (statSync(p).isDirectory()) walk(p)
		else if (/\.tsx?$/.test(n)) for (const m of readFileSync(p, "utf8").matchAll(/jd:[^\s"'`{}]+/g)) if (!/[$\\]/.test(m[0])) found.add(m[0])
		if (/\.tsx?$/.test(n)) for (const m of readFileSync(p, "utf8").matchAll(/"((?:jd:[^\s"]+\s*){2,})"/g)) literals.add(m[1].trim())
	}
}
walk(SRC)
// Common overrides beyond what src/ uses today.
const EXTRA = `p-0 p-4 px-0 px-4 py-0 py-2 pt-1 pl-2 m-0 m-2 mx-auto my-4 mt-0 ml-auto w-full w-auto w-10 w-[200px] h-full h-auto h-8 h-[300px] size-4 size-full min-w-0 max-w-sm max-w-none
 text-xs text-sm text-base text-lg text-xl text-2xl text-[12px] text-[0.8rem] text-red-500 text-white text-black text-inherit text-current text-left text-center text-right
 font-normal font-medium font-semibold font-bold font-mono font-sans leading-none leading-tight leading-6 tracking-tight
 bg-white bg-black bg-transparent bg-red-500 bg-red-500/50 bg-muted bg-primary/10 bg-none
 border border-0 border-2 border-t border-b-2 border-x border-red-500 border-transparent border-dashed border-none border-l-red-500
 rounded rounded-none rounded-md rounded-lg rounded-full rounded-t-md rounded-l-lg rounded-tl-sm
 shadow shadow-none shadow-sm shadow-lg shadow-red-500 ring ring-0 ring-2 ring-red-500 outline outline-0 outline-2 outline-red-500 outline-none outline-dashed
 flex grid block hidden inline-flex inline-block contents flex-row flex-col flex-wrap items-center items-start justify-between justify-end gap-0 gap-2 gap-x-4 gap-y-1
 overflow-hidden overflow-auto overflow-x-auto overflow-y-hidden truncate whitespace-nowrap whitespace-normal break-words
 absolute relative fixed sticky inset-0 inset-x-0 top-0 left-0 right-2 bottom-0 z-10 z-50
 opacity-0 opacity-50 cursor-pointer cursor-default select-none pointer-events-none
 grid-cols-2 grid-cols-3 col-span-2 col-span-full
 hover:bg-muted hover:text-foreground focus:ring-2 dark:bg-zinc-900 dark:text-white md:grid-cols-2 max-md:hidden
 !p-0 p-0! -mt-1 -mx-2 translate-x-1 -translate-y-1 rotate-90 uppercase italic underline tabular-nums`.split(/\s+/).filter(Boolean).map((c) => `jd:${c}`)
const all = [...new Set([...found, ...EXTRA, "plain-class", "other"])]
let diffs = 0
const shown = []
for (const a of all)
	for (const b of all) {
		const input = `${a} ${b}`
		const want = twMerge(input)
		const got = mergeClasses(input)
		if (want !== got) {
			diffs++
			if (shown.length < 40) shown.push(`  "${input}"  tailwind-merge: "${want}"  ours: "${got}"`)
		}
	}
// Real class lists from src/ (component defaults) with each class appended as an override.
let listCases = 0
for (const base of literals)
	for (const t of all) {
		const input = `${base} ${t}`
		listCases++
		const want = twMerge(input)
		const got = mergeClasses(input)
		if (want !== got) {
			diffs++
			if (shown.length < 40) shown.push(`  "${input}"  tailwind-merge: "${want}"  ours: "${got}"`)
		}
	}
console.log(`check-merge: ${all.length} classes, ${all.length * all.length} pairs + ${listCases} class lists with an override, ${diffs} differences`)
for (const s of shown) console.log(s)
process.exit(diffs ? 1 : 0)
