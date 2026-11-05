import { useLabels } from "@/lib/labels"
import { Button } from "@/components/ui/button"
import type { FilterCondition, FilterFieldDef, SearchConfig } from "../types"
import { FilterPicker, FilterPill } from "../toolbar/controls"
import { SearchInput } from "./SearchInput"

type Props<TWhere> = {
	fields: FilterFieldDef<TWhere>[]
	conditions: FilterCondition[]
	search?: SearchConfig<TWhere> | undefined
	searchValue: string
	onSearchChange: (value: string) => void
	onAddFilter: (cond: FilterCondition) => void
	onUpdateFilter: (cond: FilterCondition) => void
	onRemoveFilter: (id: string) => void
	onClearFilters: () => void
	/** Right-side toolbar slot for the sort dropdown / view selector */
	rightSlot?: React.ReactNode | undefined
	/** Imperative open of the filter picker (for keyboard / column header) */
	pickerOpen?: boolean | undefined
	onPickerOpenChange?: ((open: boolean) => void) | undefined
	pickerInitialField?: string | null | undefined
	onPickerInitialFieldConsumed?: (() => void) | undefined
	/** Search input ref for keyboard `/` shortcut */
	searchInputRef?: React.Ref<HTMLInputElement> | undefined
}

export function FilterBar<TWhere>({
	fields,
	conditions,
	search,
	searchValue,
	onSearchChange,
	onAddFilter,
	onUpdateFilter,
	onRemoveFilter,
	onClearFilters,
	rightSlot,
	pickerOpen,
	onPickerOpenChange,
	pickerInitialField,
	onPickerInitialFieldConsumed,
	searchInputRef,
}: Props<TWhere>) {
	const L = useLabels()
	const hasFilters = conditions.length > 0

	return (
		<div className="jd:flex jd:flex-col jd:gap-2">
			<div className="jd:flex jd:flex-wrap jd:items-center jd:gap-1.5">
				{search && (
					<SearchInput
						value={searchValue}
						onChange={onSearchChange}
						placeholder={search.placeholder}
						inputRef={searchInputRef}
					/>
				)}

				{fields.length > 0 && (
					<FilterPicker
						fields={fields}
						onAdd={onAddFilter}
						open={pickerOpen}
						onOpenChange={onPickerOpenChange}
						initialField={pickerInitialField}
						onInitialFieldConsumed={onPickerInitialFieldConsumed}
						activeCount={conditions.length}
					/>
				)}

				<div className="jd:flex jd:flex-1 jd:flex-wrap jd:items-center jd:gap-1.5">
					{conditions.map((cond) => {
						const field = fields.find((f) => f.id === cond.fieldId)
						if (!field) return null
						return (
							<FilterPill
								key={cond.id}
								field={field}
								condition={cond}
								onUpdate={onUpdateFilter}
								onRemove={() => onRemoveFilter(cond.id)}
							/>
						)
					})}
					{hasFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onClearFilters}
							className="jd:text-muted-foreground jd:hover:text-foreground jd:h-6 jd:px-1.5 jd:text-[11px]"
						>
							{L.clear}
						</Button>
					)}
				</div>

				{rightSlot && <div className="jd:ml-auto">{rightSlot}</div>}
			</div>
		</div>
	)
}
