import { Check } from "lucide-react"
import { PageSizeTrigger } from "../toolbar/triggers"
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
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<PageSizeTrigger value={value} />
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
