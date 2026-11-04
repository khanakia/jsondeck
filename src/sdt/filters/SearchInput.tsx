import { Search, X } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Kbd } from "../keyboard/Kbd"

type Props = {
	value: string
	onChange: (value: string) => void
	placeholder?: string | undefined
	/** Debounce ms before firing onChange. Default 300. */
	debounce?: number | undefined
	className?: string | undefined
	/** Forwarded ref so callers can imperatively focus (keyboard shortcut). */
	inputRef?: React.Ref<HTMLInputElement> | undefined
}

/**
 * Debounced full-text search input. Keeps the on-screen value snappy while
 * deferring the upstream `onChange` so we don't refetch on every keystroke.
 */
export function SearchInput({
	value,
	onChange,
	placeholder = "Search…",
	debounce = 300,
	className,
	inputRef,
}: Props) {
	const [local, setLocal] = React.useState(value)

	// Sync if external value changes (e.g. cleared by URL state)
	React.useEffect(() => {
		setLocal(value)
	}, [value])

	// Debounce push to upstream
	React.useEffect(() => {
		if (local === value) return
		const t = setTimeout(() => onChange(local), debounce)
		return () => clearTimeout(t)
	}, [local, value, debounce, onChange])

	return (
		<div className={cn("jd:relative jd:w-56 jd:max-w-full", className)}>
			<Search className="jd:text-muted-foreground jd:pointer-events-none jd:absolute jd:left-2 jd:top-1/2 jd:h-3 jd:w-3 jd:-translate-y-1/2" />
			<Input
				ref={inputRef}
				value={local}
				onChange={(e) => setLocal(e.target.value)}
				onKeyDown={(e) => {
					// Esc clears and leaves the box (useShortcuts skips inputs).
					if (e.key === "Escape") {
						setLocal("")
						onChange("")
						e.currentTarget.blur()
					}
				}}
				placeholder={placeholder}
				data-jd="search"
				className="jd:h-7 jd:pl-7 jd:pr-8 jd:text-xs"
			/>
			{local ? (
				<button
					type="button"
					onClick={() => {
						setLocal("")
						onChange("")
					}}
					className="jd:text-muted-foreground jd:hover:text-foreground jd:absolute jd:right-2 jd:top-1/2 jd:-translate-y-1/2"
					aria-label="Clear search"
				>
					<X className="jd:h-3 jd:w-3" />
				</button>
			) : (
				<span className="jd:pointer-events-none jd:absolute jd:right-1.5 jd:top-1/2 jd:-translate-y-1/2">
					<Kbd>/</Kbd>
				</span>
			)}
		</div>
	)
}
