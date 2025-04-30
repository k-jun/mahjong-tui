import { MahjongUser } from "../models/mahjong_user.ts";
import { Box } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";

export const KamichaTSX = ({ kamicha }: { kamicha: MahjongUser }): JSX.Element => {
  const paiSets = kamicha.paiSets.map((e) => e.pais).reverse().flat();
  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center">
      {kamicha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
        .map((e, idx) => (
          <PaiTSX
            key={e.id}
            enableTop={idx === 0}
            enableSide={idx === kamicha.paiRest.length - 1}
          />
        ))}
      <EmptyTSX enableSide={false} />
      {kamicha?.paiTsumo ? <PaiTSX key={kamicha.paiTsumo.id} /> : <EmptyTSX />}
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

export const KamichaKawaTSX = (
  { kamicha, height, width }: {
    kamicha: MahjongUser;
    height: number;
    width: number;
  },
): JSX.Element => {
  const row1 = kamicha.paiKawa.slice(0, 6);
  const row2 = kamicha.paiKawa.slice(6, 12);
  const row3 = kamicha.paiKawa.slice(12, 18);
  return (
    <Box
      flexDirection="row"
      justifyContent="flex-end"
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

export const KamichaKawaExtraTSX = (
  { kamicha, height, width }: { kamicha: MahjongUser; height: number; width: number },
): JSX.Element => {
  const column = kamicha.paiKawa.slice(18, 24);
  return (
    <Box flexDirection="row" justifyContent="flex-start" width={width} height={height}>
      <Box flexDirection="column" justifyContent="flex-start" width={4}>
        {column.map((e, idx) => (
          <PaiTSX text={new Pai(e.id).dsp} key={e.id} enableTop={idx === 0} enableSide={idx === column.length - 1} />
        ))}
      </Box>
    </Box>
  );
};
