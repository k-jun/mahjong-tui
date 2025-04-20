import React, { JSX } from "npm:react";
import { Box, Text } from "npm:ink";
import { io, Socket } from "npm:socket.io-client";
import { Mahjong } from "../models/mahjong.ts";
import { ToimenKawaTSX, ToimenTSX } from "./toimen.tsx";
import { ShimochaKawaTSX, ShimochaTSX } from "./shimocha.tsx";
import { KamichaKawaTSX, KamichaTSX } from "./kamicha.tsx";
import { JichaKawaTSX, JichaTSX } from "./jicha.tsx";
import { CenterTSX } from "./center.tsx";
import { render } from "npm:ink";
// import { withFullScreen } from "npm:fullscreen-ink";

const socket = io("http://localhost:8080");
const App = (
  { mahjong, name, socket }: {
    mahjong?: Mahjong;
    name: string;
    socket: Socket;
  },
): JSX.Element => {
  if (mahjong === undefined) {
    return (
      <Box>
        <Text>Waiting for game to start...</Text>
      </Box>
    );
  }

  const userIndex = mahjong?.users.findIndex((user) => user.id === socket.id);
  const jicha = mahjong?.users[userIndex];
  const kamicha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const shimocha = mahjong?.users[(userIndex + 3) % 4];
  return (
    <Box flexDirection="column" justifyContent="center" alignItems="center">
      <Box
        flexDirection="row"
        justifyContent="space-between"
        justifyItems="center"
        alignItems="center"
        height={60}
        width={110}
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
          width={100}
          height={60}
        >
          <ToimenTSX toimen={toimen} height={4} width={100} />
          <Box flexDirection="row" alignItems="center">
            <ShimochaKawaTSX shimocha={shimocha} height={14} width={12} />
            <Box flexDirection="column">
              <ToimenKawaTSX toimen={toimen} height={8} width={24} />
              <CenterTSX
                mahjong={mahjong}
                height={14}
                width={24}
                socketId={socket.id ?? ""}
              />
              <JichaKawaTSX jicha={jicha} height={8} width={24} />
            </Box>
            <KamichaKawaTSX kamicha={kamicha} height={14} width={12} />
          </Box>
          <JichaTSX
            jicha={jicha}
            height={5}
            width={100}
            socket={socket}
            name={name}
          />
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

socket.on("output", (name: string, data: Mahjong) => {
  // ink.instance.rerender(<App mahjong={data} socketId={socket.id ?? ""} />);
  ink.rerender(<App mahjong={data} name={name} socket={socket} />);
});

// const ink = withFullScreen(<App mahjong={undefined} socketId="" />);
// ink.start();

const ink = render(<App mahjong={undefined} name="" socket={socket} />);
