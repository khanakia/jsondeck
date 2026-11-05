import * as React from "react";
import type { ControlProps } from "./types";
type BooleanControlProps = ControlProps<boolean | undefined> & {
    trueLabel?: string | undefined;
    falseLabel?: string | undefined;
};
/**
 * Vertical-list True/False picker. Same nav pattern as Select/MultiSelect
 * so users get uniform ↑/↓ + Enter behavior across every filter type
 * (segmented horizontal layouts don't scale to many options).
 *
 * Hotkeys: T/Y → True, F/N → False (commit immediately).
 */
export declare function BooleanControl({ value, onChange, onCommit, trueLabel, falseLabel, }: BooleanControlProps): React.JSX.Element;
export {};
