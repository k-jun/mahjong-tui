import { Mahjong, MahjongActionType, MahjongCommand } from "./mahjong.ts";
import { expect } from "jsr:@std/expect";
import { fixtures } from "../utils/utils.ts";
import { Pai, PaiSet } from "@k-jun/mahjong";

Deno.test("mahjong all", async () => {
  const userIds = ["0", "1", "2", "3"];
  const mockOutput = (_: Mahjong) => {};

  let globalGame: Mahjong = new Mahjong(userIds, mockOutput);
  let resultChecker: {
    yakus: {
      str: string;
      val: number;
      yakuman: boolean;
    }[];
    score: number[];
    paiDora: Pai[];
    paiDoraUra: Pai[];
  }[] = [];
  await fixtures(async ({ name, params }): Promise<void> => {
    switch (name) {
      case "DONE": {
        break;
      }
      case "INIT": {
        await _done(globalGame, resultChecker);
        const { hai0, hai1, hai2, hai3, yama } = params.init!;
        resultChecker = [];
        globalGame.gameReset();
        globalGame.gameStart(yama.map((e) => new Pai(e.id)));
        // console.log(
        //   name,
        //   globalGame.kyoku,
        //   globalGame.honba,
        //   globalGame.turnUserIdx,
        //   globalGame.turnRest(),
        // );

        expect(globalGame.users.map((e) => e.paiRest.length)).toEqual(
          new Array(4).fill(13),
        );
        expect(globalGame.users[0].paiRest).toEqual(
          hai0.map((e) => new Pai(e.id)),
        );
        expect(globalGame.users[1].paiRest).toEqual(
          hai1.map((e) => new Pai(e.id)),
        );
        expect(globalGame.users[2].paiRest).toEqual(
          hai2.map((e) => new Pai(e.id)),
        );
        expect(globalGame.users[3].paiRest).toEqual(
          hai3.map((e) => new Pai(e.id)),
        );
        break;
      }
      case "AGARI": {
        const {
          who,
          fromWho,
          paiLast,
          yakus,
          score,
          paiDora,
          paiDoraUra,
          owari,
        } = params.agari!;

        const isChankan = yakus.map((e) => e.str).includes("槍槓");

        if (isChankan) {
          await globalGame.input(MahjongCommand.CHNKN, {
            user: globalGame.users[who],
            params: {
              chnkn: {
                paiChnkn: new Pai(paiLast.id),
                fromUser: globalGame.users[fromWho],
              },
            },
          });
        } else {
          await globalGame.input(MahjongCommand.AGARI, {
            user: globalGame.users[who],
            params: {
              agari: {
                paiAgari: new Pai(paiLast.id),
                fromUser: globalGame.users[fromWho],
              },
            },
          });
        }
        resultChecker.push({
          yakus,
          score,
          paiDora,
          paiDoraUra,
        });
        if (owari !== undefined) {
          // await _done(globalGame, resultChecker);
          globalGame = new Mahjong(userIds, mockOutput);
        }
        break;
      }
      case "TSUMO": {
        for (let i = 0; i < globalGame.actions.length; i++) {
          await globalGame.input(MahjongCommand.SKIP, {
            user: globalGame.actions[i].user,
            params: {},
          });
        }
        const { who, hai } = params.tsumo!;
        await globalGame.input(MahjongCommand.TSUMO, {
          user: globalGame.turnUser(),
          params: {},
        });
        expect(globalGame.turnUser().paiTsumo).toEqual(new Pai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        break;
      }
      case "RNSHN": {
        const { who, hai } = params.tsumo!;
        await globalGame.input(MahjongCommand.RNSHN, {
          user: globalGame.turnUser(),
          params: {},
        });

        expect(globalGame.turnUser().paiTsumo).toEqual(new Pai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        expect(globalGame.turnUser().isRinshankaiho).toEqual(true);
        break;
      }
      case "DAHAI": {
        const { who, hai } = params.dahai!;
        expect(globalGame.turnUserIdx).toEqual(who);
        await globalGame.input(MahjongCommand.DAHAI, {
          user: globalGame.turnUser(),
          params: { dahai: { paiDahai: new Pai(hai.id) } },
        });
        break;
      }
      case "RICHI": {
        const { who, step, ten } = params.richi!;
        if (step == 2) {
          await globalGame.input(MahjongCommand.RICHI, {
            user: globalGame.users[who],
            params: {},
          });
          expect(globalGame.users.map((e) => e.point)).toEqual(ten);
        }
        break;
      }
      case "NAKI": {
        const { who, set } = params.naki!;

        // 暗槓が選択され、それがかつ、ほかプレイヤーの槍槓を選択可能にした場合、槍槓が actions に新しく加わってしまう。
        // ここで skip したいのは暗槓選択前に表示されていた、pon. chi などの他アクションのため、暗槓選択前の actions を保存しておく。
        const beforeActions = [...globalGame.actions];
        await globalGame.input(MahjongCommand.NAKI, {
          user: globalGame.users[who],
          params: {
            naki: {
              set: new PaiSet({
                paiRest: set.paiRest.map((e) => new Pai(e.id)),
                paiCall: set.paiCall.map((e) => new Pai(e.id)),
                type: set.type,
                fromWho: set.fromWho,
              }),
            },
          },
        });

        const otherActions = beforeActions.filter((e) =>
          e.user.id !== globalGame.users[who].id
        );
        for (let i = 0; i < otherActions.length; i++) {
          await globalGame.input(MahjongCommand.SKIP, {
            user: otherActions[i].user,
            params: {},
          });
        }
        break;
      }
      case "RYUKYOKU": {
        const { score, owari, type } = params.ryukyoku!;
        let isNagashi = false;
        if (
          type === "kaze4" || type === "yao9" || type === "reach4" ||
          type === "ron3" || type === "kan4"
        ) {
          isNagashi = true;
        }
        await globalGame.input(MahjongCommand.OWARI, {
          user: globalGame.turnUser(),
          params: {
            owari: { nagashi: isNagashi },
          },
        });
        expect(globalGame.users.map((e) => e.point)).toEqual(score);
        if (owari !== undefined) {
          globalGame = new Mahjong(userIds, mockOutput);
        }
        break;
      }
      case "DORA": {
        const { hai } = params.dora!;
        await globalGame.input(MahjongCommand.DORA, {
          user: globalGame.turnUser(),
          params: {},
        });
        expect(globalGame.paiDora[globalGame.paiDora.length - 1].id).toEqual(
          hai.id,
        );
        break;
      }
    }
  });
});

async function _done(
  globalGame: Mahjong,
  checker: {
    yakus: { str: string; val: number; yakuman: boolean }[];
    score: number[];
    paiDora: Pai[];
    paiDoraUra: Pai[];
  }[],
): Promise<void> {
  if (globalGame.actions.length === 0) {
    return;
  }

  const actionUndefined = globalGame.actions.filter((e) =>
    e.enable === undefined && e.type === MahjongActionType.RON
  );
  for (const action of actionUndefined) {
    await globalGame.input(MahjongCommand.SKIP, {
      user: action.user,
      params: {},
    });
  }
  checker.forEach(
    ({ yakus, score, paiDora, paiDoraUra }, idx) => {
      const actYakus = globalGame.result[idx].yakus
        .filter((e) => e.val > 0).map((
          e,
        ) => ({
          ...e,
        })).sort((a, b) => a.str.localeCompare(b.str));

      expect(globalGame.paiDora).toEqual(
        paiDora.map((e) => new Pai(e.id)),
      );
      if (paiDoraUra.length > 0) {
        expect(globalGame.paiDoraUra).toEqual(
          paiDoraUra.map((e) => new Pai(e.id)),
        );
      }
      expect(actYakus).toEqual(
        yakus.filter((e) => e.val > 0).sort((a, b) =>
          a.str.localeCompare(b.str)
        ),
      );

      if (idx === checker.length - 1) {
        expect(globalGame.users.map((e) => e.point)).toEqual(score);
      }
    },
  );
}
