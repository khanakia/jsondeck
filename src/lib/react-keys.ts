/**
 * stableKeys — build N stable string keys for a FIXED-COUNT placeholder list
 * (skeleton rows, slider thumbs, loading cards) that never reorders.
 *
 * Why it exists: React needs a key on every list child, but the raw array index
 * is banned (biome lint/suspicious/noArrayIndexKey) because index keys corrupt
 * component state when a list reorders. Placeholder lists never reorder, yet
 * still need NON-index keys — this returns `${prefix}-0`, `${prefix}-1`, … so the
 * render maps over string keys, not the index argument. Prefix keeps keys unique
 * when several such lists render in one parent.
 */
export function stableKeys(prefix: string, count: number): string[] {
	return Array.from({ length: count }, (_, i) => `${prefix}-${i}`)
}
