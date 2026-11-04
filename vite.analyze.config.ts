import base from "./vite.config.ts"
import { visualizer } from "rollup-plugin-visualizer"
import { mergeConfig } from "vite"
export default mergeConfig(base, { plugins: [visualizer({ filename: ".analyze/jd-stats.json", template: "raw-data", gzipSize: true })], build: { outDir: ".analyze/jd-analyze-out" } })
