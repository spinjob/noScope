/**
 * @fileoverview This is the next version of <Portal>, reimplemented as a function component.
 *
 * It supports both the newer React context API and the legacy context API. Support for the legacy context API
 * will be removed in Blueprint v6.0.
 *
 * Portal2 is not currently used anywhere in Blueprint. We had to revert the change which updated the standard
 * <Portal> to use this implementation because of subtle breaks caused by interactions with the (long-deprecated)
 * react-hot-loader library. To be safe, we've left Portal as a class component for now, and will promote this Portal2
 * implementation to be the standard Portal in Blueprint v5.0.
 *
 * @see https://github.com/palantir/blueprint/issues/5511
 */
import * as React from "react";
import { ValidationMap } from "../../common/context";
import { Props } from "../../common/props";
import type { PortalLegacyContext } from "./portal";
export interface Portal2Props extends Props {
    /** Contents to send through the portal. */
    children: React.ReactNode;
    /**
     * Callback invoked when the children of this `Portal` have been added to the DOM.
     */
    onChildrenMount?: () => void;
    /**
     * The HTML element that children will be mounted to.
     *
     * @default document.body
     */
    container?: HTMLElement;
}
/**
 * This component detaches its contents and re-attaches them to document.body.
 * Use it when you need to circumvent DOM z-stacking (for dialogs, popovers, etc.).
 * Any class names passed to this element will be propagated to the new container element on document.body.
 */
export declare function Portal2(props: Portal2Props, legacyContext?: PortalLegacyContext): React.ReactPortal | null;
export declare namespace Portal2 {
    var defaultProps: {
        container: HTMLElement | undefined;
    };
    var displayName: string;
    var contextTypes: ValidationMap<PortalLegacyContext>;
}
