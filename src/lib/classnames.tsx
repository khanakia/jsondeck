/**
 * User class names per slot (config `classNames`), merged global → table →
 * item. Applied as given (not jd-prefixed) so host CSS or host Tailwind works.
 */
import * as React from "react"
import { CLASS_SLOTS, type ClassNames } from "../core/theme-tokens"

export const ClassNamesContext = React.createContext<ClassNames>({})

export function useClassNames(): ClassNames {
	return React.useContext(ClassNamesContext)
}

/** Merge slot maps: later ones add to (not replace) earlier ones. */
export function mergeClassNames(...maps: (ClassNames | undefined)[]): ClassNames {
	const out: ClassNames = {}
	for (const m of maps)
		for (const slot of CLASS_SLOTS) {
			const v = m?.[slot]
			if (!v) continue
			const prev = out[slot]
			out[slot] = prev ? `${prev} ${v}` : v
		}
	return out
}
