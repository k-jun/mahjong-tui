import { Box } from "ink";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import { MahjongUser } from "./mahjong_user.ts";
import { Pai } from "@k-jun/mahjong";
import React, { JSX } from "react";

export const ToimenTSX = (
  { toimen, height, width }: {
    toimen: MahjongUser;
    height: number;
    width: number;
  },
): JSX.Element => {
  const paiSets = toimen.paiSets.map((e) => e.pais).flat();
  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      height={height}
      width={width}
    >
      {paiSets.map((e) => <PaiTSX text={new Pai(e.id).dsp} key={e.id} />)}
      <EmptyTSX />
      {toimen.paiTsumo
        ? (
          <PaiTSX
            key={0}
            text={toimen.isOpen ? new Pai(toimen.paiTsumo.id).dsp : "  "}
          />
        )
        : <EmptyTSX />}
      <EmptyTSX />
      {toimen?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
        .map((e) => (
          <PaiTSX key={e.id} text={toimen.isOpen ? new Pai(e.id).dsp : "  "} />
        ))}
    </Box>
  );
};

export const ToimenKawaTSX = (
  { toimen, height, width }: {
    toimen: MahjongUser;
    height: number;
    width: number;
  },
): JSX.Element => {
  const columns: number[][] = [[], [], [], [], [], []];
  toimen.paiKawa.slice(0, 18).forEach((e, idx) => {
    columns[idx % 6].push(e.id);
  });
  return (
    <Box
      flexDirection="row"
      width={width}
      height={height}
    >
      {columns.reverse().map((column, idx) => (
        <Box
          flexDirection="column"
          width={4}
          key={column.join(",") + idx}
          justifyContent="flex-end"
        >
          {column.reverse().map((e, idx) => (
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

export const ToimenKawaExtraTSX = (
  { toimen, height, width }: {
    toimen: MahjongUser;
    height: number;
    width: number;
  },
): JSX.Element => {
  const column = toimen.paiKawa.slice(18, 24);
  return (
    <Box
      flexDirection="row"
      justifyContent="flex-end"
      alignItems="flex-start"
      height={height}
      width={width}
    >
      {column.reverse().map((e) => (
        <PaiTSX text={new Pai(e.id).dsp} key={e.id} />
      ))}
    </Box>
  );
};
