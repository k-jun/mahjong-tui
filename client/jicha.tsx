import { User } from "../models/user.ts";
import { Box, useInput } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";
import { Socket } from "npm:socket.io-client";
export const JichaTSX = (
  { jicha, height, width, socket, name }: {
    jicha: User;
    height: number;
    width: number;
    socket: Socket;
    name: string;
  },
): JSX.Element => {
  const paiSets = jicha.paiSets.map((e) => e.pais).reverse().flat();
  const [selected, setSelected] = React.useState<number>(0);
  const rest = jicha?.paiRest ?? [];

  useInput((_, key) => {
    if (key.leftArrow) {
      setSelected(Math.min(rest.length, selected + 1));
    }
    if (key.rightArrow) {
      setSelected(Math.max(0, selected - 1));
    }
    if (key.return) {
      socket.emit("input", name, "dahai", {
        dahai: {
          paiDahai: rest[selected],
        },
      });
    }
  });

  return (
    <Box
      flexDirection="row"
      justifyContent="center"
      alignItems="flex-end"
      height={height}
      width={width}
    >
      {rest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
        .map((e, idx) => (
          <PaiTSX
            text={e.dsp}
            key={e.id}
            forceHeight={selected === (rest.length - idx) ? 5 : 4}
          />
        ))}
      <EmptyTSX />
      {jicha?.paiTsumo
        ? (
          <PaiTSX
            text={new Pai(jicha?.paiTsumo?.id ?? 0).dsp}
            key={0}
            forceHeight={selected === 0 ? 5 : 4}
          />
        )
        : <EmptyTSX />}
      <EmptyTSX />
      {paiSets.map((e) => <PaiTSX text={new Pai(e.id).dsp} key={e.id} />)}
    </Box>
  );
};

export const JichaKawaTSX = (
  { jicha, height, width }: { jicha: User; height: number; width: number },
): JSX.Element => {
  const columns: number[][] = [[], [], [], [], [], []];
  jicha.paiKawa.slice(0, 18).forEach((e, idx) => {
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
