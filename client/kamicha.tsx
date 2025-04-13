import { User } from "../models/user.ts";
import { Box } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";

export const KamichaTSX = ({ kamicha }: { kamicha: User }): JSX.Element => (
  <Box
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
  >
    {kamicha?.paiTsumo
      ? (
        <PaiTSX
          text={new Pai(kamicha?.paiTsumo?.id ?? 0).dsp}
          key={0}
        />
      )
      : <EmptyTSX />}
    <EmptyTSX enableSide={false} />
    {kamicha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
      .map((e, idx) => (
        <PaiTSX
          text={e.dsp}
          key={e.id}
          enableTop={idx === 0}
          enableSide={idx === 12}
        />
      ))}
  </Box>
);

export const KamichaKawaTSX = (
    { kamicha, height, width }: { kamicha: User, height: number, width: number },
  ): JSX.Element => {
    const row1 = kamicha.paiKawa.slice(0, 6);
    const row2 = kamicha.paiKawa.slice(6, 12);
    const row3 = kamicha.paiKawa.slice(12, 18);
    return (
      <Box
        flexDirection="row"
        width={width}
        height={height}
      >
        {[row1, row2, row3].map((row, idx) => (
          <Box flexDirection="column" key={row.join(",") + idx} justifyContent="flex-end" width={4}>
            {row.reverse().map((e, idx) => (
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
  