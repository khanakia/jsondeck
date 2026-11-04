import { type ClassValue, clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/** tailwind-merge told about our Tailwind v4 prefix, so "jd:h-6 jd:h-7" merges to "jd:h-7". */
const twMerge = extendTailwindMerge({ prefix: "jd" })

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}
