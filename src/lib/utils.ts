import { type ClassValue, clsx } from "clsx"
import { mergeClasses } from "./merge"

/** Joins class values and resolves conflicts between our `jd:` utilities (the later one wins; see merge.ts). */
export function cn(...inputs: ClassValue[]) {
	return mergeClasses(clsx(inputs))
}
