import { useLabels } from "@/lib/labels"
import { Check } from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useListNavigation } from "../../keyboard/useListNavigation"
import type { ControlProps } from "./types"

type BooleanControlProps = ControlProps<boolean | undefined> & {
	trueLabel?: string | undefined
	falseLabel?: string | undefined
}

/**
 * Vertical-list True/False picker. Same nav pattern as Select/MultiSelect
 * so users get uniform ↑/↓ + Enter behavior across every filter type
 * (segmented horizontal layouts don't scale to many options).
 *
 * Hotkeys: T/Y → True, F/N → False (commit immediately).
 */
export function BooleanControl({
	value,
	onChange,
	onCommit,
	trueLabel,
	falseLabel,
}: BooleanControlProps) {
	const L = useLabels()
	const tLabel = trueLabel ?? L.trueLabel
	const fLabel = falseLabel ?? L.falseLabel
	const options = React.useMemo(
		() => [
			{ value: true, label: tLabel },
			{ value: false, label: fLabel },
		],
		[tLabel, fLabel],
	)

	const containerRef = React.useRef<HTMLDivElement>(null)

	const commit = (v: boolean) => {
		onChange(v)
		onCommit?.(v)
	}

	const nav = useListNavigation({
		count: options.length,
		onSelect: (i) => {
			const opt = options[i]
			if (opt) commit(opt.value)
		},
	})

	// Auto-focus + seed highlight from the initial value. Snapshot the inputs in
	// a ref so this runs mount-only (re-running on value change would steal focus)
	// while keeping the empty dep list exhaustive.
	const seedRef = React.useRef({ value, setActiveIndex: nav.setActiveIndex })
	React.useEffect(() => {
		const { value: v, setActiveIndex } = seedRef.current
		containerRef.current?.focus({ preventScroll: true })
		if (v === true) setActiveIndex(0)
		else if (v === false) setActiveIndex(1)
	}, [])

	// Y/T → True, F/N → False shortcut keys.
	const onKeyDown = (e: React.KeyboardEvent) => {
		const k = e.key.toLowerCase()
		if (k === "t" || k === "y") {
			e.preventDefault()
			commit(true)
			return
		}
		if (k === "n" || k === "f") {
			e.preventDefault()
			commit(false)
			return
		}
		nav.onKeyDown(e)
	}

	return (
		<div
			ref={containerRef}
			role="listbox"
			aria-label="Options"
			tabIndex={-1}
			onKeyDown={onKeyDown}
			className="jd:flex jd:flex-col jd:outline-none"
		>
			{options.map((opt, i) => {
				const isSelected = value === opt.value
				const isActive = nav.activeIndex === i
				return (
					<button
						key={String(opt.value)}
						type="button"
						tabIndex={-1}
						ref={nav.getItemRef(i)}
						onMouseMove={() => nav.setActiveIndex(i)}
						onClick={() => commit(opt.value)}
						className={cn(
							"jd:hover:bg-accent jd:flex jd:h-7 jd:w-full jd:items-center jd:gap-1.5 jd:rounded-sm jd:px-2 jd:text-left jd:text-xs jd:outline-none",
							isActive && "jd:bg-accent",
							isSelected && !isActive && "jd:bg-accent/50",
						)}
					>
						<span className="jd:flex-1 jd:truncate">{opt.label}</span>
						{isSelected && <Check className="jd:h-2.5 jd:w-2.5" />}
					</button>
				)
			})}
		</div>
	)
}
