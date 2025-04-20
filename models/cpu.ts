import { Mahjong, MahjongActionType, MahjongInput } from "./mahjong.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ActionDefault = async (
  mahjong: Mahjong,
  userId: string,
  timeout: number,
  state: Map<string, boolean>,
): Promise<void> => {
  const beforeState = mahjong.state;
  await sleep(timeout);
  if (mahjong.state !== beforeState) {
    return;
  }
  if (mahjong.isEnded && mahjong.turnUser().id === userId) {
    await sleep(10000);
    mahjong.gameReset();
    await mahjong.gameStart(mahjong.generate());
    return;
  }

  const user = mahjong.users.find((e) => e.id === userId);
  if (!user) {
    throw new Error(
      `User not found uesrs:${
        mahjong.users.map((e) => e.id)
      }, userId:${userId}`,
    );
  }

  const liveActions = mahjong.actions.filter((e) => e.enable === undefined);
  const userActions = liveActions.filter((e) => e.user.id === user.id);
  if (liveActions.length !== 0) {
    if (userActions.length !== 0) {
      const action = userActions[0];
      switch (action.type) {
        case MahjongActionType.CHI: {
          const kawa = mahjong.turnUser().paiKawa;
          const pai = kawa[kawa.length - 1];
          const sets = user.canChi({ pai });
          state.set("afterNaki", true);
          mahjong.input(MahjongInput.NAKI, {
            user,
            params: {
              naki: {
                set: sets[0],
              },
            },
          });
          break;
        }
        case MahjongActionType.PON: {
          const kawa = mahjong.turnUser().paiKawa;
          const pai = kawa[kawa.length - 1];
          const userIdx = mahjong.users.findIndex((e) => e.id === userId);

          const sets = user.canPon({
            pai,
            fromWho: mahjong.fromWho(userIdx, mahjong.turnUserIdx),
          });
          state.set("afterNaki", true);
          mahjong.input(MahjongInput.NAKI, {
            user,
            params: {
              naki: {
                set: sets[0],
              },
            },
          });
          break;
        }
        case MahjongActionType.MINKAN: {
          const kawa = mahjong.turnUser().paiKawa;
          const pai = kawa[kawa.length - 1];
          const userIdx = mahjong.users.findIndex((e) => e.id === userId);
          const sets = user.canMinkan({
            pai,
            fromWho: mahjong.fromWho(userIdx, mahjong.turnUserIdx),
          });
          state.set("afterKan", true);
          mahjong.input(MahjongInput.NAKI, {
            user,
            params: {
              naki: {
                set: sets[0],
              },
            },
          });
          break;
        }
        case MahjongActionType.KAKAN: {
          const sets = user.canKakan();
          state.set("afterKan", true);
          mahjong.input(MahjongInput.NAKI, {
            user,
            params: {
              naki: {
                set: sets[0],
              },
            },
          });
          break;
        }
        case MahjongActionType.ANKAN: {
          const sets = user.canAnkan();
          state.set("afterKan", true);
          mahjong.input(MahjongInput.NAKI, {
            user,
            params: {
              naki: {
                set: sets[0],
              },
            },
          });
          break;
        }
        case MahjongActionType.RON: {
          const kawa = mahjong.turnUser().paiKawa;
          const pai = kawa[kawa.length - 1];
          mahjong.input(MahjongInput.AGARI, {
            user,
            params: {
              agari: {
                fromUser: mahjong.turnUser(),
                paiAgari: pai,
              },
            },
          });
          break;
        }
        case MahjongActionType.TSUMO: {
          mahjong.input(MahjongInput.AGARI, {
            user,
            params: {
              agari: {
                fromUser: mahjong.turnUser(),
                paiAgari: user.paiTsumo!,
              },
            },
          });
          break;
        }
        default:
          mahjong.input(MahjongInput.SKIP, { user, params: {} });
          break;
      }
    }
    return;
  }

  const turnUser = mahjong.turnUser();
  if (turnUser.id === user.id) {
    const allPais = [...turnUser.paiRest].sort((a, b) => a.id - b.id);

    if (state.get("afterNaki")) {
      state.set("afterNaki", false);
      mahjong.input(MahjongInput.DAHAI, {
        user,
        params: { dahai: { paiDahai: allPais[allPais.length - 1] } },
      });
      return;
    }
    if (turnUser.paiTsumo !== undefined) {
      allPais.push(turnUser.paiTsumo);
      allPais.sort((a, b) => a.id - b.id);
      mahjong.input(MahjongInput.DAHAI, {
        user,
        params: { dahai: { paiDahai: allPais[allPais.length - 1] } },
      });
    }
  }
};
