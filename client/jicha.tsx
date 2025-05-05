import { MahjongUser } from "../models/mahjong_user.ts";
import { Box, Text, useInput } from "npm:ink";
import { Pai } from "@k-jun/mahjong";
import { MahjongAction, MahjongActionType, MahjongInput } from "../models/mahjong.ts";
import { EmptyTSX, PaiTSX } from "./pai.tsx";
import React, { JSX } from "npm:react";
import { Socket } from "npm:socket.io-client";

enum Mode {
  PAI = 1,
  ACT = 2,
  OPT = 3,
  RCH = 4,
}

const sortOrder: Record<MahjongActionType, number> = {
  [MahjongActionType.DAHAI]: 0,
  [MahjongActionType.SKIP]: 1,
  [MahjongActionType.TSUMO]: 2,
  [MahjongActionType.RICHI]: 3,
  [MahjongActionType.ANKAN]: 4,
  [MahjongActionType.KAKAN]: 5,
  [MahjongActionType.OWARI]: 6,
  [MahjongActionType.RON]: 7,
  [MahjongActionType.CHI]: 8,
  [MahjongActionType.PON]: 9,
  [MahjongActionType.MINKAN]: 10,
};

export const JichaTSX = (
  { jicha, actions, height, width, socket, name, state }: {
    jicha: MahjongUser;
    actions: MahjongAction[];
    height: number;
    width: number;
    socket: Socket;
    name: string;
    state: string;
  },
): JSX.Element => {
  const [paiPointer, setPaiPointer] = React.useState<number>(0);
  const [actPointer, setActPointer] = React.useState<number>(0);
  const [optPointer, setOptPointer] = React.useState<number>(0);
  const [mode, setMode] = React.useState<Mode>(Mode.PAI);

  const paiSets = jicha.paiSets.map((e) => e.pais).reverse().flat();
  const paiRest = jicha?.paiRest.sort((a, b) => b.id - a.id) ?? [];
  const userActions = actions.filter((e) => e.user.id === jicha.id);
  const validActions = userActions
    .filter((e) => e.enable === undefined && e.type !== MahjongActionType.DAHAI);
  const isDahaiExist = userActions.map((e) => e.type).includes(MahjongActionType.DAHAI);
  if (userActions.length > 0 && !isDahaiExist) {
    validActions.push({ type: MahjongActionType.SKIP, user: jicha });
  }
  validActions.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);

  if (userActions.length === 0 && mode !== Mode.PAI) {
    setMode(Mode.PAI);
  }

  useInput((_, key) => {
    if (key.leftArrow) {
      switch (mode) {
        case Mode.PAI:
          setPaiPointer(Math.min(paiRest.length, paiPointer + 1));
          break;
        case Mode.RCH: {
          const richi = validActions[actPointer].options?.richi ?? [];
          const paiAll = [jicha.paiTsumo, ...paiRest];
          const idx = paiAll.slice(paiPointer + 1, paiAll.length).findIndex((e) =>
            richi.map((e) => e.paiId).includes(e?.id ?? -1)
          );
          if (idx !== -1) {
            setPaiPointer(Math.min(paiAll.length, paiPointer + idx + 1));
          }
          break;
        }
        case Mode.ACT:
          setActPointer(Math.min(validActions.length - 1, actPointer + 1));
          break;
        case Mode.OPT:
          setOptPointer(Math.min(nakis.length - 1, optPointer + 1));
          break;
      }
    }
    if (key.rightArrow) {
      switch (mode) {
        case Mode.PAI:
          setPaiPointer(Math.max(jicha.paiTsumo ? 0 : 1, paiPointer - 1));
          break;
        case Mode.RCH: {
          const richi = validActions[actPointer].options?.richi ?? [];
          const paiAll = [jicha.paiTsumo, ...paiRest];
          const idx = paiAll.slice(0, paiPointer).findLastIndex((e) => richi.map((e) => e.paiId).includes(e?.id ?? -1));
          if (idx !== -1) {
            setPaiPointer(Math.max(jicha.paiTsumo ? 0 : 1, idx));
          }
          break;
        }
        case Mode.ACT:
          setActPointer(Math.max(0, actPointer - 1));
          break;
        case Mode.OPT:
          setOptPointer(Math.max(0, optPointer - 1));
          break;
      }
    }
    if (key.upArrow) {
      if (validActions.length === 0) {
        return;
      }
      switch (mode) {
        case Mode.PAI:
          setMode(Mode.ACT);
          setActPointer(Math.min(validActions.length - 1, actPointer));
          break;
      }
    }
    if (key.downArrow) {
      switch (mode) {
        case Mode.ACT:
          setMode(Mode.PAI);
          setPaiPointer(Math.min(paiRest.length, paiPointer));
          break;
        case Mode.OPT:
          setMode(Mode.ACT);
          break;
      }
    }
    if (key.return) {
      switch (mode) {
        case Mode.PAI: {
          const pai = paiPointer === 0 ? jicha.paiTsumo : paiRest[paiPointer - 1];
          socket.emit("input", name, MahjongInput.DAHAI, { state, usrId: socket.id, dahai: { paiId: pai?.id ?? -1 } });
          break;
        }
        case Mode.ACT: {
          const action = validActions[actPointer];
          if (action.type === MahjongActionType.SKIP) {
            socket.emit("input", name, MahjongInput.SKIP, { state, usrId: socket.id });
          }
          switch (action.type) {
            case MahjongActionType.CHI:
            case MahjongActionType.PON:
            case MahjongActionType.ANKAN:
            case MahjongActionType.MINKAN:
            case MahjongActionType.KAKAN:
              if (action.options?.naki?.length === 1) {
                socket.emit("input", name, MahjongInput.NAKI, {
                  state,
                  usrId: socket.id,
                  naki: action.options?.naki?.[0],
                });
                setMode(Mode.PAI);
                setPaiPointer(1);
              } else {
                setMode(Mode.OPT);
              }
              break;
            case MahjongActionType.RON:
              socket.emit("input", name, MahjongInput.AGARI, {
                state,
                usrId: socket.id,
                agari: action.options?.agari?.[0],
              });
              break;
            case MahjongActionType.TSUMO: {
              socket.emit("input", name, MahjongInput.AGARI, {
                state,
                usrId: socket.id,
                agari: { paiId: jicha.paiTsumo?.id! },
              });
              break;
            }
            case MahjongActionType.RICHI: {
              const richi = action.options?.richi ?? [];
              const idx = paiRest.findIndex((e) => richi.map((e) => e.paiId).includes(e.id));
              if (idx !== -1) {
                setPaiPointer(idx + 1);
              }
              setMode(Mode.RCH);
              break;
            }
            case MahjongActionType.OWARI: {
              socket.emit("input", name, MahjongInput.OWARI, {
                state,
                usrId: socket.id,
                owari: { type: "yao9" },
              });
              break;
            }
          }
          break;
        }
        case Mode.OPT: {
          const action = validActions[actPointer];
          socket.emit("input", name, MahjongInput.NAKI, {
            state,
            usrId: socket.id,
            naki: action.options?.naki?.[optPointer],
          });
          setMode(Mode.PAI);
          setPaiPointer(1);
          break;
        }
        case Mode.RCH: {
          const pai = paiPointer === 0 ? jicha.paiTsumo : paiRest[paiPointer - 1];
          socket.emit("input", name, MahjongInput.RICHI, {
            state,
            usrId: socket.id,
            richi: { paiId: pai?.id ?? -1 },
          });
          setMode(Mode.PAI);
          setPaiPointer(1);
          break;
        }
      }
    }
  });

  const paiIdx = [Mode.PAI, Mode.RCH].includes(mode) ? paiPointer : -1;
  const cmdIdx = [Mode.ACT].includes(mode) ? actPointer : -1;
  const optIdx = [Mode.OPT].includes(mode) ? optPointer : -1;
  const nakis = [Mode.OPT].includes(mode) ? validActions[actPointer]?.options?.naki ?? [] : [];

  return (
    <Box
      height={height}
      width={width}
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-end"
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-around" width={width}>
        {mode === Mode.OPT && [...nakis].reverse().map((e, idx) => (
          <Box key={`options-${idx}`}>
            {e.pmyId.map((e) => (
              <PaiTSX
                text={new Pai(e).dsp}
                key={e}
                forceHeight={optIdx === nakis.length - 1 - idx ? 5 : 4}
              />
            ))}
          </Box>
        ))}
        {mode !== Mode.OPT && [...validActions].reverse().map((e, idx) => (
          <Box key={`actions-${idx}`}>
            <Text inverse={cmdIdx === validActions.length - 1 - idx}>{e.type}</Text>
          </Box>
        ))}
      </Box>
      <Box
        flexDirection="row"
        justifyContent="center"
        alignItems="flex-end"
        height={5}
        width={width}
      >
        {[...paiRest].reverse().map((e) => new Pai(e.id))
          .map((e, idx) => (
            <PaiTSX
              text={e.dsp}
              key={e.id}
              forceHeight={paiIdx === paiRest.length - idx ? 5 : 4}
            />
          ))}
        <EmptyTSX />
        {jicha?.paiTsumo
          ? (
            <PaiTSX
              text={new Pai(jicha?.paiTsumo?.id ?? 0).dsp}
              key={0}
              forceHeight={paiIdx === 0 ? 5 : 4}
            />
          )
          : <EmptyTSX />}
        <EmptyTSX />
        {paiSets.map((e) => <PaiTSX text={new Pai(e.id).dsp} key={e.id} />)}
      </Box>
    </Box>
  );
};

export const JichaKawaTSX = (
  { jicha, height, width }: { jicha: MahjongUser; height: number; width: number },
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

export const JichaKawaExtraTSX = (
  { jicha, height, width }: { jicha: MahjongUser; height: number; width: number },
): JSX.Element => {
  const pais = jicha.paiKawa.slice(18, 24);
  return (
    <Box flexDirection="row" alignItems="flex-end" width={width} height={height}>
      {pais.map((e) => <PaiTSX text={new Pai(e.id).dsp} key={e.id} />)}
    </Box>
  );
};
