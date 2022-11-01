import { IconType } from "react-icons";
import Tippy from "@tippyjs/react";
import { TooltipContent } from "../../../shared/components/tooltip/TooltipContent";
import { Box } from "@mantine/core";

export type EditHyperlinkMenuItemIconProps = {
  icon: IconType;
  mainTooltip: string;
  secondaryTooltip?: string;
};

export function EditHyperlinkMenuItemIcon(
  props: EditHyperlinkMenuItemIconProps
) {
  const Icon = props.icon;

  return (
    <Tippy
      content={
        <TooltipContent
          mainTooltip={props.mainTooltip}
          secondaryTooltip={props.secondaryTooltip}
        />
      }
      placement="left">
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Icon size={16}></Icon>
      </Box>
    </Tippy>
  );
}
