import * as React from "react";
import type { TableState } from "../types";
import type { SavedView } from "./storage/ViewStorage";
type Props = {
    views: SavedView[];
    activeViewId: string | null;
    /** Current state — used to detect "modified" badge and to seed Save */
    state: TableState;
    onSelectView: (view: SavedView) => void;
    onCreateView: (name: string) => Promise<SavedView>;
    onUpdateView: (view: SavedView) => Promise<SavedView>;
    onDeleteView: (id: string) => Promise<void>;
    onSetDefault: (id: string | null) => Promise<void>;
    onSetFavorite: (id: string, favorite: boolean) => Promise<void>;
};
export declare function ViewSelector({ views, activeViewId, state, onSelectView, onCreateView, onUpdateView, onDeleteView, onSetDefault, onSetFavorite, }: Props): React.JSX.Element;
export {};
