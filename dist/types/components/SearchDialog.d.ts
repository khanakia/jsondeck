import * as React from "react";
import { buildSearchIndex, type SearchHit } from "../core/search";
/** What the index is built from (the arguments of core/search buildSearchIndex). */
export type SearchSource = {
    pages: Parameters<typeof buildSearchIndex>[0];
    rows: Parameters<typeof buildSearchIndex>[1];
    rowLabel: NonNullable<Parameters<typeof buildSearchIndex>[2]>;
};
export declare function SearchDialog({ source, onPick, onClose }: {
    source: SearchSource;
    onPick: (hit: SearchHit) => void;
    onClose: () => void;
}): React.JSX.Element;
