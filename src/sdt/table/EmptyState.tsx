import { useLabels } from "@/lib/labels"
import { Inbox } from "lucide-react"
import type { ReactNode } from "react"

type Props = {
	message?: string | undefined
	description?: string | undefined
	action?: ReactNode | undefined
	filtered?: boolean | undefined
	onClearFilters?: (() => void) | undefined
}

export function EmptyState({
	message,
	description,
	action,
	filtered,
	onClearFilters,
}: Props) {
	const L = useLabels()
	return (
		<div className="jd:flex jd:flex-col jd:items-center jd:justify-center jd:py-16 jd:px-4 jd:text-center">
			<div className="jd:bg-muted/50 jd:text-muted-foreground jd:mb-4 jd:flex jd:h-12 jd:w-12 jd:items-center jd:justify-center jd:rounded-full">
				<Inbox className="jd:h-6 jd:w-6" />
			</div>
			<h3 className="jd:text-foreground jd:text-base jd:font-medium">
				{message ?? (filtered ? L.noResults : L.nothingToShow)}
			</h3>
			{description && (
				<p className="jd:text-muted-foreground jd:mt-1 jd:max-w-sm jd:text-sm">
					{description}
				</p>
			)}
			{filtered && onClearFilters && (
				<button
					type="button"
					onClick={onClearFilters}
					className="jd:text-primary jd:mt-4 jd:text-sm jd:hover:underline"
				>
					{L.clearFilters}
				</button>
			)}
			{!filtered && action && <div className="jd:mt-4">{action}</div>}
		</div>
	)
}
