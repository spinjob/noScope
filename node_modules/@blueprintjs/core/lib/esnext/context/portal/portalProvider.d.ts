import * as React from "react";
export interface PortalContextOptions {
    /** Additional CSS classes to add to all `Portal` elements in this React context. */
    portalClassName?: string;
}
/**
 * A React context to set options for all portals in a given subtree.
 * Do not use this PortalContext directly, instead use PortalProvider to set the options.
 */
export declare const PortalContext: React.Context<PortalContextOptions>;
export declare const PortalProvider: ({ children, ...options }: React.PropsWithChildren<PortalContextOptions>) => JSX.Element;
