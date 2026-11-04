import type * as React from "react"
import { cn } from "@/lib/utils"

export function Table({ className, ...props }: React.ComponentProps<"table">) {
	return (
		<div className="jd:w-full ">
			<table
				className={cn("jd:w-full jd:caption-bottom jd:text-sm", className)}
				{...props}
			/>
		</div>
	)
}
export function THead(props: React.ComponentProps<"thead">) {
	return (
		<thead
			className="jd:bg-muted/40 jd:[&_tr]:border-b jd:[&_tr]:border-border"
			{...props}
		/>
	)
}
export function TBody(props: React.ComponentProps<"tbody">) {
	return <tbody className="jd:[&_tr:last-child]:border-0" {...props} />
}
export function TR({ className, ...props }: React.ComponentProps<"tr">) {
	return (
		<tr
			className={cn(
				"jd:border-b jd:border-border jd:transition-colors jd:hover:bg-muted/60",
				className,
			)}
			{...props}
		/>
	)
}
export function TH({ className, ...props }: React.ComponentProps<"th">) {
	return (
		<th
			className={cn(
				"jd:h-11 jd:px-4 jd:text-left jd:align-middle jd:text-[11px] jd:font-semibold jd:uppercase jd:tracking-wider jd:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	)
}
export function TD({ className, ...props }: React.ComponentProps<"td">) {
	return <td className={cn("jd:px-4 jd:py-3 jd:align-middle", className)} {...props} />
}

// Aliases — the table components import these names.
export const TableHeader = THead
export const TableBody = TBody
export const TableRow = TR
export const TableHead = TH
export const TableCell = TD
