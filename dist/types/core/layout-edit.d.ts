/**
 * Layout edits, pure functions over a PageConfig: move, resize, remove and
 * add items, and the starter spec for "Add". Loaded with the layout editor
 * (components/EditTools.tsx and Deck's edit operations), not with every page.
 */
import type { ComponentBase, PageConfig, PageItem } from "./config";
import type { ResolvedDeck } from "./resolve";
import { type ComponentKind } from "./layout";
export declare function moveItem(p: PageConfig, itemId: string, toPath: string, toIndex: number): PageConfig;
export declare function updateItem(p: PageConfig, itemId: string, patch: Partial<ComponentBase>): PageConfig;
export declare function removeItem(p: PageConfig, itemId: string): PageConfig;
export declare function addItem(p: PageConfig, path: string, item: PageItem): PageConfig;
/** A starter spec for "Add item": sensible defaults from the dataset's resolved columns. */
export declare function starterItem(deck: ResolvedDeck, kind: ComponentKind, table: string, id: string): PageItem;
