import * as React from "react";
import { type ResolvedItem, type ResolvedSection } from "../core/layout";
import { type LayoutOps } from "./edit-context";
export declare function ItemTools({ item, span, cols, ops }: {
    item: ResolvedItem;
    span: number;
    cols: number;
    ops: LayoutOps;
}): React.JSX.Element;
/** "Add" control at the end of a section in edit mode. */
export declare function AddItem({ section }: {
    section: ResolvedSection;
}): React.JSX.Element | null;
/** Copy config / Reset layout buttons in the deck header while editing. */
export declare function DeckEditTools({ copied, onCopy, onReset }: {
    copied: boolean;
    onCopy: () => void;
    onReset: () => void;
}): React.JSX.Element;
