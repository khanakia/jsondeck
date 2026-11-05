// The classic <script> loader: dist/jsondeck.js (global `JsonDeck`), a few kB
// with no React in it (src/loader.ts). Runs after the split build
// (vite.config.ts), because it reads which chunks dist/chunks/index.js imports
// statically and preloads them in parallel with it.
import { readFileSync } from "node:fs"
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
