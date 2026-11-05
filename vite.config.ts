// The split build behind the classic <script> loader (dist/jsondeck.js): an ES
// module entry dist/chunks/index.js, the code every page needs in
// dist/chunks/core.js, and one chunk per on-demand part (popups, charts,
// calendar, drawer, editor, ...) next to them. These chunks hold only our own
// code: React, Base UI, react-day-picker and the other libraries stay bare
// imports ("react", "@base-ui/react/menu", ...) that the loader's import map
// points at exact versions on the CDN (vite.shared.ts EXTERNALS).
// Other builds: vite.full.config.ts (single offline file, runs first and
// empties dist/), vite.esm.config.ts (module build for React apps),
// vite.loader.config.ts (the loader itself, runs after this one).
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { ALIASES, CHUNK_NAMES, CODE_SPLITTING, DEFINE, EXTERNALS, MINIFY_ESM, lucideLite } from "./vite.shared"

export default defineConfig({
	plugins: [lucideLite(), react(), tailwindcss()],
	resolve: { alias: ALIASES },
	define: { ...DEFINE, __JSONDECK_EXTERNALS__: "true" },
	build: {
		outDir: "dist",
		emptyOutDir: false,
		cssCodeSplit: false,
		sourcemap: true,
		...MINIFY_ESM,
		lib: { entry: "src/split.ts", formats: ["es"], fileName: () => "chunks/index.js", cssFileName: "jsondeck" },
		rollupOptions: { external: (id) => EXTERNALS.test(id), output: { chunkFileNames: (c) => `chunks/${CHUNK_NAMES(c)}`, codeSplitting: CODE_SPLITTING } },
	},
})
