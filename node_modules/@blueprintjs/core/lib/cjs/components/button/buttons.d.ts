import * as React from "react";
import { AbstractButton, AnchorButtonProps, ButtonProps, IAnchorButtonProps, IButtonProps } from "./abstractButton";
export { IAnchorButtonProps, IButtonProps, ButtonProps, AnchorButtonProps };
export declare class Button extends AbstractButton<HTMLButtonElement> {
    static displayName: string;
    buttonRef: HTMLButtonElement | null;
    protected handleRef: React.Ref<HTMLButtonElement>;
    render(): JSX.Element;
    componentDidUpdate(prevProps: ButtonProps): void;
}
export declare class AnchorButton extends AbstractButton<HTMLAnchorElement> {
    static displayName: string;
    buttonRef: HTMLAnchorElement | null;
    protected handleRef: React.Ref<HTMLAnchorElement>;
    render(): JSX.Element;
    componentDidUpdate(prevProps: AnchorButtonProps): void;
}
