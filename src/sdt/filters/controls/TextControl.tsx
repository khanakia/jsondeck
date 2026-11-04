import { useLabels } from "@/lib/labels"
import { Input } from "@/components/ui/input"
import type { ControlProps } from "./types"

export function TextControl({
	value,
	onChange,
	onCommit,
	autoFocus,
}: ControlProps<string>) {
	const L = useLabels()
	return (
		<Input
			autoFocus={autoFocus}
			value={value ?? ""}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					e.preventDefault()
					onCommit?.()
				}
			}}
			placeholder={L.valuePlaceholder}
			className="jd:h-7 jd:text-xs"
		/>
	)
}
