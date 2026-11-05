// Bundle analysis: the normal IIFE build plus a treemap of what is inside it.
//   pnpm analyze   -> .analyze/stats.html (open in a browser) and .analyze/stats.json
// Sizes in the treemap are before minification; scripts/size.mjs gives the real ones.
import { visualizer } from "rollup-plugin-visualizer"
import { mergeConfig } from "vite"
import base from "./vite.config"
// (vite.config.ts is the split build, so the treemap and scripts/chunk-report.mjs show every chunk.)

export default mergeConfig(base, {
	plugins: [
		visualizer({ filename: ".analyze/stats.html", template: "treemap", gzipSize: true, brotliSize: true }),
		visualizer({ filename: ".analyze/stats.json", template: "raw-data", gzipSize: true }),
	],
	build: { outDir: ".analyze/out" },
})
