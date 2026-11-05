// The classic <script> loader: dist/jsondeck.js (global `JsonDeck`), a few kB
// with no React in it (src/loader.ts); it carries the import map that points
// every third-party library at the CDN. Runs after the split build
// (vite.config.ts), because it reads which chunks dist/chunks/index.js imports
// statically and preloads them in parallel with it.
import { readdirSync, readFileSync } from "node:fs"
import { defineConfig } from "vite"
import { ALIASES, DEFINE, MINIFY } from "./vite.shared"

/** Static `import … from "./x.js"` targets of a built chunk (minified: no spaces needed around `from`). */
const staticImports = (file: string): string[] => {
	const code = readFileSync(new URL(`./dist/chunks/${file}`, import.meta.url), "utf8")
	return [...code.matchAll(/(?:^|[;\s}])import\s*(?:[^"';]*?from\s*)?["']\.\/([^"']+)["']/g)].flatMap((m) => (m[1] ? [m[1]] : []))
}
/** Everything dist/chunks/index.js needs before it can run, transitively ("chunks/core.js", …). */
const seen = new Set<string>()
const walk = (file: string) => {
	for (const dep of staticImports(file)) {
		if (seen.has(dep)) continue
		seen.add(dep)
		walk(dep)
	}
}
walk("index.js")
const preload = [...seen].map((f) => `chunks/${f}`)

// Every bare import left in any chunk must be in the import map the loader
// installs (src/externals/map.gen.ts), or the browser cannot resolve it.
const mapText = readFileSync(new URL("./src/externals/map.gen.ts", import.meta.url), "utf8")
const mapped = new Set([...mapText.matchAll(/^\t"([^"]+)": "https:/gm)].flatMap((m) => (m[1] ? [m[1]] : [])))
const unmapped = new Set<string>()
for (const file of readdirSync(new URL("./dist/chunks/", import.meta.url)).filter((f) => f.endsWith(".js"))) {
	const code = readFileSync(new URL(`./dist/chunks/${file}`, import.meta.url), "utf8")
	for (const m of code.matchAll(/(?:^|[;\s}])(?:import|export)\s*(?:[^"';]*?from\s*)?["']([^"'./][^"']*)["']|import\(\s*["']([^"'./][^"']*)["']\s*\)/g)) {
		const spec = m[1] ?? m[2]
		if (spec && !mapped.has(spec)) unmapped.add(`${spec} (in ${file})`)
	}
}
if (unmapped.size) throw new Error(`vite.loader.config: bare imports with no import-map entry: ${[...unmapped].join(", ")}. Run node scripts/gen-externals.mjs (and add the package to its ENTRIES).`)
if (preload.length === 0) throw new Error("vite.loader.config: dist/chunks/index.js imports no chunk; run the split build first")

export default defineConfig({
	resolve: { alias: ALIASES },
	define: { ...DEFINE, __JSONDECK_PRELOAD__: JSON.stringify(preload) },
	build: {
		outDir: "dist",
		emptyOutDir: false,
		sourcemap: true,
		...MINIFY,
		lib: { entry: "src/loader.ts", name: "JsonDeck", formats: ["iife"], fileName: () => "jsondeck.js" },
		rollupOptions: { output: { exports: "default" } },
	},
})
