import React from "npm:react";
import { Box, Text } from "npm:ink";

export const PaiTSX = (
  { text, enableTop = true, enableBottom = true, enableSide = false }: {
    text: string;
    key: number;
    enableTop?: boolean;
    enableBottom?: boolean;
    enableSide?: boolean;
  },
) => {
  let height = 3 - Number(!enableTop) - Number(!enableBottom) +
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

export const EmptyTSX = () => {
  return (
    <Box width={4} height={3}>
    </Box>
  );
};