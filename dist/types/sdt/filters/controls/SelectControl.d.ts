import * as React from "react";
import type { FilterOption } from "../../types";
import type { ControlProps } from "./types";
type SelectControlProps = ControlProps<string | undefined> & {
    options: FilterOption[];
    searchable?: boolean | undefined;
};
export declare function SelectControl({ value, onChange, onCommit, options, searchable, }: SelectControlProps): React.JSX.Element;
export {};
