/**
 * Where Base UI popups (menus, popovers, dialogs) render. They must portal
 * INTO the jsondeck root, not document.body, or the scoped reset, the theme
 * variables and the dark class would not reach them.
 */
import * as React from "react";
export declare const PortalContainerContext: React.Context<HTMLElement | null>;
/** The portal target for the current deck; undefined falls back to body. */
export declare function usePortalContainer(): HTMLElement | undefined;
