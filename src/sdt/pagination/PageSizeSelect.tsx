import { useLabels } from "@/lib/labels"
import { fill } from "../../core/labels"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

type Props = {
	value: number
	options: number[]
	onChange: (size: number) => void
}

/**
 * Compact rows-per-page selector. Lives next to pagination.
 * Changing the value resets pagination to page 1 (handled by the reducer).
 */
export function PageSizeSelect({ value, options, onChange }: Props) {
	const L = useLabels()
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="jd:text-muted-foreground jd:hover:text-foreground jd:h-6 jd:gap-1 jd:px-1.5 jd:text-[11px] jd:tabular-nums"
					aria-label="Rows per page"
				>
					{fill(L.perPage, { n: value })}
					<ChevronDown className="jd:h-2.5 jd:w-2.5 jd:opacity-60" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="jd:min-w-0 jd:p-0.5">
				<DropdownMenuGroup>
					{options.map((opt) => {
						const active = value === opt
						return (
							<DropdownMenuItem
								key={opt}
								onClick={() => onChange(opt)}
								className={cn(
									"jd:h-7 jd:cursor-pointer jd:gap-1.5 jd:px-2 jd:py-0 jd:text-xs jd:tabular-nums",
									active && "jd:bg-accent",
								)}
							>
								<Check
									className={cn(
										"jd:h-2.5 jd:w-2.5 jd:shrink-0",
										active ? "jd:opacity-100" : "jd:opacity-0",
									)}
								/>
								{opt}
							</DropdownMenuItem>
						)
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
