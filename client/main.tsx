import React, { JSX, useState } from "npm:react";
import { Box, Text } from "npm:ink";
import { io, Socket } from "npm:socket.io-client";
import { Mahjong } from "../models/mahjong.ts";
import { ToimenKawaExtraTSX, ToimenKawaTSX, ToimenTSX } from "./toimen.tsx";
import { KamichaKawaExtraTSX, KamichaKawaTSX, KamichaTSX } from "./kamicha.tsx";
import { ShimochaKawaExtraTSX, ShimochaKawaTSX, ShimochaTSX } from "./shimocha.tsx";
import { JichaKawaExtraTSX, JichaKawaTSX, JichaTSX } from "./jicha.tsx";
import { CenterTSX } from "./center.tsx";
import { ResultTSX } from "./result.tsx";
// import { withFullScreen } from "npm:fullscreen-ink";
import { render } from "npm:ink";

const CountDownTSX = ({ timeout, height, width }: { timeout: number; height: number; width: number }): JSX.Element => {
  const [count, setCount] = useState(timeout);
  setTimeout(() => {
    setCount(Math.max(0, count - 1));
  }, 1000);
  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height={height}
      width={width}
    >
      <Text>Waiting for game to start... {count}</Text>
    </Box>
  );
};

const socket = io("http://localhost:8080");
const App = (
  { mahjong, name, socket }: {
    mahjong?: Mahjong;
    name: string;
    socket: Socket;
  },
): JSX.Element => {
  const { columns, rows } = Deno.consoleSize();
  if (mahjong === undefined) {
    return <CountDownTSX timeout={20} height={rows} width={columns} />;
  }

  const userIndex = mahjong?.users.findIndex((user) => user.id === socket.id);
  const jicha = mahjong?.users[userIndex];
  const shimocha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const kamicha = mahjong?.users[(userIndex + 3) % 4];
  const actions = mahjong?.actions;
  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      height={rows}
      width={columns}
      alignItems="center"
    >
      <Box
        flexDirection="row"
        justifyContent="space-between"
        justifyItems="center"
        alignItems="center"
        height={60}
        width={110}
        borderStyle="round"
      >
        <Box height={60} width={4}>
          <KamichaTSX kamicha={kamicha} />
        </Box>
        <Box
          flexDirection="column"
          justifyContent="space-between"
          alignItems="center"
          width={100}
          height={60}
        >
          <ToimenTSX toimen={toimen} height={4} width={100} />
          {mahjong.status !== "playing"
            ? <ResultTSX mahjong={mahjong} socketId={socket.id ?? ""} />
            : <MainTSX mahjong={mahjong} socket={socket} height={14 * 3} width={24 * 3} />}
          <JichaTSX
            jicha={jicha}
            actions={actions}
            height={10}
            width={100}
            socket={socket}
            name={name}
            state={mahjong.state}
          />
        </Box>
        <Box height={60} width={4}>
          <ShimochaTSX shimocha={shimocha} />
        </Box>
      </Box>
    </Box>
  );
};

const MainTSX = ({ mahjong, socket }: {
  mahjong: Mahjong;
  socket: Socket;
  height: number;
  width: number;
}): JSX.Element => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socket.id);
  const jicha = mahjong?.users[userIndex];
  const shimocha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const kamicha = mahjong?.users[(userIndex + 3) % 4];

  return (
    <Box flexDirection="row" alignItems="center" width={24 * 3} height={14 * 3}>
      <Box flexDirection="column">
        <Box height={14} width={24} flexDirection="column" justifyContent="flex-end">
          <ToimenKawaExtraTSX toimen={toimen} height={8} width={24} />
        </Box>
        <KamichaKawaTSX kamicha={kamicha} height={14} width={24} />
        <Box height={14} width={24} flexDirection="row" justifyContent="flex-end">
          <KamichaKawaExtraTSX kamicha={kamicha} height={14} width={12} />
        </Box>
      </Box>
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
      <Box flexDirection="column">
        <Box height={14} width={24}>
          <ShimochaKawaExtraTSX shimocha={shimocha} height={14} width={12} />
        </Box>
        <ShimochaKawaTSX shimocha={shimocha} height={14} width={24} />
        <Box height={14} width={24} flexDirection="column">
          <JichaKawaExtraTSX jicha={jicha} height={8} width={24} />
        </Box>
      </Box>
    </Box>
  );
};

socket.on("connect", async () => {
  await socket.emit("join");
});

let main: JSX.Element;
socket.on("output", (name: string, data: Mahjong) => {
  ink.rerender(<App mahjong={data} name={name} socket={socket} />);
});

const ink = render(<App mahjong={undefined} name="" socket={socket} />);
