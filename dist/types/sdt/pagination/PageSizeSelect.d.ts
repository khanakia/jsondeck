type Props = {
    value: number;
    options: number[];
    onChange: (size: number) => void;
};
/**
 * Compact rows-per-page selector. Lives next to pagination.
 * Changing the value resets pagination to page 1 (handled by the reducer).
 */
export declare function PageSizeSelect({ value, options, onChange }: Props): import("react").JSX.Element;
export {};
