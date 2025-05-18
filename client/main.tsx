import { Command } from "commander";
import { io, Socket } from "socket.io-client";
import React, { JSX, useEffect, useState } from "react";
import { Box, Instance, render, Text } from "ink";

import { Mahjong } from "./mahjong.ts";
import { ToimenKawaExtraTSX, ToimenKawaTSX, ToimenTSX } from "./toimen.tsx";
import { KamichaKawaExtraTSX, KamichaKawaTSX, KamichaTSX } from "./kamicha.tsx";
import {
  ShimochaKawaExtraTSX,
  ShimochaKawaTSX,
  ShimochaTSX,
} from "./shimocha.tsx";
import { JichaKawaExtraTSX, JichaKawaTSX, JichaTSX } from "./jicha.tsx";
import { CenterTSX } from "./center.tsx";
import { ResultTSX } from "./result.tsx";
import terminalSize from "terminal-size";

const CountDownTSX = (
  { timeout, height, width }: {
    timeout: number;
    height: number;
    width: number;
  },
): JSX.Element => {
  const [countdown, setCountdown] = useState(timeout);
  useEffect(() => {
    const timerId = setInterval(() => {
      setCountdown((prev: number) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [countdown]);

  return (
    <Box
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height={height}
      width={width}
    >
      <Text>Waiting for game to start... {countdown}</Text>
    </Box>
  );
};

const App = (
  { mahjong, name, socket }: {
    mahjong?: Mahjong;
    name: string;
    socket: Socket;
  },
): JSX.Element => {
  const { columns, rows } = terminalSize();
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
            : (
              <MainTSX
                mahjong={mahjong}
                socket={socket}
                height={14 * 3}
                width={24 * 3}
              />
            )}
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
        <Box
          height={14}
          width={24}
          flexDirection="column"
          justifyContent="flex-end"
        >
          <ToimenKawaExtraTSX toimen={toimen} height={8} width={24} />
        </Box>
        <KamichaKawaTSX kamicha={kamicha} height={14} width={24} />
        <Box
          height={14}
          width={24}
          flexDirection="row"
          justifyContent="flex-end"
        >
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

const main = async (endpoint: string) => {
  const attempts = 3;
  const socket = await io(endpoint, { reconnectionAttempts: attempts - 1 });

  let ink: Instance;
  socket.on("connect", async () => {
    ink = render(<App mahjong={undefined} name="" socket={socket} />);
    socket.on("output", (name: string, data: Mahjong) => {
      ink.rerender(<App mahjong={data} name={name} socket={socket} />);
    });
    await socket.emit("join");
  });

  let cnt = 0;
  socket.on("connect_error", (_) => {
    cnt++;
    if (cnt >= attempts) {
      console.log(
        `Failed to establish WebSocket connection. Please check if the server is running and accessible at ${endpoint}.`,
      );
    }
  });
  process.on("SIGINT", () => {
    socket.close();
    ink?.unmount();
  });
};

await new Command()
  .name("mahjong-tui")
  .version("1.0.0")
  .description("Mahjong TUI")
  .helpOption("--help", "Print help info.")
  .option("-h, --host <host>", "Host", "localhost")
  .option("-p, --port <port>", "Port", "8080")
  .action((options: { host: string; port: string }) => {
    const isLocal = (host: string) =>
      host === "localhost" || host.startsWith("127.") || host === "::1";
    const protocol = isLocal(options.host) ? "ws" : "wss";
    main(`${protocol}://${options.host}:${options.port}`);
  })
  .parse();
