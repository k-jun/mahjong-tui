import React from "react";
import { Box, Text } from "ink";

export const PaiTSX = (
  {
    text = "  ",
    enableTop = true,
    enableBottom = true,
    enableSide = true,
    forceHeight,
    isInverse = false,
  }: {
    text?: string;
    key: number | string;
    enableTop?: boolean;
    enableBottom?: boolean;
    enableSide?: boolean;
    forceHeight?: number;
    isInverse?: boolean;
  },
) => {
  let height = 3 - Number(!enableTop) - Number(!enableBottom) +
    Number(enableSide);
  if (forceHeight !== undefined) {
    height = forceHeight;
  }
  return (
    <Box
      width={4}
      height={height}
      flexDirection="column"
      justifyContent="flex-start"
    >
      {enableTop && <Text inverse={isInverse}>┌──┐</Text>}
      <Text inverse={isInverse}>│{text}│</Text>
      {enableBottom && <Text inverse={isInverse}>└──┘</Text>}
      {enableSide && <Text inverse={isInverse}>└──┘</Text>}
    </Box>
  );
};

export const EmptyTSX = (
  { enableTop = true, enableBottom = true, enableSide = true }: {
    enableTop?: boolean;
    enableBottom?: boolean;
    enableSide?: boolean;
  },
) => {
  const height = 3 - Number(!enableTop) - Number(!enableBottom) +
    Number(enableSide);
  return (
    <Box width={4} height={height}>
    </Box>
  );
};
