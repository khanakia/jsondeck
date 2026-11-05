import * as React from "react";
import type { LoadOptionsFn } from "../../types";
import type { ControlProps } from "./types";
export declare function RelationControl({ value, onChange, onCommit, loadOptions, searchPlaceholder, onLabelsChange, }: ControlProps<string | undefined> & {
    loadOptions: LoadOptionsFn;
    searchPlaceholder?: string | undefined;
    onLabelsChange?: ((labels: Record<string, string>) => void) | undefined;
}): React.JSX.Element;
export declare function RelationMultiControl({ value, onChange, onCommit, loadOptions, searchPlaceholder, onLabelsChange, }: ControlProps<string[]> & {
    loadOptions: LoadOptionsFn;
    searchPlaceholder?: string | undefined;
    onLabelsChange?: ((labels: Record<string, string>) => void) | undefined;
}): React.JSX.Element;
