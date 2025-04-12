import React, { JSX, useEffect, useState } from "npm:react";
import { Pai } from "@k-jun/mahjong";
import { PaiTSX, EmptyTSX } from "./pai.tsx";
import Ink, { Box, render, Text, useFocus } from "npm:ink";
import { io } from "npm:socket.io-client";
import { Mahjong } from "../models/mahjong.ts";

const socket = io("http://localhost:8080");

// import { withFullScreen } from "npm:fullscreen-ink";
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
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="center"
        height={50}
        width={70}
        borderStyle="round"
        borderColor="green"
      >
        <Box
          flexDirection="row"
          justifyContent="flex-start"
          alignItems="flex-start"
          height={4}
        >
          {toimen?.paiRest.sort((a, b) =>
            a.id - b.id
          ).map((e) =>
            new Pai(e.id)
          ).map((e) => <PaiTSX text={e.dsp} key={e.id}>
            {e.dsp}
          </PaiTSX>)}
        </Box>
        

        <Box
          flexDirection="row"
          justifyContent="space-between"
          width={70}
        >
          <Box flexDirection="column" justifyContent="center" alignItems="center">
            {shimocha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
              .map((e, idx) => <PaiTSX text={e.dsp} key={e.id} enableTop={idx === 0} enableSide={idx === 12} />)}
          </Box>
          <Box flexDirection="column" justifyContent="center" alignItems="center">
            {kamicha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id))
              .map((e, idx) => <PaiTSX text={e.dsp} key={e.id} enableTop={idx === 0} enableSide={idx === 12} />)}
            <EmptyTSX />
            {kamicha?.paiTsumo ? <PaiTSX text={new Pai(kamicha?.paiTsumo?.id ?? 0).dsp} key={0} /> : <EmptyTSX />}
          </Box>
        </Box>

        <Box
          flexDirection="row"
          justifyContent="center"
          alignItems="flex-end"
          height={4}
        >
          {jicha?.paiRest.sort((a, b) => a.id - b.id).map((e)   => new Pai(e.id))
            .map((e) => <PaiTSX text={e.dsp} key={e.id} />)}
          <EmptyTSX />
          {jicha?.paiTsumo ? <PaiTSX text={new Pai(jicha?.paiTsumo?.id ?? 0).dsp} key={0} /> : <EmptyTSX />}
        </Box>
      </Box>
    </Box>
  );
};

socket.on("connect", () => {
  socket.emit("join");
});

socket.on("output", (data: Mahjong) => {
  console.log(data.users.map((e) => e.paiTsumo));
  ink.rerender(<App mahjong={data} socketId={socket.id ?? ""} />);
});

const ink = render(<App mahjong={undefined} socketId={""} />);
