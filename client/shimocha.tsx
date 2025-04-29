import { MahjongUser } from "../models/mahjong_user.ts";
import { Box } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";

export const ShimochaTSX = ({ shimocha }: { shimocha: MahjongUser }): JSX.Element => {
  const paiSets = shimocha.paiSets.map((e) => e.pais).flat();

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      {paiSets.map((e, idx) => (
        <PaiTSX
          text={new Pai(e.id).dsp}
          key={e.id}
          enableTop={idx === 0}
          enableSide={idx === paiSets.length - 1}
        />
      ))}
      <EmptyTSX enableTop={false} enableSide={false} />
      {shimocha?.paiTsumo
        ? (
          <PaiTSX
            text={new Pai(shimocha?.paiTsumo?.id ?? 0).dsp}
            key={0}
          />
        )
        : <EmptyTSX />}
      <EmptyTSX enableSide={false} />
      {shimocha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
        .map((e, idx) => (
          <PaiTSX
            text={e.dsp}
            key={e.id}
            enableTop={idx === 0}
            enableSide={idx === shimocha.paiRest.length - 1}
          />
        ))}
    </Box>
  );
};

export const ShimochaKawaTSX = (
  { shimocha, height, width }: { shimocha: MahjongUser; height: number; width: number },
): JSX.Element => {
  const row1 = shimocha.paiKawa.slice(0, 6);
  const row2 = shimocha.paiKawa.slice(6, 12);
  const row3 = shimocha.paiKawa.slice(12, 18);
  return (
    <Box
      flexDirection="row"
      width={width}
      height={height}
    >
      {[row1, row2, row3].map((row, idx) => (
        <Box
          flexDirection="column"
          key={row.join(",") + idx}
          justifyContent="flex-end"
          width={4}
        >
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

export const ShimochaKawaExtraTSX = (
  { shimocha, height, width }: { shimocha: MahjongUser; height: number; width: number },
): JSX.Element => {
  const column = shimocha.paiKawa.slice(18, 24);

  return (
    <Box flexDirection="row" justifyContent="flex-end" width={width} height={height}>
      <Box flexDirection="column" justifyContent="flex-end" width={4}>
        {column.reverse().map((e, idx) => (
          <PaiTSX
            text={new Pai(e.id).dsp}
            key={e.id}
            enableTop={idx === 0}
            enableSide={idx === column.length - 1}
          />
        ))}
      </Box>
    </Box>
  );
};
