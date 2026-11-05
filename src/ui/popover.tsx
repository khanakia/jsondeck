/**
 * Popovers that load Base UI on first use (same names and props as
 * base-popover.tsx). The trigger is a plain element until the "popups" chunk
 * arrives; the content only renders inside an open popover. See ui/deferred.tsx.
 */
import type * as React from "react"
import type * as Base from "./base-popover"
import { deferredRoot, lazyPart } from "./deferred"
import { type Popups, popups } from "./popups-handle"

const pair = deferredRoot<Popups, React.ComponentProps<typeof Base.Popover>, React.ComponentProps<typeof Base.PopoverTrigger>>(popups, (m) => m.Popover, (m) => m.PopoverTrigger, "dialog")
type RootProps = React.ComponentProps<typeof Base.Popover>
type TriggerProps = React.ComponentProps<typeof Base.PopoverTrigger>
const Popover: (props: RootProps) => React.ReactNode = pair.Root
const PopoverTrigger: (props: TriggerProps) => React.ReactNode = pair.Trigger
const PopoverContent = lazyPart(popups, (m) => m.PopoverContent)

export { Popover, PopoverContent, PopoverTrigger }
