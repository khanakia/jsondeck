import { cn } from "@/lib/utils"

/**
 * Small keyboard-key visual indicator. Drop it next to a label or
 * inside a tooltip to telegraph the shortcut.
 *
 *   <Kbd>/</Kbd>   <Kbd>Esc</Kbd>   <Kbd>Cmd</Kbd>+<Kbd>K</Kbd>
 */
export function Kbd({
	children,
	className,
}: {
	children: React.ReactNode
	className?: string | undefined
}) {
	return (
		<kbd
			className={cn(
				"jd:border-border jd:bg-muted jd:text-muted-foreground jd:inline-flex jd:h-4 jd:min-w-4 jd:items-center jd:justify-center jd:rounded jd:border jd:px-1 jd:font-mono jd:text-[10px] jd:leading-none",
				className,
			)}
		>
			{children}
		</kbd>
	)
}
