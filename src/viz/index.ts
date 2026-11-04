/** Public surface of the viz layer: components plus the pure helpers they use. */
export { Chart, CHART_TYPES, type ChartProps, type ChartSpec, type ChartType, Sparkline } from "./Chart"
export { StatTile, type StatSpec, type StatTileProps } from "./StatTile"
export { KeyValueCard, type KVField, type KVSpec, type KeyValueCardProps } from "./KeyValueCard"
export { Markdown, safeHref } from "./Markdown"
export { colorScale, cssColor, NAMED_COLORS, SEVERITY_COLORS } from "./colors"
export { formatNumber, formatPercent, formatValue, niceTicks } from "./format"
export * from "../core/aggregate"
export * from "../core/relations"
