import { Mahjong } from "../models/mahjong.ts";
import { Pai } from "@k-jun/mahjong";
import { Box, Text } from "npm:ink";
import React, { JSX } from "npm:react";
import { PaiTSX } from "./pai.tsx";
// import { v4 as uuidv4 } from 'uuid';

export const CenterTSX = (
  { mahjong, height, width, socketId }: {
    mahjong: Mahjong;
    height: number;
    width: number;
    socketId: string;
  },
): JSX.Element => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const jicha = mahjong?.users[userIndex];
  const kamicha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const shimocha = mahjong?.users[(userIndex + 3) % 4];
  const turnRest = mahjong.paiYama.length + mahjong.paiRinshan.length - 4;

  const kyoku =
    ["東", "南", "西", "北"][Math.floor(mahjong.kyoku / 4)].toString() +
    (mahjong.kyoku % 4 + 1).toString();

  const paiDora = mahjong.paiDora;
  const paiDoraList = [];
  for (let i = 0; i < 5; i++) {
    if (i < paiDora.length) {
      paiDoraList.push(<PaiTSX text={new Pai(paiDora[i].id).dsp} key={i} />);
      continue;
    }
    paiDoraList.push(<PaiTSX key={200 + i} />);
  }
  return (
    <Box
      flexDirection="column"
      justifyContent="space-between"
      alignItems="center"
      height={height}
      width={width}
      borderStyle="round"
      borderColor="green"
    >
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        height={4}
      >
        {paiDoraList}
      </Box>
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={3}
      >
        <Text>{new Pai(toimen.paiJikaze?.id ?? 0).dsp}{toimen.point}</Text>
        <Text>
          {new Pai(kamicha.paiJikaze?.id ?? 0).dsp}
          {kamicha.point} {new Pai(shimocha.paiJikaze?.id ?? 0).dsp}
          {shimocha.point}
        </Text>
        <Text>{new Pai(jicha.paiJikaze?.id ?? 0).dsp}{jicha.point}</Text>
      </Box>
      <Box
        flexDirection="row"
        height={5}
        justifyContent="center"
        alignItems="center"
      >
        <Box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          width={11}
        >
          <Text>{kyoku}</Text>
          <Text>{turnRest}</Text>
        </Box>
        <Box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          width={11}
        >
          <Text>{mahjong.honba} 本場</Text>
          <Text>{mahjong.kyotaku} 供託</Text>
        </Box>
      </Box>
      {
        /* <Box flexDirection="row" justifyContent="center" alignItems="center">
        {paiDoraList}
      </Box>
      <Box flexDirection="row" justifyContent="center" alignItems="center">
        {paiDoraList}
      </Box> */
      }
    </Box>
  );
};
