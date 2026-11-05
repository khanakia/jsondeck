// Loaded when a date filter's calendar starts loading, in
// the <script> build only: preloads react-day-picker and date-fns from the CDN in
// parallel. See src/externals/calendar.gen.ts.
import { preloadExternals } from "../lib/importmap"
import { FILES } from "./calendar.gen"

/** Start fetching every CDN file of this part in parallel. */
export const preload = (): void => preloadExternals(FILES)
