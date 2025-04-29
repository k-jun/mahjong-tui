import { Mahjong, MahjongActionType, MahjongInput } from "./mahjong.ts";

export const ActionDefault = (
  {
    mahjong,
    userId,
    state,
  }: {
    mahjong: Mahjong;
    userId: string;
    state: string;
  },
): void => {
  const user = mahjong.users.find((e) => e.id === userId)!;

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
      const pai = user.paiTsumo ?? user.paiRest.sort((a, b) => b.id - a.id)[0];
      mahjong.input(MahjongInput.DAHAI, { usrId: action.user.id, state, dahai: { paiId: pai.id } });
      continue;
    }
    // if (
    //   [
    //     MahjongActionType.CHI,
    //     MahjongActionType.PON,
    //     MahjongActionType.ANKAN,
    //     MahjongActionType.MINKAN,
    //     MahjongActionType.KAKAN,
    //   ].includes(action.type)
    // ) {
    //   mahjong.input(MahjongInput.NAKI, {
    //     usrId: user.id,
    //     state: mahjong.state,
    //     naki: action.options?.naki?.[0],
    //   });
    //   continue;
    // }
    mahjong.input(MahjongInput.SKIP, { usrId: action.user.id, state });
  }
};
