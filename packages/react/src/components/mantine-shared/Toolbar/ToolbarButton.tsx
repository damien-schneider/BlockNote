import { ActionIcon, Button, Tooltip } from "@mantine/core";
import { MouseEvent, forwardRef } from "react";
import type { IconType } from "react-icons";

import { TooltipContent } from "../Tooltip/TooltipContent";

export type ToolbarButtonProps = {
  onClick?: (e: MouseEvent) => void;
  icon?: IconType;
  mainTooltip: string;
  secondaryTooltip?: string;
  isSelected?: boolean;
  children?: any;
  isDisabled?: boolean;
};

/**
 * Helper for basic buttons that show in the formatting toolbar.
 */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (props, ref) => {
    const ButtonIcon = props.icon;

    return (
      <Tooltip
        withinPortal={false}
        label={
          <TooltipContent
            mainTooltip={props.mainTooltip}
            secondaryTooltip={props.secondaryTooltip}
          />
        }>
        {/*Creates an ActionIcon instead of a Button if only an icon is provided as content.*/}
        {props.children ? (
          <Button
            // Needed as Safari doesn't focus button elements on mouse down
            // unlike other browsers.
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).focus();
            }}
            onClick={props.onClick}
            data-selected={props.isSelected ? "true" : undefined}
            data-test={
              props.mainTooltip.slice(0, 1).toLowerCase() +
              props.mainTooltip.replace(/\s+/g, "").slice(1)
            }
            size={"xs"}
            disabled={props.isDisabled || false}
            ref={ref}>
            {ButtonIcon && <ButtonIcon />}
            {props.children}
          </Button>
        ) : (
          <ActionIcon
            // Needed as Safari doesn't focus button elements on mouse down
            // unlike other browsers.
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).focus();
            }}
            onClick={props.onClick}
            data-selected={props.isSelected ? "true" : undefined}
            data-test={
              props.mainTooltip.slice(0, 1).toLowerCase() +
              props.mainTooltip.replace(/\s+/g, "").slice(1)
            }
            size={30}
            disabled={props.isDisabled || false}
            ref={ref}>
            {ButtonIcon && <ButtonIcon />}
          </ActionIcon>
        )}
      </Tooltip>
    );
  }
);
