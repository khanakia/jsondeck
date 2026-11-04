import {
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-react"
import * as React from "react"
import {
	type DayButton,
	DayPicker,
	getDefaultClassNames,
} from "react-day-picker"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Calendar({
	className,
	classNames,
	showOutsideDays = true,
	captionLayout = "label",
	buttonVariant = "ghost",
	formatters,
	components,
	...props
}: React.ComponentProps<typeof DayPicker> & {
	buttonVariant?: React.ComponentProps<typeof Button>["variant"] | undefined
}) {
	const defaultClassNames = getDefaultClassNames()

	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			className={cn(
				"jd:group/calendar jd:bg-background jd:p-3 jd:[--cell-size:--spacing(8)] jd:[[data-slot=card-content]_&]:bg-transparent jd:[[data-slot=popover-content]_&]:bg-transparent",
				String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
				String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
				className,
			)}
			captionLayout={captionLayout}
			formatters={{
				formatMonthDropdown: (date) =>
					date.toLocaleString("default", { month: "short" }),
				...formatters,
			}}
			classNames={{
				root: cn("jd:w-fit", defaultClassNames.root),
				months: cn(
					"jd:relative jd:flex jd:flex-col jd:gap-4 jd:md:flex-row",
					defaultClassNames.months,
				),
				month: cn("jd:flex jd:w-full jd:flex-col jd:gap-4", defaultClassNames.month),
				nav: cn(
					"jd:absolute jd:inset-x-0 jd:top-0 jd:flex jd:w-full jd:items-center jd:justify-between jd:gap-1",
					defaultClassNames.nav,
				),
				button_previous: cn(
					buttonVariants({ variant: buttonVariant }),
					"jd:size-(--cell-size) jd:p-0 jd:select-none jd:aria-disabled:opacity-50",
					defaultClassNames.button_previous,
				),
				button_next: cn(
					buttonVariants({ variant: buttonVariant }),
					"jd:size-(--cell-size) jd:p-0 jd:select-none jd:aria-disabled:opacity-50",
					defaultClassNames.button_next,
				),
				month_caption: cn(
					"jd:flex jd:h-(--cell-size) jd:w-full jd:items-center jd:justify-center jd:px-(--cell-size)",
					defaultClassNames.month_caption,
				),
				dropdowns: cn(
					"jd:flex jd:h-(--cell-size) jd:w-full jd:items-center jd:justify-center jd:gap-1.5 jd:text-sm jd:font-medium",
					defaultClassNames.dropdowns,
				),
				dropdown_root: cn(
					"jd:relative jd:rounded-md jd:border jd:border-input jd:has-focus:border-ring jd:has-focus:ring-[3px] jd:has-focus:ring-ring/50",
					defaultClassNames.dropdown_root,
				),
				dropdown: cn(
					"jd:absolute jd:inset-0 jd:bg-popover jd:opacity-0",
					defaultClassNames.dropdown,
				),
				caption_label: cn(
					"jd:font-medium jd:select-none",
					captionLayout === "label"
						? "jd:text-sm"
						: "jd:flex jd:h-8 jd:items-center jd:gap-1 jd:rounded-md jd:pr-1 jd:pl-2 jd:text-sm jd:[&>svg]:size-3.5 jd:[&>svg]:text-muted-foreground",
					defaultClassNames.caption_label,
				),
				month_grid: cn("jd:w-full jd:border-collapse", defaultClassNames.month_grid),
				weekdays: cn("jd:flex", defaultClassNames.weekdays),
				weekday: cn(
					"jd:flex-1 jd:rounded-md jd:text-[0.8rem] jd:font-normal jd:text-muted-foreground jd:select-none",
					defaultClassNames.weekday,
				),
				week: cn("jd:mt-2 jd:flex jd:w-full", defaultClassNames.week),
				week_number_header: cn(
					"jd:w-(--cell-size) jd:select-none",
					defaultClassNames.week_number_header,
				),
				week_number: cn(
					"jd:text-[0.8rem] jd:text-muted-foreground jd:select-none",
					defaultClassNames.week_number,
				),
				day: cn(
					"jd:group/day jd:relative jd:aspect-square jd:h-full jd:w-full jd:p-0 jd:text-center jd:select-none jd:[&:last-child[data-selected=true]_button]:rounded-r-md",
					props.showWeekNumber
						? "jd:[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
						: "jd:[&:first-child[data-selected=true]_button]:rounded-l-md",
					defaultClassNames.day,
				),
				range_start: cn(
					"jd:rounded-l-md jd:bg-accent",
					defaultClassNames.range_start,
				),
				range_middle: cn("jd:rounded-none", defaultClassNames.range_middle),
				range_end: cn("jd:rounded-r-md jd:bg-accent", defaultClassNames.range_end),
				today: cn(
					"jd:rounded-md jd:bg-accent jd:text-accent-foreground jd:data-[selected=true]:rounded-none",
					defaultClassNames.today,
				),
				outside: cn(
					"jd:text-muted-foreground jd:aria-selected:text-muted-foreground",
					defaultClassNames.outside,
				),
				disabled: cn(
					"jd:text-muted-foreground jd:opacity-50",
					defaultClassNames.disabled,
				),
				hidden: cn("jd:invisible", defaultClassNames.hidden),
				...classNames,
			}}
			components={{
				Root: ({ className, rootRef, ...props }) => {
					return (
						<div
							data-slot="calendar"
							ref={rootRef}
							className={cn(className)}
							{...props}
						/>
					)
				},
				Chevron: ({ className, orientation, ...props }) => {
					if (orientation === "left") {
						return (
							<ChevronLeftIcon className={cn("jd:size-4", className)} {...props} />
						)
					}

					if (orientation === "right") {
						return (
							<ChevronRightIcon
								className={cn("jd:size-4", className)}
								{...props}
							/>
						)
					}

					return (
						<ChevronDownIcon className={cn("jd:size-4", className)} {...props} />
					)
				},
				DayButton: CalendarDayButton,
				WeekNumber: ({ children, ...props }) => {
					return (
						<td {...props}>
							<div className="jd:flex jd:size-(--cell-size) jd:items-center jd:justify-center jd:text-center">
								{children}
							</div>
						</td>
					)
				},
				...components,
			}}
			{...props}
		/>
	)
}

function CalendarDayButton({
	className,
	day,
	modifiers,
	...props
}: React.ComponentProps<typeof DayButton>) {
	const defaultClassNames = getDefaultClassNames()

	const ref = React.useRef<HTMLButtonElement>(null)
	React.useEffect(() => {
		if (modifiers.focused) ref.current?.focus()
	}, [modifiers.focused])

	return (
		<Button
			ref={ref}
			variant="ghost"
			size="icon"
			data-day={day.date.toLocaleDateString()}
			data-selected-single={
				modifiers.selected &&
				!modifiers.range_start &&
				!modifiers.range_end &&
				!modifiers.range_middle
			}
			data-range-start={modifiers.range_start}
			data-range-end={modifiers.range_end}
			data-range-middle={modifiers.range_middle}
			className={cn(
				"jd:flex jd:aspect-square jd:size-auto jd:w-full jd:min-w-(--cell-size) jd:flex-col jd:gap-1 jd:leading-none jd:font-normal jd:group-data-[focused=true]/day:relative jd:group-data-[focused=true]/day:z-10 jd:group-data-[focused=true]/day:border-ring jd:group-data-[focused=true]/day:ring-[3px] jd:group-data-[focused=true]/day:ring-ring/50 jd:data-[range-end=true]:rounded-md jd:data-[range-end=true]:rounded-r-md jd:data-[range-end=true]:bg-primary jd:data-[range-end=true]:text-primary-foreground jd:data-[range-middle=true]:rounded-none jd:data-[range-middle=true]:bg-accent jd:data-[range-middle=true]:text-accent-foreground jd:data-[range-start=true]:rounded-md jd:data-[range-start=true]:rounded-l-md jd:data-[range-start=true]:bg-primary jd:data-[range-start=true]:text-primary-foreground jd:data-[selected-single=true]:bg-primary jd:data-[selected-single=true]:text-primary-foreground jd:dark:hover:text-accent-foreground jd:[&>span]:text-xs jd:[&>span]:opacity-70",
				defaultClassNames.day,
				className,
			)}
			{...props}
		/>
	)
}

export { Calendar, CalendarDayButton }
