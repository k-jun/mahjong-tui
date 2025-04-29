import { Mahjong, MahjongActionType, MahjongInput } from "./mahjong.ts";

export const ActionDefault = (
  mahjong: Mahjong,
  userId: string,
): void => {
  const user = mahjong.users.find((e) => e.id === userId);
  if (!user) {
    throw new Error(
      `User not found uesrs:${mahjong.users.map((e) => e.id)}, userId:${userId}`,
    );
  }

  const liveActions = mahjong.actions.filter((e) => e.enable === undefined);
  const userActions = liveActions.filter((e) => e.user.id === user.id);

  if (userActions.length === 0) {
    return;
  }

  for (const action of userActions) {
    if (action.type === MahjongActionType.OWARI) {
      continue;
    }
    if (action.type === MahjongActionType.DAHAI) {
      mahjong.input(MahjongInput.DAHAI, {
        usrId: user.id,
        state: mahjong.state,
        dahai: {
          paiId: user.paiTsumo!.id,
        },
      });
      continue;
    }
    mahjong.input(MahjongInput.SKIP, {
      usrId: user.id,
      state: mahjong.state,
    });
  }
};
