import * as React from "react";
import { ValidationMap } from "../../common/context";
import { Props } from "../../common/props";
export declare type PortalProps = IPortalProps;
/** @deprecated use PortalProps */
export interface IPortalProps extends Props {
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
export interface IPortalState {
    hasMounted: boolean;
}
/** @deprecated use PortalLegacyContext */
export declare type IPortalContext = PortalLegacyContext;
export interface PortalLegacyContext {
    /** Additional CSS classes to add to all `Portal` elements in this React context. */
    blueprintPortalClassName?: string;
}
/**
 * This component detaches its contents and re-attaches them to document.body.
 * Use it when you need to circumvent DOM z-stacking (for dialogs, popovers, etc.).
 * Any class names passed to this element will be propagated to the new container element on document.body.
 */
export declare class Portal extends React.Component<PortalProps, IPortalState> {
    static displayName: string;
    static contextTypes: ValidationMap<PortalLegacyContext>;
    static defaultProps: Partial<PortalProps>;
    context: PortalLegacyContext;
    state: IPortalState;
    private portalElement;
    render(): React.ReactPortal | null;
    componentDidMount(): void;
    componentDidUpdate(prevProps: PortalProps): void;
    componentWillUnmount(): void;
    private createContainerElement;
}
