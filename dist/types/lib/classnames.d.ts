/**
 * User class names per slot (config `classNames`), merged global → table →
 * item. Applied as given (not jd-prefixed) so host CSS or host Tailwind works.
 */
import * as React from "react";
import { type ClassNames } from "../core/theme-tokens";
export declare const ClassNamesContext: React.Context<ClassNames>;
export declare function useClassNames(): ClassNames;
/** Merge slot maps: later ones add to (not replace) earlier ones. */
export declare function mergeClassNames(...maps: (ClassNames | undefined)[]): ClassNames;
