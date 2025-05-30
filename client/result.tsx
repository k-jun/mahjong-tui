import React, { JSX } from "react";
import { Box, Text } from "ink";
import { Mahjong } from "./mahjong.ts";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import { Pai } from "@k-jun/mahjong";

export const ResultTSX = (
  { mahjong, socketId }: { mahjong: Mahjong; socketId: string },
): JSX.Element => {
  if (mahjong.status === "completed") {
    return <ResultCompletedTSX mahjong={mahjong} socketId={socketId} />;
  }
  if (mahjong.status === "ended") {
    if (mahjong.tokutens.length > 0) {
      return <ResultEndedAgariTSX mahjong={mahjong} socketId={socketId} />;
    }
    switch (mahjong.EndedType) {
      /* falls through */
      case "yao9":
      case "kaze4":
      case "richi4":
      case "kan4":
        return <ResultEndedTochuRyukyokuTSX mahjong={mahjong} />;
      default:
        return <ResultEndedRyukyokuTSX mahjong={mahjong} socketId={socketId} />;
    }
  }
  return <Text>not defined</Text>;
};

const ResultEndedAgariTSX = (
  { mahjong, socketId }: { mahjong: Mahjong; socketId: string },
): JSX.Element => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const kaze = [0, 1, 2, 3].map((e) =>
    new Pai(mahjong?.users[(userIndex + e) % 4].paiJikaze?.id).dsp
  );
  const tokuten = mahjong.tokutens[0];
  const paiRest = tokuten.user.paiRest;
  const paiLast = tokuten.input.paiLast;
  const paiSets = tokuten.input.paiSets.map((e) => e.pais).flat();

  const output = tokuten.output;
  const input = tokuten.input;
  const pointText = output.pointPrt > 0
    ? `${output.pointCdn}-${output.pointPrt}点`
    : `${output.pointCdn}点`;
  const base = [0, 1, 2, 3].map((e) =>
    mahjong.scrdiffs[0].base[(userIndex + e) % 4]
  );
  const diff = [0, 1, 2, 3].map((e) =>
    mahjong.scrdiffs[0].diff[(userIndex + e) % 4]
  ).map((e) => e > 0 ? `+${e}` : e === 0 ? "" : `${e}`);

  return (
    <Box
      borderColor="white"
      borderStyle="round"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      key={`result-ended-ryukyoku`}
    >
      <Text>和了</Text>
      <Box
        flexDirection="row"
        justifyContent="center"
        key="result-agari"
      >
        {paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id)).map((
          e,
        ) => <PaiTSX key={`result-${e.id}`} text={e.dsp} />)}
        <EmptyTSX />
        {paiLast
          ? (
            <PaiTSX
              key={`result-${paiLast.id}`}
              text={new Pai(paiLast.id).dsp}
            />
          )
          : <EmptyTSX />}
        <EmptyTSX />
        {paiSets.map((e) => <PaiTSX text={new Pai(e.id).dsp} key={e.id} />)}
      </Box>
      <Box
        flexDirection="column"
        justifyContent="center"
        key={`result-${tokuten.user.id}`}
      >
        <Box
          flexDirection="row"
          justifyContent="center"
          width={20}
          key={`result-yakus`}
        >
          <Text>{`${tokuten.output.fu}符`}</Text>
          <Text>{`${tokuten.output.han}翻`}</Text>
          <Text>{`${pointText}`}</Text>
        </Box>

        {output.yakus.map((e, idx) => {
          return (
            <Box
              flexDirection="row"
              justifyContent="space-between"
              width={20}
              key={`result-yakus-${idx}`}
            >
              <Text>{`${e.str}`}</Text>
              <Text>{`${e.yakuman ? "役満" : `${e.val}翻`}`}</Text>
            </Box>
          );
        })}
      </Box>
      <Box flexDirection="row" justifyContent="center" key={`result-ura-dora`}>
        {[0, 1, 2, 3, 4].map((e) => (
          <PaiTSX
            key={`result-uradora-${e}`}
            text={input.paiDoraUra[e]?.id
              ? (new Pai(input.paiDoraUra[e].id)).prev().dsp
              : "  "}
          />
        ))}
      </Box>
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={5}
        key={`result-score-${tokuten.user.id}`}
      >
        <Text>{kaze[2]}{`${base[2]}${diff[2]}`}</Text>
        <Text>
          {kaze[3]}
          {`${base[3]}${diff[3]}`} {kaze[1]}
          {`${base[1]}${diff[1]}`}
        </Text>
        <Text>{kaze[0]}{`${base[0]}${diff[0]}`}</Text>
      </Box>
    </Box>
  );
};

const ResultEndedRyukyokuTSX = (
  { mahjong, socketId }: { mahjong: Mahjong; socketId: string },
): JSX.Element => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const kaze = [0, 1, 2, 3].map((e) =>
    new Pai(mahjong?.users[(userIndex + e) % 4].paiJikaze?.id).dsp
  );
  const scrdiff = mahjong.scrdiffs[0];
  const base = [0, 1, 2, 3].map((e) => scrdiff.base[(userIndex + e) % 4]);
  const diff = [0, 1, 2, 3].map((e) => scrdiff.diff[(userIndex + e) % 4]).map((
    e,
  ) => e > 0 ? `+${e}` : e === 0 ? "" : `${e}`);
  return (
    <Box
      borderColor="white"
      borderStyle="round"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      key={`result-ended-ryukyoku`}
    >
      <Text>流局</Text>
      <Box
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={5}
        key={`result-score`}
      >
        <Text>{kaze[2]}{`${base[2]}${diff[2]}`}</Text>
        <Text>
          {kaze[3]}
          {`${base[3]}${diff[3]}`} {kaze[1]}
          {`${base[1]}${diff[1]}`}
        </Text>
        <Text>{kaze[0]}{`${base[0]}${diff[0]}`}</Text>
      </Box>
    </Box>
  );
};

const EndTypeConvertor: Record<string, string> = {
  "yao9": "九種九牌",
  "kaze4": "四風連打",
  "richi4": "四家立直",
  "ron3": "三家和了",
  "kan4": "四槓散了",
};

const ResultEndedTochuRyukyokuTSX = (
  { mahjong }: { mahjong: Mahjong },
): JSX.Element => {
  let reason = "ツモ流局";
  if (mahjong.EndedType !== undefined) {
    reason = EndTypeConvertor[mahjong.EndedType];
  }
  return (
    <Box
      borderColor="white"
      borderStyle="round"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      key={`result-ended-tochu-ryukyoku`}
    >
      <Text>{reason}</Text>
    </Box>
  );
};

const ResultCompletedTSX = (
  { mahjong, socketId }: { mahjong: Mahjong; socketId: string },
): JSX.Element => {
  const userIdx = mahjong.users.findIndex((user) => user.id === socketId);
  const jicha = mahjong.users[userIdx];
  const shimocha = mahjong.users[(userIdx + 1) % 4];
  const toimen = mahjong.users[(userIdx + 2) % 4];
  const kamicha = mahjong.users[(userIdx + 3) % 4];

  const info = [
    { name: "自家", point: jicha.point },
    { name: "下家", point: shimocha.point },
    { name: "対家", point: toimen.point },
    { name: "上家", point: kamicha.point },
  ];
  info.sort((a, b) => b.point - a.point);

  return (
    <Box
      borderColor="white"
      borderStyle="round"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      key={`result-completed`}
    >
      <Text>終局</Text>
      <Box
        flexDirection="column"
        justifyContent="center"
        width={20}
        key={`result-oshimai`}
      >
        {info.map((e, idx) => (
          <Box
            flexDirection="row"
            justifyContent="space-between"
            width={20}
            key={`result-oshimai-${e.name}`}
          >
            <Text>{`${idx + 1}位 ${e.name}`}</Text>
            <Text>{`${e.point}点`}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
