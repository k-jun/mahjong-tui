import React, { JSX } from "npm:react";
import { Box, Text } from "npm:ink";
import { Mahjong } from "../models/mahjong.ts";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import { Pai } from "@k-jun/mahjong";

const EndTypeConvertor: Record<string, string> = {
  "yao9": "九種九牌",
  "kaze4": "四風連打",
  "richi4": "四家立直",
  "ron3": "三家和了",
  "kan4": "四槓散了",
};

export const ResultTSX = ({ mahjong, socketId }: { mahjong: Mahjong; socketId: string }): JSX.Element => {
  let result = "流局";
  if (mahjong.EndedType !== undefined) {
    result = EndTypeConvertor[mahjong.EndedType];
  }
  const contents: JSX.Element[] = [];
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const kaze = [0, 1, 2, 3].map((e) => new Pai(mahjong?.users[(userIndex + e) % 4].paiJikaze?.id).dsp);

  if (result === "九種九牌") {
    const paiRest = mahjong.users[mahjong.turnUserIdx].paiRest;
    const paiTsumo = mahjong.users[mahjong.turnUserIdx].paiTsumo;
    contents.push(
      <Box
        flexDirection="row"
        justifyContent="center"
        key={`result-${paiRest.map((e) => e.id).join(",")}`}
      >
        {paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id)).map((e) => (
          <PaiTSX key={`result-${e.id}`} text={e.dsp} />
        ))}
        {paiTsumo ? <PaiTSX key={`result-${paiTsumo.id}`} text={new Pai(paiTsumo.id).dsp} /> : <EmptyTSX />}
        <EmptyTSX />
      </Box>,
    );
  }
  if (mahjong.tokutens.length > 0) {
    result = "和了";
    for (const tokuten of mahjong.tokutens) {
      const paiRest = tokuten.user.paiRest;
      const paiLast = tokuten.input.paiLast;
      const paiSets = tokuten.input.paiSets.map((e) => e.pais).flat();

      contents.push(
        <Box
          flexDirection="row"
          justifyContent="center"
          key="result-agari"
        >
          {paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id)).map((e) => (
            <PaiTSX key={`result-${e.id}`} text={e.dsp} />
          ))}
          <EmptyTSX />
          {paiLast ? <PaiTSX key={`result-${paiLast.id}`} text={new Pai(paiLast.id).dsp} /> : <EmptyTSX />}
          <EmptyTSX />
          {paiSets.map((e) => <PaiTSX text={new Pai(e.id).dsp} key={e.id} />)}
        </Box>,
      );
      const output = tokuten.output;
      const input = tokuten.input;

      const pointText = output.pointPrt > 0 ? `${output.pointCdn}-${output.pointPrt}点` : `${output.pointCdn}点`;
      contents.push(
        <Box
          flexDirection="column"
          justifyContent="center"
          key={`result-${tokuten.user.id}`}
        >
          <Box flexDirection="row" justifyContent="center" width={20} key={`result-yakus`}>
            <Text>{`${tokuten.output.fu}符`}</Text>
            <Text>{`${tokuten.output.han}翻`}</Text>
            <Text>{`${pointText}`}</Text>
          </Box>

          {output.yakus.map((e, idx) => {
            return (
              <Box flexDirection="row" justifyContent="space-between" width={20} key={`result-yakus-${idx}`}>
                <Text>{`${e.str}`}</Text>
                <Text>{`${e.yakuman ? "役満" : `${e.val}翻`}`}</Text>
              </Box>
            );
          })}
        </Box>,
      );
      contents.push(
        <Box flexDirection="row" justifyContent="center" key={`result-ura-dora`}>
          {[0, 1, 2, 3, 4].map((e) => (
            <PaiTSX
              key={`result-uradora-${e}`}
              text={input.paiDoraUra[e]?.id ? new Pai(input.paiDoraUra[e].id).dsp : "  "}
            />
          ))}
        </Box>,
      );
      const before = [0, 1, 2, 3].map((e) => tokuten.before[(userIndex + e) % 4]);
      const diff = [0, 1, 2, 3].map((e) => tokuten.diff[(userIndex + e) % 4]).map((e) =>
        e > 0 ? `+${e}` : e === 0 ? "" : `${e}`
      );

      contents.push(
        <Box
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          height={5}
          key={`result-score-${tokuten.user.id}`}
        >
          <Text>{kaze[2]}{`${before[2]}${diff[2]}`}</Text>
          <Text>
            {kaze[3]}
            {`${before[3]}${diff[3]}`} {kaze[1]}
            {`${before[1]}${diff[1]}`}
          </Text>
          <Text>{kaze[0]}{`${before[0]}${diff[0]}`}</Text>
        </Box>,
      );
    }
  } else {
    // 流局
    const points = mahjong.users.map((user) => user.point);
    contents.push(
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={5}
        key={`result-score`}
      >
        <Text>{`${kaze[2]}${points[2]}`}</Text>
        <Text>{`${kaze[3]}${points[3]} ${kaze[1]}${points[1]}`}</Text>
        <Text>{`${kaze[0]}${points[0]}`}</Text>
      </Box>,
    );
  }

  return (
    <Box
      borderColor="white"
      borderStyle="round"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      key={`result-${result}`}
    >
      <Text>{result}</Text>
      {contents}
    </Box>
  );
};
