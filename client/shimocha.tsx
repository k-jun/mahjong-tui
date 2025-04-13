import { User } from "../models/user.ts";
import { Box } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";

export const ShimochaTSX = ({ shimocha }: { shimocha: User }): JSX.Element => {
  const paiSets = shimocha.paiSets.map((e) => e.pais).flat();
  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center">
      {shimocha?.paiRest.sort((a, b) =>
        a.id - b.id
      ).map((e) =>
        new Pai(e.id)
      )
        .map((e, idx) => (
          <PaiTSX
            text={e.dsp}
            key={e.id}
            enableTop={idx === 0}
            enableSide={idx === shimocha.paiRest.length - 1}
          />
        ))}
      <EmptyTSX enableSide={false} />
      {shimocha?.paiTsumo
        ? (
          <PaiTSX
            text={new Pai(shimocha.paiTsumo.id).dsp}
            key={shimocha.paiTsumo.id}
          />
        )
        : <EmptyTSX />}
      <EmptyTSX />
      {paiSets.map((e, idx) => (
        <PaiTSX
          text={new Pai(e.id).dsp}
          key={e.id}
          enableTop={idx === 0}
          enableSide={idx === paiSets.length - 1}
        />
      ))}
    </Box>
  );
};

export const ShimochaKawaTSX = (
  { shimocha, height, width }: {
    shimocha: User;
    height: number;
    width: number;
  },
): JSX.Element => {
  const row1 = shimocha.paiKawa.slice(0, 6);
  const row2 = shimocha.paiKawa.slice(6, 12);
  const row3 = shimocha.paiKawa.slice(12, 18);
  return (
    <Box
      flexDirection="row"
      height={height}
      width={width}
    >
      {[row3, row2, row1].map((row, idx) => (
        <Box
          flexDirection="column"
          key={row.join(",") + idx}
          justifyContent="flex-start"
          width={4}
        >
          {row.map((e, idx) => (
            <PaiTSX
              text={new Pai(e.id).dsp}
              key={e.id}
              enableTop={idx === 0}
              enableSide={idx === row.length - 1}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
};
