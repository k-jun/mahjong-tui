#!/usr/bin/env node

// main.tsx
import { Command } from "commander";
import { io } from "socket.io-client";
import React8, { useEffect as useEffect2, useState as useState2 } from "react";
import { Box as Box8, render, Text as Text5 } from "ink";

// toimen.tsx
import { Box as Box2 } from "ink";

// pai.tsx
import React from "react";
import { Box, Text } from "ink";
var PaiTSX = ({
  text = "  ",
  enableTop = true,
  enableBottom = true,
  enableSide = true,
  forceHeight,
  isInverse = false
}) => {
  let height = 3 - Number(!enableTop) - Number(!enableBottom) + Number(enableSide);
  if (forceHeight !== void 0) {
    height = forceHeight;
  }
  return /* @__PURE__ */ React.createElement(
    Box,
    {
      width: 4,
      height,
      flexDirection: "column",
      justifyContent: "flex-start"
    },
    enableTop && /* @__PURE__ */ React.createElement(Text, { inverse: isInverse }, "\u250C\u2500\u2500\u2510"),
    /* @__PURE__ */ React.createElement(Text, { inverse: isInverse }, "\u2502", text, "\u2502"),
    enableBottom && /* @__PURE__ */ React.createElement(Text, { inverse: isInverse }, "\u2514\u2500\u2500\u2518"),
    enableSide && /* @__PURE__ */ React.createElement(Text, { inverse: isInverse }, "\u2514\u2500\u2500\u2518")
  );
};
var EmptyTSX = ({ enableTop = true, enableBottom = true, enableSide = true }) => {
  const height = 3 - Number(!enableTop) - Number(!enableBottom) + Number(enableSide);
  return /* @__PURE__ */ React.createElement(Box, { width: 4, height });
};

// toimen.tsx
import { Pai } from "@k-jun/mahjong";
import React2 from "react";
var ToimenTSX = ({ toimen, height, width }) => {
  const paiSets = toimen.paiSets.map((e) => e.pais).flat();
  return /* @__PURE__ */ React2.createElement(
    Box2,
    {
      flexDirection: "row",
      justifyContent: "center",
      height,
      width
    },
    paiSets.map((e) => /* @__PURE__ */ React2.createElement(PaiTSX, { text: new Pai(e.id).dsp, key: e.id })),
    /* @__PURE__ */ React2.createElement(EmptyTSX, null),
    toimen.paiTsumo ? /* @__PURE__ */ React2.createElement(
      PaiTSX,
      {
        key: 0,
        text: toimen.isOpen ? new Pai(toimen.paiTsumo.id).dsp : "  "
      }
    ) : /* @__PURE__ */ React2.createElement(EmptyTSX, null),
    /* @__PURE__ */ React2.createElement(EmptyTSX, null),
    toimen?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai(e.id)).map((e) => /* @__PURE__ */ React2.createElement(PaiTSX, { key: e.id, text: toimen.isOpen ? new Pai(e.id).dsp : "  " }))
  );
};
var ToimenKawaTSX = ({ toimen, height, width }) => {
  const columns = [[], [], [], [], [], []];
  toimen.paiKawa.slice(0, 18).forEach((e, idx) => {
    columns[idx % 6].push(e.id);
  });
  return /* @__PURE__ */ React2.createElement(
    Box2,
    {
      flexDirection: "row",
      width,
      height
    },
    columns.reverse().map((column, idx) => /* @__PURE__ */ React2.createElement(
      Box2,
      {
        flexDirection: "column",
        width: 4,
        key: column.join(",") + idx,
        justifyContent: "flex-end"
      },
      column.reverse().map((e, idx2) => /* @__PURE__ */ React2.createElement(
        PaiTSX,
        {
          text: new Pai(e).dsp,
          key: e,
          enableTop: idx2 === 0,
          enableSide: idx2 === column.length - 1
        }
      ))
    ))
  );
};
var ToimenKawaExtraTSX = ({ toimen, height, width }) => {
  const column = toimen.paiKawa.slice(18, 24);
  return /* @__PURE__ */ React2.createElement(
    Box2,
    {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "flex-start",
      height,
      width
    },
    column.reverse().map((e) => /* @__PURE__ */ React2.createElement(PaiTSX, { text: new Pai(e.id).dsp, key: e.id }))
  );
};

// kamicha.tsx
import { Box as Box3 } from "ink";
import { Pai as Pai2 } from "@k-jun/mahjong";
import React3 from "react";
var KamichaTSX = ({ kamicha }) => {
  const paiSets = kamicha.paiSets.map((e) => e.pais).reverse().flat();
  return /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "column", justifyContent: "center", alignItems: "center" }, kamicha?.paiRest.sort(
    (a, b) => a.id - b.id
  ).map(
    (e) => new Pai2(e.id)
  ).map((e, idx) => /* @__PURE__ */ React3.createElement(
    PaiTSX,
    {
      key: e.id,
      text: kamicha.isOpen ? new Pai2(e.id).dsp : "  ",
      enableTop: idx === 0,
      enableSide: idx === kamicha.paiRest.length - 1
    }
  )), /* @__PURE__ */ React3.createElement(EmptyTSX, { enableSide: false }), kamicha?.paiTsumo ? /* @__PURE__ */ React3.createElement(
    PaiTSX,
    {
      key: kamicha.paiTsumo.id,
      text: kamicha.isOpen ? new Pai2(kamicha.paiTsumo.id).dsp : "  "
    }
  ) : /* @__PURE__ */ React3.createElement(EmptyTSX, null), /* @__PURE__ */ React3.createElement(EmptyTSX, null), paiSets.map((e, idx) => /* @__PURE__ */ React3.createElement(
    PaiTSX,
    {
      text: new Pai2(e.id).dsp,
      key: e.id,
      enableTop: idx === 0,
      enableSide: idx === paiSets.length - 1
    }
  )));
};
var KamichaKawaTSX = ({ kamicha, height, width }) => {
  const row1 = kamicha.paiKawa.slice(0, 6);
  const row2 = kamicha.paiKawa.slice(6, 12);
  const row3 = kamicha.paiKawa.slice(12, 18);
  return /* @__PURE__ */ React3.createElement(
    Box3,
    {
      flexDirection: "row",
      justifyContent: "flex-end",
      height,
      width
    },
    [row3, row2, row1].map((row, idx) => /* @__PURE__ */ React3.createElement(
      Box3,
      {
        flexDirection: "column",
        key: row.join(",") + idx,
        justifyContent: "flex-start",
        width: 4
      },
      row.map((e, idx2) => /* @__PURE__ */ React3.createElement(
        PaiTSX,
        {
          text: new Pai2(e.id).dsp,
          key: e.id,
          enableTop: idx2 === 0,
          enableSide: idx2 === row.length - 1
        }
      ))
    ))
  );
};
var KamichaKawaExtraTSX = ({ kamicha, height, width }) => {
  const column = kamicha.paiKawa.slice(18, 24);
  return /* @__PURE__ */ React3.createElement(
    Box3,
    {
      flexDirection: "row",
      justifyContent: "flex-start",
      width,
      height
    },
    /* @__PURE__ */ React3.createElement(Box3, { flexDirection: "column", justifyContent: "flex-start", width: 4 }, column.map((e, idx) => /* @__PURE__ */ React3.createElement(
      PaiTSX,
      {
        text: new Pai2(e.id).dsp,
        key: e.id,
        enableTop: idx === 0,
        enableSide: idx === column.length - 1
      }
    )))
  );
};

// shimocha.tsx
import { Box as Box4 } from "ink";
import { Pai as Pai3 } from "@k-jun/mahjong";
import React4 from "react";
var ShimochaTSX = ({ shimocha }) => {
  const paiSets = shimocha.paiSets.map((e) => e.pais).flat();
  return /* @__PURE__ */ React4.createElement(
    Box4,
    {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    },
    paiSets.map((e, idx) => /* @__PURE__ */ React4.createElement(
      PaiTSX,
      {
        text: new Pai3(e.id).dsp,
        key: e.id,
        enableTop: idx === 0,
        enableSide: idx === paiSets.length - 1
      }
    )),
    /* @__PURE__ */ React4.createElement(EmptyTSX, { enableTop: false, enableSide: false }),
    shimocha?.paiTsumo ? /* @__PURE__ */ React4.createElement(
      PaiTSX,
      {
        key: 0,
        text: shimocha.isOpen ? new Pai3(shimocha?.paiTsumo.id).dsp : "  "
      }
    ) : /* @__PURE__ */ React4.createElement(EmptyTSX, null),
    /* @__PURE__ */ React4.createElement(EmptyTSX, { enableSide: false }),
    shimocha?.paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai3(e.id)).map((e, idx) => /* @__PURE__ */ React4.createElement(
      PaiTSX,
      {
        key: e.id,
        text: shimocha.isOpen ? new Pai3(e.id).dsp : "  ",
        enableTop: idx === 0,
        enableSide: idx === shimocha.paiRest.length - 1
      }
    ))
  );
};
var ShimochaKawaTSX = ({ shimocha, height, width }) => {
  const row1 = shimocha.paiKawa.slice(0, 6);
  const row2 = shimocha.paiKawa.slice(6, 12);
  const row3 = shimocha.paiKawa.slice(12, 18);
  return /* @__PURE__ */ React4.createElement(
    Box4,
    {
      flexDirection: "row",
      width,
      height
    },
    [row1, row2, row3].map((row, idx) => /* @__PURE__ */ React4.createElement(
      Box4,
      {
        flexDirection: "column",
        key: row.join(",") + idx,
        justifyContent: "flex-end",
        width: 4
      },
      row.reverse().map((e, idx2) => /* @__PURE__ */ React4.createElement(
        PaiTSX,
        {
          text: new Pai3(e.id).dsp,
          key: e.id,
          enableTop: idx2 === 0,
          enableSide: idx2 === row.length - 1
        }
      ))
    ))
  );
};
var ShimochaKawaExtraTSX = ({ shimocha, height, width }) => {
  const column = shimocha.paiKawa.slice(18, 24);
  return /* @__PURE__ */ React4.createElement(
    Box4,
    {
      flexDirection: "row",
      justifyContent: "flex-end",
      width,
      height
    },
    /* @__PURE__ */ React4.createElement(Box4, { flexDirection: "column", justifyContent: "flex-end", width: 4 }, column.reverse().map((e, idx) => /* @__PURE__ */ React4.createElement(
      PaiTSX,
      {
        text: new Pai3(e.id).dsp,
        key: e.id,
        enableTop: idx === 0,
        enableSide: idx === column.length - 1
      }
    )))
  );
};

// jicha.tsx
import { Pai as Pai6 } from "@k-jun/mahjong";
import { Box as Box5, Text as Text2, useInput } from "ink";

// mahjong.ts
import {
  Pai as Pai5
} from "@k-jun/mahjong";

// mahjong_user.ts
import { Pai as Pai4 } from "@k-jun/mahjong";

// jicha.tsx
import React5, { useEffect, useState } from "react";
var sortOrder = {
  ["dahai" /* DAHAI */]: 0,
  ["skip" /* SKIP */]: 1,
  ["tsumoAgari" /* TSUMO */]: 2,
  ["richi" /* RICHI */]: 3,
  ["ankan" /* ANKAN */]: 4,
  ["kakan" /* KAKAN */]: 5,
  ["owari" /* OWARI */]: 6,
  ["ron" /* RON */]: 7,
  ["chi" /* CHI */]: 8,
  ["pon" /* PON */]: 9,
  ["minkan" /* MINKAN */]: 10
};
var JichaTSX = ({ jicha, actions, height, width, socket, name, state }) => {
  const [paiPointer, setPaiPointer] = useState(0);
  const [actPointer, setActPointer] = useState(0);
  const [optPointer, setOptPointer] = useState(0);
  const [mode, setMode] = useState(1 /* PAI */);
  const paiSets = jicha.paiSets.map((e) => e.pais).reverse().flat();
  const paiRest = jicha?.paiRest.sort((a, b) => b.id - a.id) ?? [];
  const userActions = actions.filter((e) => e.user.id === jicha.id);
  const validActions = userActions.filter(
    (e) => e.enable === void 0 && e.type !== "dahai" /* DAHAI */
  );
  const isDahaiExist = userActions.map((e) => e.type).includes(
    "dahai" /* DAHAI */
  );
  if (userActions.length > 0 && !isDahaiExist) {
    validActions.push({ type: "skip" /* SKIP */, user: jicha });
  }
  validActions.sort((a, b) => sortOrder[a.type] - sortOrder[b.type]);
  if (userActions.length === 0 && mode !== 1 /* PAI */) {
    setMode(1 /* PAI */);
  }
  const [userActionExist, setUserActionExist] = useState(
    userActions.length > 0
  );
  const [countdown, setCountdown] = useState(20);
  if (userActionExist !== userActions.length > 0) {
    if (!userActionExist && userActions.length > 0) {
      setCountdown(20);
    }
    setUserActionExist(userActions.length > 0);
  }
  useEffect(() => {
    const timerId = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1e3);
    return () => clearInterval(timerId);
  }, [countdown]);
  useInput((_, key) => {
    if (key.leftArrow) {
      switch (mode) {
        case 1 /* PAI */:
          setPaiPointer(Math.min(paiRest.length, paiPointer + 1));
          break;
        case 4 /* RCH */: {
          const richi = validActions[actPointer].options?.richi ?? [];
          const paiAll = [jicha.paiTsumo, ...paiRest];
          const idx = paiAll.slice(paiPointer + 1, paiAll.length).findIndex((e) => richi.map((e2) => e2.paiId).includes(e?.id ?? -1));
          if (idx !== -1) {
            setPaiPointer(Math.min(paiAll.length, paiPointer + idx + 1));
          }
          break;
        }
        case 2 /* ACT */:
          setActPointer(Math.min(validActions.length - 1, actPointer + 1));
          break;
        case 3 /* OPT */:
          setOptPointer(Math.min(nakis.length - 1, optPointer + 1));
          break;
      }
    }
    if (key.rightArrow) {
      switch (mode) {
        case 1 /* PAI */:
          setPaiPointer(Math.max(jicha.paiTsumo ? 0 : 1, paiPointer - 1));
          break;
        case 4 /* RCH */: {
          const richi = validActions[actPointer].options?.richi ?? [];
          const paiAll = [jicha.paiTsumo, ...paiRest];
          const idx = paiAll.slice(0, paiPointer).findLastIndex(
            (e) => richi.map((e2) => e2.paiId).includes(e?.id ?? -1)
          );
          if (idx !== -1) {
            setPaiPointer(Math.max(jicha.paiTsumo ? 0 : 1, idx));
          }
          break;
        }
        case 2 /* ACT */:
          setActPointer(Math.max(0, actPointer - 1));
          break;
        case 3 /* OPT */:
          setOptPointer(Math.max(0, optPointer - 1));
          break;
      }
    }
    if (key.upArrow) {
      if (validActions.length === 0) {
        return;
      }
      switch (mode) {
        case 1 /* PAI */:
          setMode(2 /* ACT */);
          setActPointer(Math.min(validActions.length - 1, actPointer));
          break;
      }
    }
    if (key.downArrow) {
      switch (mode) {
        case 2 /* ACT */:
          setMode(1 /* PAI */);
          setPaiPointer(Math.min(paiRest.length, paiPointer));
          break;
        case 3 /* OPT */:
          setMode(2 /* ACT */);
          break;
      }
    }
    if (key.return) {
      switch (mode) {
        case 1 /* PAI */: {
          const pai = paiPointer === 0 ? jicha.paiTsumo : paiRest[paiPointer - 1];
          socket.emit("input", name, "dahai" /* DAHAI */, {
            state,
            usrId: socket.id,
            dahai: { paiId: pai?.id ?? -1 }
          });
          break;
        }
        case 2 /* ACT */: {
          const action = validActions[actPointer];
          if (action.type === "skip" /* SKIP */) {
            socket.emit("input", name, "skip" /* SKIP */, {
              state,
              usrId: socket.id
            });
          }
          switch (action.type) {
            case "chi" /* CHI */:
            case "pon" /* PON */:
            case "ankan" /* ANKAN */:
            case "minkan" /* MINKAN */:
            case "kakan" /* KAKAN */:
              if (action.options?.naki?.length === 1) {
                socket.emit("input", name, "naki" /* NAKI */, {
                  state,
                  usrId: socket.id,
                  naki: action.options?.naki?.[0]
                });
                setMode(1 /* PAI */);
                setPaiPointer(1);
              } else {
                setMode(3 /* OPT */);
              }
              break;
            case "ron" /* RON */:
              socket.emit("input", name, "agari" /* AGARI */, {
                state,
                usrId: socket.id,
                agari: action.options?.agari?.[0]
              });
              break;
            case "tsumoAgari" /* TSUMO */: {
              socket.emit("input", name, "agari" /* AGARI */, {
                state,
                usrId: socket.id,
                agari: { paiId: jicha.paiTsumo?.id }
              });
              break;
            }
            case "richi" /* RICHI */: {
              const richi = action.options?.richi ?? [];
              const idx = paiRest.findIndex(
                (e) => richi.map((e2) => e2.paiId).includes(e.id)
              );
              if (idx !== -1) {
                setPaiPointer(idx + 1);
              }
              setMode(4 /* RCH */);
              break;
            }
            case "owari" /* OWARI */: {
              socket.emit("input", name, "owari" /* OWARI */, {
                state,
                usrId: socket.id,
                owari: { type: "yao9" }
              });
              break;
            }
          }
          break;
        }
        case 3 /* OPT */: {
          const action = validActions[actPointer];
          socket.emit("input", name, "naki" /* NAKI */, {
            state,
            usrId: socket.id,
            naki: action.options?.naki?.[optPointer]
          });
          setMode(1 /* PAI */);
          setPaiPointer(1);
          break;
        }
        case 4 /* RCH */: {
          const pai = paiPointer === 0 ? jicha.paiTsumo : paiRest[paiPointer - 1];
          socket.emit("input", name, "richi" /* RICHI */, {
            state,
            usrId: socket.id,
            richi: { paiId: pai?.id ?? -1 }
          });
          setMode(1 /* PAI */);
          setPaiPointer(1);
          break;
        }
      }
    }
  });
  const paiIdx = [1 /* PAI */, 4 /* RCH */].includes(mode) ? paiPointer : -1;
  const cmdIdx = [2 /* ACT */].includes(mode) ? actPointer : -1;
  const optIdx = [3 /* OPT */].includes(mode) ? optPointer : -1;
  const nakis = [3 /* OPT */].includes(mode) ? validActions[actPointer]?.options?.naki ?? [] : [];
  return /* @__PURE__ */ React5.createElement(
    Box5,
    {
      height,
      width,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-end"
    },
    /* @__PURE__ */ React5.createElement(
      Box5,
      {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        width
      },
      mode === 3 /* OPT */ && [...nakis].reverse().map((e, idx) => /* @__PURE__ */ React5.createElement(Box5, { key: `options-${idx}` }, e.pmyId.map((e2) => /* @__PURE__ */ React5.createElement(
        PaiTSX,
        {
          text: new Pai6(e2).dsp,
          key: e2,
          forceHeight: optIdx === nakis.length - 1 - idx ? 5 : 4
        }
      )))),
      mode !== 3 /* OPT */ && [...validActions].reverse().map((e, idx) => /* @__PURE__ */ React5.createElement(Box5, { key: `actions-${idx}` }, /* @__PURE__ */ React5.createElement(Text2, { inverse: cmdIdx === validActions.length - 1 - idx }, e.type)))
    ),
    /* @__PURE__ */ React5.createElement(
      Box5,
      {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        height: 5,
        width
      },
      [...paiRest].reverse().map((e) => new Pai6(e.id)).map((e, idx) => /* @__PURE__ */ React5.createElement(
        PaiTSX,
        {
          text: e.dsp,
          key: e.id,
          forceHeight: paiIdx === paiRest.length - idx ? 5 : 4
        }
      )),
      /* @__PURE__ */ React5.createElement(EmptyTSX, null),
      jicha?.paiTsumo ? /* @__PURE__ */ React5.createElement(
        PaiTSX,
        {
          text: new Pai6(jicha?.paiTsumo?.id ?? 0).dsp,
          key: 0,
          forceHeight: paiIdx === 0 ? 5 : 4
        }
      ) : /* @__PURE__ */ React5.createElement(EmptyTSX, null),
      /* @__PURE__ */ React5.createElement(EmptyTSX, null),
      /* @__PURE__ */ React5.createElement(
        Box5,
        {
          height: 4,
          width: 4,
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        },
        userActionExist && /* @__PURE__ */ React5.createElement(Text2, null, countdown)
      ),
      /* @__PURE__ */ React5.createElement(EmptyTSX, null),
      paiSets.map((e) => /* @__PURE__ */ React5.createElement(PaiTSX, { text: new Pai6(e.id).dsp, key: e.id }))
    )
  );
};
var JichaKawaTSX = ({ jicha, height, width }) => {
  const columns = [[], [], [], [], [], []];
  jicha.paiKawa.slice(0, 18).forEach((e, idx) => {
    columns[idx % 6].push(e.id);
  });
  return /* @__PURE__ */ React5.createElement(
    Box5,
    {
      flexDirection: "row",
      width,
      height
    },
    columns.map((column, idx) => /* @__PURE__ */ React5.createElement(
      Box5,
      {
        flexDirection: "column",
        key: column.join(",") + idx,
        justifyContent: "flex-start"
      },
      column.map((e, idx2) => /* @__PURE__ */ React5.createElement(
        PaiTSX,
        {
          text: new Pai6(e).dsp,
          key: e,
          enableTop: idx2 === 0,
          enableSide: idx2 === column.length - 1
        }
      ))
    ))
  );
};
var JichaKawaExtraTSX = ({ jicha, height, width }) => {
  const pais = jicha.paiKawa.slice(18, 24);
  return /* @__PURE__ */ React5.createElement(
    Box5,
    {
      flexDirection: "row",
      alignItems: "flex-end",
      width,
      height
    },
    pais.map((e) => /* @__PURE__ */ React5.createElement(PaiTSX, { text: new Pai6(e.id).dsp, key: e.id }))
  );
};

// center.tsx
import { Pai as Pai7 } from "@k-jun/mahjong";
import { Box as Box6, Text as Text3 } from "ink";
import React6 from "react";
var CenterTSX = ({ mahjong, height, width, socketId }) => {
  const paiDora = mahjong.paiDora;
  const paiDoraList = [];
  for (let i = 0; i < 5; i++) {
    if (i < paiDora.length) {
      paiDoraList.push(/* @__PURE__ */ React6.createElement(PaiTSX, { text: new Pai7(paiDora[i].id).dsp, key: i }));
      continue;
    }
    paiDoraList.push(/* @__PURE__ */ React6.createElement(PaiTSX, { key: 200 + i }));
  }
  return /* @__PURE__ */ React6.createElement(
    Box6,
    {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      height,
      width,
      borderStyle: "round"
    },
    /* @__PURE__ */ React6.createElement(
      Box6,
      {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        height: 5
      },
      paiDoraList
    ),
    /* @__PURE__ */ React6.createElement(
      BakyokuTSX,
      {
        mahjong,
        height: height - 5,
        width,
        socketId
      }
    )
  );
};
var BakyokuTSX = ({ mahjong, height, width, socketId }) => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const jicha = mahjong?.users[userIndex];
  const shimocha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const kamicha = mahjong?.users[(userIndex + 3) % 4];
  const turnRest = mahjong.paiYama.length + mahjong.paiRinshan.length - 4;
  const kyoku = ["\u6771", "\u5357", "\u897F", "\u5317"][Math.floor(mahjong.kyoku / 4) % 4].toString() + (mahjong.kyoku % 4 + 1).toString();
  return /* @__PURE__ */ React6.createElement(
    Box6,
    {
      flexDirection: "column",
      justifyContent: "space-between",
      height,
      width
    },
    /* @__PURE__ */ React6.createElement(
      Box6,
      {
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        height: 5
      },
      /* @__PURE__ */ React6.createElement(Text3, null, new Pai7(toimen.paiJikaze?.id ?? 0).dsp, toimen.point),
      /* @__PURE__ */ React6.createElement(Text3, null, new Pai7(kamicha.paiJikaze?.id ?? 0).dsp, kamicha.point, " ", new Pai7(shimocha.paiJikaze?.id ?? 0).dsp, shimocha.point),
      /* @__PURE__ */ React6.createElement(Text3, null, new Pai7(jicha.paiJikaze?.id ?? 0).dsp, jicha.point)
    ),
    /* @__PURE__ */ React6.createElement(
      Box6,
      {
        flexDirection: "row",
        height: 4,
        justifyContent: "center",
        alignItems: "center"
      },
      /* @__PURE__ */ React6.createElement(
        Box6,
        {
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: 11
        },
        /* @__PURE__ */ React6.createElement(Text3, null, kyoku),
        /* @__PURE__ */ React6.createElement(Text3, null, turnRest)
      ),
      /* @__PURE__ */ React6.createElement(
        Box6,
        {
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: 11
        },
        /* @__PURE__ */ React6.createElement(Text3, null, mahjong.honba, " \u672C\u5834"),
        /* @__PURE__ */ React6.createElement(Text3, null, mahjong.kyotaku, " \u4F9B\u8A17")
      )
    )
  );
};

// result.tsx
import React7 from "react";
import { Box as Box7, Text as Text4 } from "ink";
import { Pai as Pai8 } from "@k-jun/mahjong";
var ResultTSX = ({ mahjong, socketId }) => {
  if (mahjong.status === "completed") {
    return /* @__PURE__ */ React7.createElement(ResultCompletedTSX, { mahjong, socketId });
  }
  if (mahjong.status === "ended") {
    if (mahjong.tokutens.length > 0) {
      return /* @__PURE__ */ React7.createElement(ResultEndedAgariTSX, { mahjong, socketId });
    }
    switch (mahjong.EndedType) {
      /* falls through */
      case "yao9":
      case "kaze4":
      case "richi4":
      case "kan4":
        return /* @__PURE__ */ React7.createElement(ResultEndedTochuRyukyokuTSX, { mahjong });
      default:
        return /* @__PURE__ */ React7.createElement(ResultEndedRyukyokuTSX, { mahjong, socketId });
    }
  }
  return /* @__PURE__ */ React7.createElement(Text4, null, "not defined");
};
var ResultEndedAgariTSX = ({ mahjong, socketId }) => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const kaze = [0, 1, 2, 3].map(
    (e) => new Pai8(mahjong?.users[(userIndex + e) % 4].paiJikaze?.id).dsp
  );
  const tokuten = mahjong.tokutens[0];
  const paiRest = tokuten.user.paiRest;
  const paiLast = tokuten.input.paiLast;
  const paiSets = tokuten.input.paiSets.map((e) => e.pais).flat();
  const output = tokuten.output;
  const input = tokuten.input;
  const pointText = output.pointPrt > 0 ? `${output.pointCdn}-${output.pointPrt}\u70B9` : `${output.pointCdn}\u70B9`;
  const base = [0, 1, 2, 3].map(
    (e) => mahjong.scrdiffs[0].base[(userIndex + e) % 4]
  );
  const diff = [0, 1, 2, 3].map(
    (e) => mahjong.scrdiffs[0].diff[(userIndex + e) % 4]
  ).map((e) => e > 0 ? `+${e}` : e === 0 ? "" : `${e}`);
  return /* @__PURE__ */ React7.createElement(
    Box7,
    {
      borderColor: "white",
      borderStyle: "round",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      key: `result-ended-ryukyoku`
    },
    /* @__PURE__ */ React7.createElement(Text4, null, "\u548C\u4E86"),
    /* @__PURE__ */ React7.createElement(
      Box7,
      {
        flexDirection: "row",
        justifyContent: "center",
        key: "result-agari"
      },
      paiRest.sort((a, b) => a.id - b.id).map((e) => new Pai8(e.id)).map((e) => /* @__PURE__ */ React7.createElement(PaiTSX, { key: `result-${e.id}`, text: e.dsp })),
      /* @__PURE__ */ React7.createElement(EmptyTSX, null),
      paiLast ? /* @__PURE__ */ React7.createElement(
        PaiTSX,
        {
          key: `result-${paiLast.id}`,
          text: new Pai8(paiLast.id).dsp
        }
      ) : /* @__PURE__ */ React7.createElement(EmptyTSX, null),
      /* @__PURE__ */ React7.createElement(EmptyTSX, null),
      paiSets.map((e) => /* @__PURE__ */ React7.createElement(PaiTSX, { text: new Pai8(e.id).dsp, key: e.id }))
    ),
    /* @__PURE__ */ React7.createElement(
      Box7,
      {
        flexDirection: "column",
        justifyContent: "center",
        key: `result-${tokuten.user.id}`
      },
      /* @__PURE__ */ React7.createElement(
        Box7,
        {
          flexDirection: "row",
          justifyContent: "center",
          width: 20,
          key: `result-yakus`
        },
        /* @__PURE__ */ React7.createElement(Text4, null, `${tokuten.output.fu}\u7B26`),
        /* @__PURE__ */ React7.createElement(Text4, null, `${tokuten.output.han}\u7FFB`),
        /* @__PURE__ */ React7.createElement(Text4, null, `${pointText}`)
      ),
      output.yakus.map((e, idx) => {
        return /* @__PURE__ */ React7.createElement(
          Box7,
          {
            flexDirection: "row",
            justifyContent: "space-between",
            width: 20,
            key: `result-yakus-${idx}`
          },
          /* @__PURE__ */ React7.createElement(Text4, null, `${e.str}`),
          /* @__PURE__ */ React7.createElement(Text4, null, `${e.yakuman ? "\u5F79\u6E80" : `${e.val}\u7FFB`}`)
        );
      })
    ),
    /* @__PURE__ */ React7.createElement(Box7, { flexDirection: "row", justifyContent: "center", key: `result-ura-dora` }, [0, 1, 2, 3, 4].map((e) => /* @__PURE__ */ React7.createElement(
      PaiTSX,
      {
        key: `result-uradora-${e}`,
        text: input.paiDoraUra[e]?.id ? new Pai8(input.paiDoraUra[e].id).prev().dsp : "  "
      }
    ))),
    /* @__PURE__ */ React7.createElement(
      Box7,
      {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: 5,
        key: `result-score-${tokuten.user.id}`
      },
      /* @__PURE__ */ React7.createElement(Text4, null, kaze[2], `${base[2]}${diff[2]}`),
      /* @__PURE__ */ React7.createElement(Text4, null, kaze[3], `${base[3]}${diff[3]}`, " ", kaze[1], `${base[1]}${diff[1]}`),
      /* @__PURE__ */ React7.createElement(Text4, null, kaze[0], `${base[0]}${diff[0]}`)
    )
  );
};
var ResultEndedRyukyokuTSX = ({ mahjong, socketId }) => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socketId);
  const kaze = [0, 1, 2, 3].map(
    (e) => new Pai8(mahjong?.users[(userIndex + e) % 4].paiJikaze?.id).dsp
  );
  const scrdiff = mahjong.scrdiffs[0];
  const base = [0, 1, 2, 3].map((e) => scrdiff.base[(userIndex + e) % 4]);
  const diff = [0, 1, 2, 3].map((e) => scrdiff.diff[(userIndex + e) % 4]).map((e) => e > 0 ? `+${e}` : e === 0 ? "" : `${e}`);
  return /* @__PURE__ */ React7.createElement(
    Box7,
    {
      borderColor: "white",
      borderStyle: "round",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      key: `result-ended-ryukyoku`
    },
    /* @__PURE__ */ React7.createElement(Text4, null, "\u6D41\u5C40"),
    /* @__PURE__ */ React7.createElement(
      Box7,
      {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: 5,
        key: `result-score`
      },
      /* @__PURE__ */ React7.createElement(Text4, null, kaze[2], `${base[2]}${diff[2]}`),
      /* @__PURE__ */ React7.createElement(Text4, null, kaze[3], `${base[3]}${diff[3]}`, " ", kaze[1], `${base[1]}${diff[1]}`),
      /* @__PURE__ */ React7.createElement(Text4, null, kaze[0], `${base[0]}${diff[0]}`)
    )
  );
};
var EndTypeConvertor = {
  "yao9": "\u4E5D\u7A2E\u4E5D\u724C",
  "kaze4": "\u56DB\u98A8\u9023\u6253",
  "richi4": "\u56DB\u5BB6\u7ACB\u76F4",
  "ron3": "\u4E09\u5BB6\u548C\u4E86",
  "kan4": "\u56DB\u69D3\u6563\u4E86"
};
var ResultEndedTochuRyukyokuTSX = ({ mahjong }) => {
  let reason = "\u30C4\u30E2\u6D41\u5C40";
  if (mahjong.EndedType !== void 0) {
    reason = EndTypeConvertor[mahjong.EndedType];
  }
  return /* @__PURE__ */ React7.createElement(
    Box7,
    {
      borderColor: "white",
      borderStyle: "round",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      key: `result-ended-tochu-ryukyoku`
    },
    /* @__PURE__ */ React7.createElement(Text4, null, reason)
  );
};
var ResultCompletedTSX = ({ mahjong, socketId }) => {
  const userIdx = mahjong.users.findIndex((user) => user.id === socketId);
  const jicha = mahjong.users[userIdx];
  const shimocha = mahjong.users[(userIdx + 1) % 4];
  const toimen = mahjong.users[(userIdx + 2) % 4];
  const kamicha = mahjong.users[(userIdx + 3) % 4];
  const info = [
    { name: "\u81EA\u5BB6", point: jicha.point },
    { name: "\u4E0B\u5BB6", point: shimocha.point },
    { name: "\u5BFE\u5BB6", point: toimen.point },
    { name: "\u4E0A\u5BB6", point: kamicha.point }
  ];
  info.sort((a, b) => b.point - a.point);
  return /* @__PURE__ */ React7.createElement(
    Box7,
    {
      borderColor: "white",
      borderStyle: "round",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      key: `result-completed`
    },
    /* @__PURE__ */ React7.createElement(Text4, null, "\u7D42\u5C40"),
    /* @__PURE__ */ React7.createElement(
      Box7,
      {
        flexDirection: "column",
        justifyContent: "center",
        width: 20,
        key: `result-oshimai`
      },
      info.map((e, idx) => /* @__PURE__ */ React7.createElement(
        Box7,
        {
          flexDirection: "row",
          justifyContent: "space-between",
          width: 20,
          key: `result-oshimai-${e.name}`
        },
        /* @__PURE__ */ React7.createElement(Text4, null, `${idx + 1}\u4F4D ${e.name}`),
        /* @__PURE__ */ React7.createElement(Text4, null, `${e.point}\u70B9`)
      ))
    )
  );
};

// main.tsx
import terminalSize from "terminal-size";
var CountDownTSX = ({ timeout, height, width }) => {
  const [countdown, setCountdown] = useState2(timeout);
  useEffect2(() => {
    const timerId = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1e3);
    return () => clearInterval(timerId);
  }, [countdown]);
  return /* @__PURE__ */ React8.createElement(
    Box8,
    {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height,
      width
    },
    /* @__PURE__ */ React8.createElement(Text5, null, "Waiting for game to start... ", countdown)
  );
};
var App = ({ mahjong, name, socket }) => {
  const { columns, rows } = terminalSize();
  if (mahjong === void 0) {
    return /* @__PURE__ */ React8.createElement(CountDownTSX, { timeout: 20, height: rows, width: columns });
  }
  const userIndex = mahjong?.users.findIndex((user) => user.id === socket.id);
  const jicha = mahjong?.users[userIndex];
  const shimocha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const kamicha = mahjong?.users[(userIndex + 3) % 4];
  const actions = mahjong?.actions;
  return /* @__PURE__ */ React8.createElement(
    Box8,
    {
      flexDirection: "column",
      justifyContent: "center",
      height: rows,
      width: columns,
      alignItems: "center"
    },
    /* @__PURE__ */ React8.createElement(
      Box8,
      {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 60,
        width: 110,
        borderStyle: "round"
      },
      /* @__PURE__ */ React8.createElement(Box8, { height: 60, width: 4 }, /* @__PURE__ */ React8.createElement(KamichaTSX, { kamicha })),
      /* @__PURE__ */ React8.createElement(
        Box8,
        {
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          width: 100,
          height: 60
        },
        /* @__PURE__ */ React8.createElement(ToimenTSX, { toimen, height: 4, width: 100 }),
        mahjong.status !== "playing" ? /* @__PURE__ */ React8.createElement(ResultTSX, { mahjong, socketId: socket.id ?? "" }) : /* @__PURE__ */ React8.createElement(
          MainTSX,
          {
            mahjong,
            socket,
            height: 14 * 3,
            width: 24 * 3
          }
        ),
        /* @__PURE__ */ React8.createElement(
          JichaTSX,
          {
            jicha,
            actions,
            height: 10,
            width: 100,
            socket,
            name,
            state: mahjong.state
          }
        )
      ),
      /* @__PURE__ */ React8.createElement(Box8, { height: 60, width: 4 }, /* @__PURE__ */ React8.createElement(ShimochaTSX, { shimocha }))
    )
  );
};
var MainTSX = ({ mahjong, socket }) => {
  const userIndex = mahjong?.users.findIndex((user) => user.id === socket.id);
  const jicha = mahjong?.users[userIndex];
  const shimocha = mahjong?.users[(userIndex + 1) % 4];
  const toimen = mahjong?.users[(userIndex + 2) % 4];
  const kamicha = mahjong?.users[(userIndex + 3) % 4];
  return /* @__PURE__ */ React8.createElement(Box8, { flexDirection: "row", alignItems: "center", width: 24 * 3, height: 14 * 3 }, /* @__PURE__ */ React8.createElement(Box8, { flexDirection: "column" }, /* @__PURE__ */ React8.createElement(
    Box8,
    {
      height: 14,
      width: 24,
      flexDirection: "column",
      justifyContent: "flex-end"
    },
    /* @__PURE__ */ React8.createElement(ToimenKawaExtraTSX, { toimen, height: 8, width: 24 })
  ), /* @__PURE__ */ React8.createElement(KamichaKawaTSX, { kamicha, height: 14, width: 24 }), /* @__PURE__ */ React8.createElement(
    Box8,
    {
      height: 14,
      width: 24,
      flexDirection: "row",
      justifyContent: "flex-end"
    },
    /* @__PURE__ */ React8.createElement(KamichaKawaExtraTSX, { kamicha, height: 14, width: 12 })
  )), /* @__PURE__ */ React8.createElement(Box8, { flexDirection: "column" }, /* @__PURE__ */ React8.createElement(ToimenKawaTSX, { toimen, height: 8, width: 24 }), /* @__PURE__ */ React8.createElement(
    CenterTSX,
    {
      mahjong,
      height: 14,
      width: 24,
      socketId: socket.id ?? ""
    }
  ), /* @__PURE__ */ React8.createElement(JichaKawaTSX, { jicha, height: 8, width: 24 })), /* @__PURE__ */ React8.createElement(Box8, { flexDirection: "column" }, /* @__PURE__ */ React8.createElement(Box8, { height: 14, width: 24 }, /* @__PURE__ */ React8.createElement(ShimochaKawaExtraTSX, { shimocha, height: 14, width: 12 })), /* @__PURE__ */ React8.createElement(ShimochaKawaTSX, { shimocha, height: 14, width: 24 }), /* @__PURE__ */ React8.createElement(Box8, { height: 14, width: 24, flexDirection: "column" }, /* @__PURE__ */ React8.createElement(JichaKawaExtraTSX, { jicha, height: 8, width: 24 }))));
};
var main = async (endpoint) => {
  const attempts = 3;
  const socket = await io(endpoint, { reconnectionAttempts: attempts - 1 });
  let ink;
  socket.on("connect", async () => {
    ink = render(/* @__PURE__ */ React8.createElement(App, { mahjong: void 0, name: "", socket }));
    socket.on("output", (name, data) => {
      ink.rerender(/* @__PURE__ */ React8.createElement(App, { mahjong: data, name, socket }));
    });
    await socket.emit("join");
  });
  let cnt = 0;
  socket.on("connect_error", (_) => {
    cnt++;
    if (cnt >= attempts) {
      console.log(
        `Failed to establish WebSocket connection. Please check if the server is running and accessible at ${endpoint}.`
      );
    }
  });
  process.on("SIGINT", () => {
    socket.close();
    ink?.unmount();
  });
};
await new Command().name("mahjong-tui").version("0.2.2").description("Mahjong TUI").helpOption("--help", "Print help info.").option("-h, --host <host>", "Host", "mahjong-tui.k-jun.net").option("-p, --port <port>", "Port", "443").action((options) => {
  const isLocal = (host) => host === "localhost" || host.startsWith("127.") || host === "::1";
  const protocol = isLocal(options.host) ? "ws" : "wss";
  main(`${protocol}://${options.host}:${options.port}`);
}).parse();
