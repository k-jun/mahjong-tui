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
  if (mahjong.turnRest() === 0) {
    return;
  }
  if (mahjong.isEnded) {
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
            fromWho: mahjong.getPlayer(userIdx, mahjong.turnUserIdx),
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
            fromWho: mahjong.getPlayer(userIdx, mahjong.turnUserIdx),
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
        default:
          mahjong.input(MahjongInput.SKIP, { user, params: {} });
          break;
      }
    }
    return;
  }

  const turnUser = mahjong.turnUser();
  if (turnUser.id === user.id) {
    if (state.get("afterNaki")) {
      state.set("afterNaki", false);
      mahjong.input(MahjongInput.DAHAI, {
        user,
        params: { dahai: { paiDahai: turnUser.paiRest[0] } },
      });
      return;
    }
    if (state.get("afterKan")) {
      state.set("afterKan", false);
      mahjong.input(MahjongInput.RNSHN, { user, params: {} });
      return;
    }
    if (turnUser.paiTsumo !== undefined) {
      mahjong.input(MahjongInput.DAHAI, {
        user,
        params: { dahai: { paiDahai: turnUser.paiTsumo } },
      });
    } else {
      mahjong.input(MahjongInput.TSUMO, { user, params: {} });
    }
  }
};
