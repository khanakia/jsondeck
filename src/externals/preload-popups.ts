// Loaded the moment the popups chunk starts loading, in
// the <script> build only: preloads Base UI and its helpers from the CDN in
// parallel, instead of one import level at a time. See src/externals/popups.gen.ts.
import { preloadExternals } from "../lib/importmap"
import { FILES } from "./popups.gen"

/** Start fetching every CDN file of this part in parallel. */
export const preload = (): void => preloadExternals(FILES)
