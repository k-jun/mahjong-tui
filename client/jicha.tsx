import { User } from "../models/user.ts";
import { Box } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";

export const JichaTSX = ({ jicha, height, width }: { jicha: User, height: number, width: number }): JSX.Element => (
  <Box
    flexDirection="row"
    justifyContent="center"
    alignItems="flex-end"
    height={height}
    width={width}
  >
    {jicha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
      .map((e) => <PaiTSX text={e.dsp} key={e.id} />)}
    <EmptyTSX />
    {jicha?.paiTsumo
      ? <PaiTSX text={new Pai(jicha?.paiTsumo?.id ?? 0).dsp} key={0} />
      : <EmptyTSX />}
  </Box>
);

export const JichaKawaTSX = (
  { jicha, height, width }: { jicha: User, height: number, width: number },
): JSX.Element => {
  const columns: number[][] = [[], [], [], [], [], []];
  jicha.paiKawa.forEach((e, idx) => {
    columns[idx % 6].push(e.id);
  });
  return (
    <Box
      flexDirection="row"
      width={width}
      height={height}
    >
      {columns.map((column, idx) => (
        <Box
          flexDirection="column"
          key={column.join(",") + idx}
          justifyContent="flex-start"
        >
          {column.map((e, idx) => (
            <PaiTSX
              text={new Pai(e).dsp}
              key={e}
              enableTop={idx === 0}
              enableSide={idx === column.length - 1}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};
