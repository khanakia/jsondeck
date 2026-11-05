import * as React from "react";
import type { DateRangeValue } from "../../types";
import type { ControlProps } from "./types";
type Props = ControlProps<DateRangeValue | undefined> & {
    showPresets?: boolean | undefined;
};
export declare function DateRangeControl({ value, onChange, onCommit, showPresets, }: Props): React.JSX.Element;
export {};
