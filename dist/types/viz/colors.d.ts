/** Number of categorical slots (--jdv-s1 … --jdv-s8). A ninth series folds into "Other". */
export declare const SLOT_COUNT = 8;
/** Named colours a spec may use instead of a hex value. */
export declare const NAMED_COLORS: readonly ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "good", "warning", "serious", "critical", "other", "muted"];
export type NamedColor = (typeof NAMED_COLORS)[number];
/** Severity words get status colours automatically when every key is one of these. */
export declare const SEVERITY_COLORS: Record<string, NamedColor>;
/** CSS colour for a name: a named token → var(--jdv-…), anything else is used as given (hex, rgb, var()). */
export declare function cssColor(c: string): string;
export declare const slotColor: (i: number) => string;
/** True when every value (ignoring Other / empty) is a severity word. */
export declare function isSeverityDomain(values: string[]): boolean;
/**
 * Build `value → css colour` for one coloured dimension.
 * @param values  the values being drawn, in draw order
 * @param domain  stable order to assign slots from (defaults to `values`)
 * @param explicit spec overrides (`{ critical: "#d03b3b", web: "s3" }`)
 */
export declare function colorScale(values: string[], domain?: string[], explicit?: Record<string, string>): (v: string) => string;
