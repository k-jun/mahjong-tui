import React from "npm:react";
import { Box, Text } from "npm:ink";

export const PaiTSX = (
  { text = "  ", enableTop = true, enableBottom = true, enableSide = true }: {
    text?: string;
    key: number;
    enableTop?: boolean;
    enableBottom?: boolean;
    enableSide?: boolean;
  },
) => {
  const height = 3 - Number(!enableTop) - Number(!enableBottom) +
    Number(enableSide);
  return (
    <Box
      width={4}
      height={height}
      flexDirection="column"
    >
      {enableTop && <Text>┌──┐</Text>}
      <Text>│{text}│</Text>
      {enableBottom && <Text>└──┘</Text>}
      {enableSide && <Text>└──┘</Text>}
    </Box>
  );
};

export const EmptyTSX = ({enableTop = true, enableBottom = true, enableSide = true}: {
  enableTop?: boolean;
  enableBottom?: boolean;
  enableSide?: boolean;
}) => {
  const height = 3 - Number(!enableTop) - Number(!enableBottom) +
    Number(enableSide);
  return (
    <Box width={4} height={height}>
    </Box>
  );
};
