import type { ReactNode } from "react";
type Props = {
    message?: string | undefined;
    description?: string | undefined;
    action?: ReactNode | undefined;
    filtered?: boolean | undefined;
    onClearFilters?: (() => void) | undefined;
};
export declare function EmptyState({ message, description, action, filtered, onClearFilters, }: Props): import("react").JSX.Element;
export {};
