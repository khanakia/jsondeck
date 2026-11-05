/**
 * What a table needs to draw nested related tables inside an expanded row:
 * the resolved deck, the relations index and the cell render context.
 * Provided once by the Deck; tables read it without importing page code.
 */
import * as React from "react";
import type { RenderCtx } from "../components/cells";
import type { RelationIndex } from "../core/relations";
import type { ResolvedDeck } from "../core/resolve";
export type NestedCtx = {
    deck: ResolvedDeck;
    relIndex: RelationIndex;
    renderCtx: RenderCtx;
};
export declare const NestedContext: React.Context<NestedCtx | null>;
export declare function useNested(): NestedCtx | null;
