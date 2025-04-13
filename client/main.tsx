import React, { JSX } from "npm:react";
import { Box, render, Text } from "npm:ink";
import { io } from "npm:socket.io-client";
import { Mahjong } from "../models/mahjong.ts";
import { ToimenKawaTSX, ToimenTSX } from "./toimen.tsx";
import { ShimochaKawaTSX, ShimochaTSX } from "./shimocha.tsx";
import { KamichaKawaTSX, KamichaTSX } from "./kamicha.tsx";
import { JichaKawaTSX, JichaTSX } from "./jicha.tsx";
const socket = io("http://localhost:8080");
import { withFullScreen } from "npm:fullscreen-ink";
const App = (
  { mahjong, socketId }: { mahjong?: Mahjong; socketId: string },
): JSX.Element => {
  if (mahjong === undefined) {
    return (
      <Box>
        <Text>Waiting for game to start...</Text>
      </Box>
    );
  }

  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const jicha = mahjong?.users[userIndex];
  const kamicha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const shimocha = mahjong?.users[(userIndex + 3) % 4];
  // console.log(user?.paiRest.map((e) => new Pai(e.id).fmt));
  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center">
      <Box
        flexDirection="row"
        justifyContent="flex-start"
        justifyItems="center"
        alignItems="center"
        height={60}
        width={100}
        borderStyle="round"
        borderColor="green"
      >
        <Box height={60} width={4}>
          <ShimochaTSX shimocha={shimocha} />
        </Box>
        <Box
          flexDirection="column"
          justifyContent="space-between"
          alignItems="center"
          width={80}
          height={60}
        >
          <ToimenTSX toimen={toimen} height={4} width={80} />
          <Box flexDirection="row" alignItems="center">
            <ShimochaKawaTSX shimocha={shimocha} height={14} width={12} />
            <Box flexDirection="column">
              <ToimenKawaTSX toimen={toimen} height={8} width={24} />
              <Box height={14} />
              <JichaKawaTSX jicha={jicha} height={8} width={24} />
            </Box>
            <KamichaKawaTSX kamicha={kamicha} height={14} width={12} />
          </Box>
          <JichaTSX jicha={jicha} height={4} width={80} />
        </Box>
        <Box height={60} width={4}>
          <KamichaTSX kamicha={kamicha} />
        </Box>
      </Box>
    </Box>
  );
};

socket.on("connect", () => {
  socket.emit("join");
});

socket.on("output", (data: Mahjong) => {
  ink.instance.rerender(<App mahjong={data} socketId={socket.id ?? ""} />);
});

const ink = withFullScreen(<App mahjong={undefined} socketId={""} />);
ink.start();
