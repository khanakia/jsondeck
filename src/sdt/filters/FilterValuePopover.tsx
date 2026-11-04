import { opLabel, useLabels } from "@/lib/labels"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { FilterFieldDef, FilterOperator } from "../types"
import { ControlSwitch, needsApplyButton } from "./ControlSwitch"
import { operatorArity, operatorsForField } from "./operators"

type Props<TWhere> = {
	field: FilterFieldDef<TWhere>
	initialOperator: FilterOperator
	initialValue: unknown
	/** When true, caller controls open state via `open`/`onOpenChange`. */
	controlled?: boolean | undefined
	open?: boolean | undefined
	onOpenChange?: ((open: boolean) => void) | undefined
	trigger?: React.ReactNode | undefined
	onApply: (cond: {
		operator: FilterOperator
		value: unknown
		labels?: Record<string, string> | undefined
	}) => void
	onCancel?: (() => void) | undefined
}

/**
 * Standalone operator + value editor popover. Used to edit an existing
 * filter pill (the pill itself is the trigger).
 *
 * For the "new filter" flow, `FilterPicker` does the same job inline
 * within its own popover so it can show the field-picker first.
 */
export function FilterValuePopover<TWhere>({
	field,
	initialOperator,
	initialValue,
	controlled = false,
	open: openProp,
	onOpenChange,
	trigger,
	onApply,
	onCancel,
}: Props<TWhere>) {
	const L = useLabels()
	const [internalOpen, setInternalOpen] = React.useState(!controlled)
	const open = controlled ? (openProp ?? false) : internalOpen
	const setOpen = (o: boolean) => {
		if (controlled) {
			onOpenChange?.(o)
		} else {
			setInternalOpen(o)
			if (!o) onCancel?.()
		}
	}

	const [operator, setOperator] =
		React.useState<FilterOperator>(initialOperator)
	const [value, setValue] = React.useState<unknown>(initialValue)
	const [labels, setLabels] = React.useState<Record<string, string>>({})

	// Reset value when an operator with arity 0 is picked. Functional update so
	// the effect depends only on `operator` (not `value`) — re-running on every
	// value change would fight the user's typing; this preserves that intent
	// while keeping the dep list exhaustive.
	React.useEffect(() => {
		if (operatorArity[operator] === 0) {
			setValue((v: unknown) => (v !== undefined ? undefined : v))
		}
	}, [operator])

	const operators = operatorsForField(field.type, field.operators)
	const showOperatorPicker = operators.length > 1
	const arity = operatorArity[operator]

	const commit = (overrideValue?: unknown) => {
		const v = overrideValue !== undefined ? overrideValue : value
		if (arity === 0 || isValidValue(arity, v)) {
			onApply({
				operator,
				value: v,
				...(Object.keys(labels).length > 0 ? { labels } : {}),
			})
			setOpen(false)
		}
	}

	const widthClass =
		field.type === "date" || field.type === "date-range" ? "jd:w-auto" : "jd:w-72"

	return (
		<Popover open={open} onOpenChange={setOpen}>
			{trigger && (
				// FilterPill renders a styled <div> (not a <button>). base-ui's
				// default `nativeButton: true` warns about lost button semantics —
				// pass `false` so it knows the non-button is intentional.
				<PopoverTrigger asChild nativeButton={false}>
					{trigger}
				</PopoverTrigger>
			)}
			<PopoverContent align="start" className={cn("jd:p-0 jd:shadow-md", widthClass)}>
				<div className="jd:flex jd:items-center jd:justify-between jd:gap-2 jd:border-b jd:px-3 jd:py-2">
					<div className="jd:flex jd:items-center jd:gap-2 jd:truncate">
						{field.icon && <field.icon className="jd:h-3.5 jd:w-3.5 jd:shrink-0" />}
						<span className="jd:truncate jd:text-sm jd:font-medium">{field.label}</span>
					</div>
					{showOperatorPicker ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="jd:text-muted-foreground jd:h-6 jd:px-2 jd:text-xs"
								>
									{opLabel(L, operator, field.type)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuGroup>
									<DropdownMenuLabel>{L.operator}</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{operators.map((op) => (
										<DropdownMenuItem key={op} onClick={() => setOperator(op)}>
											{opLabel(L, op, field.type)}
										</DropdownMenuItem>
									))}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<span className="jd:text-muted-foreground jd:text-xs">
							{opLabel(L, operator, field.type)}
						</span>
					)}
				</div>

				{arity > 0 && (
					<div className="jd:p-2">
						<ControlSwitch
							field={field}
							operator={operator}
							value={value}
							onChange={setValue}
							onCommit={commit}
							onLabelsChange={setLabels}
						/>
					</div>
				)}

				{(arity === 0 || needsApplyButton(field.type, operator)) && (
					<div className="jd:flex jd:justify-end jd:border-t jd:p-2">
						<Button
							type="button"
							size="sm"
							onClick={() => commit()}
							className="jd:h-7"
						>
							{L.apply}
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}

function isValidValue(arity: 0 | 1 | 2, value: unknown): boolean {
	if (arity === 0) return true
	if (value === undefined || value === null || value === "") return false
	if (Array.isArray(value) && value.length === 0) return false
	return true
}
