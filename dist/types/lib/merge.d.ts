/**
 * A small class merger for our `jd:`-prefixed Tailwind v4 classes: when two
 * classes set the same thing ("jd:h-7 … jd:h-6"), the later one wins and the
 * earlier one is dropped, so a caller's `className` reliably overrides a
 * component's defaults. Classes without the `jd:` prefix are kept as they are.
 *
 * It replaces tailwind-merge (about 9 kB gzipped, the largest library in the
 * first download after React). It knows the utility families jsondeck and its
 * users' overrides use, not all of Tailwind; `scripts/check-merge.mjs` proves
 * it gives the same result as tailwind-merge for every pair of classes found
 * in src/, plus a list of common overrides, and runs with the checks.
 *
 * How it works: each class becomes a key, variants + important + a "group"
 * (what the utility sets, e.g. "h", "font-size", "text-color"). A later class
 * removes earlier classes with the same key, and also the narrower groups its
 * group covers (p covers px / pt / …; size covers w and h; inset covers top /
 * left / …), the same way tailwind-merge does.
 */
/** Merges a space-separated class string: for every conflict the later class wins. */
export declare function mergeClasses(input: string): string;
