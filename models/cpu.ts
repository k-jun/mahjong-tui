import { Mahjong, MahjongInput } from "./mahjong.ts";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const ActionDefault = async (
  mahjong: Mahjong,
  userId: string,
  timeout: number,
): Promise<void> => {
  const beforeState = mahjong.state;
  await sleep(timeout);
  if (mahjong.state !== beforeState) {
    return;
  }
  if (mahjong.turnRest() === 0) {
    return;
  }

  const user = mahjong.users.find((e) => e.id === userId);
  if (!user) {
    throw new Error("User not found");
  }

  const liveActions = mahjong.actions.filter((e) => e.enable === undefined);
  const userActions = liveActions.filter((e) => e.user.id === user.id);
  if (liveActions.length !== 0) {
    if (userActions.length !== 0) {
      mahjong.input(MahjongInput.SKIP, { user, params: {} });
    }
    return;
  }

  const turnUser = mahjong.turnUser();
  if (turnUser.id === user.id) {
    if (turnUser.paiTsumo === undefined) {
      mahjong.input(MahjongInput.TSUMO, { user, params: {} });
    } else {
      mahjong.input(MahjongInput.DAHAI, {
        user,
        params: { dahai: { paiDahai: turnUser.paiTsumo } },
      });
    }
  }
};
