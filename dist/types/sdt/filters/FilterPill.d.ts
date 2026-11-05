import * as React from "react";
import type { FilterCondition, FilterFieldDef } from "../types";
type Props<TWhere> = {
    field: FilterFieldDef<TWhere>;
    condition: FilterCondition;
    onUpdate: (cond: FilterCondition) => void;
    onRemove: () => void;
};
export declare function FilterPill<TWhere>({ field, condition, onUpdate, onRemove, }: Props<TWhere>): React.JSX.Element;
export {};
