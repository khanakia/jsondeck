import * as React from "react";
import type { Row } from "../core/config";
import type { RelationIndex } from "../core/relations";
import type { ResolvedDeck } from "../core/resolve";
import { type RenderCtx } from "./cells";
export type DrawerTarget = {
    table: string;
    row: Row;
};
export declare function RowDrawer({ deck, index, target, ctx, onOpen, onClose }: {
    deck: ResolvedDeck;
    index: RelationIndex;
    target: DrawerTarget;
    ctx: RenderCtx;
    onOpen: (t: DrawerTarget) => void;
    onClose: () => void;
}): React.JSX.Element | null;
