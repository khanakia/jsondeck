import { type ClassValue } from "clsx";
/** Joins class values and resolves conflicts between our `jd:` utilities (the later one wins; see merge.ts). */
export declare function cn(...inputs: ClassValue[]): string;
