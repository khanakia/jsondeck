import * as React from "react";
import type { PageConfig } from "../core/config";
import type { ResolvedDeck } from "../core/resolve";
import { type Issue } from "../core/validate";
export declare function Deck({ deck, configs, layoutIssues }: {
    deck: ResolvedDeck;
    configs: PageConfig[];
    layoutIssues: Issue[];
}): React.JSX.Element;
