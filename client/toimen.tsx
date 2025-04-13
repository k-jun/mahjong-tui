import { Box } from "npm:ink";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import { User } from "../models/user.ts";
import { Pai } from "@k-jun/mahjong";
import React, { JSX } from "npm:react";

export const ToimenTSX = ({ toimen, height, width }: { toimen: User, height: number, width: number }): JSX.Element => (
  <Box
    flexDirection="row"
    justifyContent="flex-start"
    alignItems="flex-start"
    height={height}
    width={width}
  >
    {toimen.paiTsumo
      ? <PaiTSX text={new Pai(toimen.paiTsumo.id).dsp} key={0} />
      : <EmptyTSX />}
    <EmptyTSX />
    {toimen?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id)).map((
      e,
    ) => <PaiTSX text={e.dsp} key={e.id} />)}
  </Box>
);

export const ToimenKawaTSX = (  
    { toimen, height, width }: { toimen: User, height: number, width: number },
  ): JSX.Element => {
    const columns: number[][] = [[], [], [], [], [], []];
    toimen.paiKawa.forEach((e, idx) => {
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
  