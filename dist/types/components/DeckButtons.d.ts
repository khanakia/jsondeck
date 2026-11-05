import type { Labels } from "../core/labels";
/** Flips the page between light and dark; shows the mode it switches to. */
export declare function ThemeToggle({ dark, labels: L, onToggle }: {
    dark: boolean;
    labels: Labels;
    onToggle: () => void;
}): import("react").JSX.Element;
/** Switches the layout editor on and off ("Edit" / "Done"). */
export declare function EditToggle({ edit, withLabels, labels: L, onToggle }: {
    edit: boolean;
    withLabels: boolean;
    labels: Labels;
    onToggle: () => void;
}): import("react").JSX.Element;
