import { Input as InputPrimitive } from "@base-ui/react/input"
import type * as React from "react"

import { cn } from "@/lib/utils"

function Input({
	className,
	type,
	...props
}: InputPrimitive.Props & React.RefAttributes<HTMLInputElement>) {
	return (
		<InputPrimitive
			type={type}
			data-slot="input"
			// Plain flat input: 1px uniform border, NO shadow, NO inset-depth
			// trick. Visually quiet so the focus state (1px ring tighten) is
			// the only emphasis. Rounded-md (6px) matches the project radius.
			className={cn(
				"jd:file:text-foreground jd:placeholder:text-muted-foreground jd:selection:bg-primary jd:selection:text-primary-foreground jd:border-input jd:dark:bg-input/30 jd:flex jd:h-7 jd:w-full jd:min-w-0 jd:rounded-md jd:border jd:bg-background jd:px-2.5 jd:py-0.5 jd:text-[12px] jd:transition-colors jd:outline-none jd:file:inline-flex jd:file:h-6 jd:file:border-0 jd:file:bg-transparent jd:file:text-xs jd:file:font-medium jd:disabled:pointer-events-none jd:disabled:cursor-not-allowed jd:disabled:opacity-50",
				"jd:focus-visible:border-ring jd:focus-visible:ring-1 jd:focus-visible:ring-ring",
				"jd:aria-invalid:border-destructive jd:aria-invalid:ring-1 jd:aria-invalid:ring-destructive/30",
				className,
			)}
			{...props}
		/>
	)
}

export { Input }
