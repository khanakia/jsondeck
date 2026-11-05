import type { ControlProps } from "./types";
/** "between" for numbers: min and max inputs; either side may be left empty (open range). */
export declare function NumberRangeControl({ value, onChange, onCommit, autoFocus }: ControlProps<[number | string, number | string]>): import("react").JSX.Element;
