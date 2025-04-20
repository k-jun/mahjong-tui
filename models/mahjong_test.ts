import { Mahjong, MahjongActionType, MahjongInput } from "./mahjong.ts";
import { expect } from "jsr:@std/expect";
import { fixtures } from "../utils/utils.ts";
import { Pai, PaiSet } from "@k-jun/mahjong";

Deno.test("mahjong all", async () => {
  const userIds = ["0", "1", "2", "3"];

  let globalGame: Mahjong = new Mahjong(userIds, async (_) => {});
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
  const state = {
    isAfterRichi: false,
    isRon3: false,
    checkAterRichi: () => {},
  };
  await fixtures(async ({ name, params }): Promise<void> => {
    // console.log(
    //   name,
    //   globalGame.kyoku,
    //   globalGame.honba,
    //   globalGame.turnUserIdx,
    //   globalGame.turnRest(),
    // );
    switch (name) {
      case "INIT": {
        await _done(globalGame, state, resultChecker);
        state.isAfterRichi = false;
        state.isRon3 = false;
        const { hai0, hai1, hai2, hai3, yama, score, kyoku, honba, kyotk } =
          params.init!;
        resultChecker = [];
        globalGame.sleepSec = 0;
        globalGame.gameReset();
        await globalGame.gameStart(yama.map((e) => new Pai(e.id)));

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
        expect(globalGame.users.map((e) => e.point)).toEqual(score);
        expect(globalGame.kyoku).toEqual(kyoku);
        expect(globalGame.honba).toEqual(honba);
        expect(globalGame.kyotaku).toEqual(kyotk);
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
          await globalGame.input(MahjongInput.CHNKN, {
            user: globalGame.users[who],
            params: {
              chnkn: {
                paiChnkn: new Pai(paiLast.id),
                fromUser: globalGame.users[fromWho],
              },
            },
          });
        } else {
          await globalGame.input(MahjongInput.AGARI, {
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
          await _done(globalGame, state, resultChecker);
          globalGame = new Mahjong(userIds, async (_) => {});
        }
        break;
      }
      case "TSUMO": {
        for (let i = 0; i < globalGame.actions.length; i++) {
          if (globalGame.actions[i].type === MahjongActionType.RICHI) {
            continue;
          }
          if (globalGame.actions[i].type === MahjongActionType.TSUMO) {
            continue;
          }
          if (globalGame.actions[i].type === MahjongActionType.KAKAN) {
            continue;
          }
          if (globalGame.actions[i].type === MahjongActionType.ANKAN) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            user: globalGame.actions[i].user,
            params: {},
          });
        }

        if (state.isAfterRichi) {
          state.checkAterRichi();
          state.isAfterRichi = false;
        }

        const { who, hai } = params.tsumo!;
        expect(globalGame.turnUser().paiTsumo).toEqual(new Pai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        break;
      }
      case "RNSHN": {
        const { who, hai } = params.tsumo!;
        for (const e of globalGame.actions) {
          if (e.type !== MahjongActionType.RON) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            user: e.user,
            params: {},
          });
        }

        expect(globalGame.turnUser().paiTsumo).toEqual(new Pai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        expect(globalGame.turnUser().isRinshankaiho).toEqual(true);
        break;
      }
      case "DAHAI": {
        const { who, hai } = params.dahai!;
        expect(globalGame.turnUserIdx).toEqual(who);
        await globalGame.input(MahjongInput.DAHAI, {
          user: globalGame.turnUser(),
          params: { dahai: { paiDahai: new Pai(hai.id) } },
        });
        break;
      }
      case "RICHI": {
        const { who, step, ten } = params.richi!;
        if (step === 1) {
          await globalGame.input(MahjongInput.RICHI, {
            user: globalGame.users[who],
            params: {},
          });
        }
        if (step == 2) {
          state.isAfterRichi = true;
          state.checkAterRichi = () => {
            expect(globalGame.users.map((e) => e.point)).toEqual(ten);
          };
        }
        break;
      }
      case "NAKI": {
        const { who, set } = params.naki!;
        for (const a of globalGame.actions) {
          if (a.user.id === globalGame.users[who].id) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            user: a.user,
            params: {},
          });
        }
        await globalGame.input(MahjongInput.NAKI, {
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
        break;
      }
      case "RYUKYOKU": {
        const { score, owari, type } = params.ryukyoku!;

        if (type === "ron3") {
          for (const e of globalGame.actions) {
            if (e.type !== MahjongActionType.RON) {
              continue;
            }
            await globalGame.input(MahjongInput.AGARI, {
              user: e.user,
              params: {
                agari: {
                  paiAgari: globalGame.turnUser().paiKawa[0],
                  fromUser: globalGame.turnUser(),
                },
              },
            });
          }
        } else {
          for (const e of globalGame.users) {
            await globalGame.input(MahjongInput.SKIP, {
              user: e,
              params: {},
            });
          }
        }
        let isNagashi = false;
        if (type === "yao9") {
          isNagashi = true;
          await globalGame.input(MahjongInput.OWARI, {
            user: globalGame.turnUser(),
            params: {
              owari: { nagashi: isNagashi },
            },
          });
        }

        expect(globalGame.users.map((e) => e.point)).toEqual(score);
        if (owari !== undefined) {
          globalGame = new Mahjong(userIds, async (_) => {});
        }
        break;
      }
    }
  });
});

async function _done(
  globalGame: Mahjong,
  state: {
    isRon3: boolean;
  },
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

  if (!state.isRon3) {
    const actionUndefined = globalGame.actions.filter((e) =>
      e.enable === undefined && e.type === MahjongActionType.RON
    );
    for (const action of actionUndefined) {
      await globalGame.input(MahjongInput.SKIP, {
        user: action.user,
        params: {},
      });
    }
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
