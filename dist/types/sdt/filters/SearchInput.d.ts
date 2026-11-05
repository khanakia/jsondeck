import * as React from "react";
type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string | undefined;
    /** Debounce ms before firing onChange. Default 300. */
    debounce?: number | undefined;
    className?: string | undefined;
    /** Forwarded ref so callers can imperatively focus (keyboard shortcut). */
    inputRef?: React.Ref<HTMLInputElement> | undefined;
};
/**
 * Debounced full-text search input. Keeps the on-screen value snappy while
 * deferring the upstream `onChange` so we don't refetch on every keystroke.
 */
export declare function SearchInput({ value, onChange, placeholder, debounce, className, inputRef, }: Props): React.JSX.Element;
export {};
