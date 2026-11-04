import { useLabels } from "@/lib/labels"
import { Input } from "@/components/ui/input"
import type { ControlProps } from "./types"

/** "between" for numbers: min and max inputs; either side may be left empty (open range). */
export function NumberRangeControl({ value, onChange, onCommit, autoFocus }: ControlProps<[number | string, number | string]>) {
	const L = useLabels()
	const [lo, hi] = Array.isArray(value) ? value : ["", ""]
	const set = (i: 0 | 1, raw: string) => {
		const v = raw === "" ? "" : Number(raw)
		onChange(i === 0 ? [v, hi] : [lo, v])
	}
	const onKey = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault()
			onCommit?.()
		}
	}
	return (
		<div className="jd:flex jd:items-center jd:gap-1.5">
			<Input autoFocus={autoFocus} type="number" aria-label={L.min} placeholder={L.min} value={String(lo)} onChange={(e) => set(0, e.target.value)} onKeyDown={onKey} className="jd:h-7 jd:text-xs" />
			<span className="jd:text-muted-foreground jd:text-xs">–</span>
			<Input type="number" aria-label={L.max} placeholder={L.max} value={String(hi)} onChange={(e) => set(1, e.target.value)} onKeyDown={onKey} className="jd:h-7 jd:text-xs" />
		</div>
	)
}
