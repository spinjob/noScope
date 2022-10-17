/// <reference types="react" />
import { ButtonProps } from "../button/buttons";
import { TooltipProps } from "../tooltip/tooltip";
export declare type DialogStepButtonProps = Partial<Omit<ButtonProps, "elementRef">> & {
    /** If defined, the button will be wrapped with a tooltip with the specified content. */
    tooltipContent?: TooltipProps["content"];
};
export declare function DialogStepButton({ tooltipContent, ...props }: DialogStepButtonProps): JSX.Element;
