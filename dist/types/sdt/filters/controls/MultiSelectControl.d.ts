import * as React from "react";
import type { FilterOption } from "../../types";
import type { ControlProps } from "./types";
type MultiSelectControlProps = ControlProps<string[]> & {
    options: FilterOption[];
    searchable?: boolean | undefined;
};
export declare function MultiSelectControl({ value, onChange, onCommit, options, searchable, }: MultiSelectControlProps): React.JSX.Element;
export {};
