import * as React from "react";
import { type SearchEntry, type SearchHit } from "../core/search";
export declare function SearchDialog({ entries, onPick, onClose }: {
    entries: SearchEntry[];
    onPick: (hit: SearchHit) => void;
    onClose: () => void;
}): React.JSX.Element;
