import { Mahjong, MahjongActionType, MahjongInput } from "./mahjong.ts";
import { expect } from "jsr:@std/expect";
import { fixtures } from "../utils/utils.ts";
import { Pai, PaiSetType } from "@k-jun/mahjong";

Deno.test("mahjong new", async () => {
  const userIds = ["0", "1", "2", "3"];

  let globalGame: Mahjong = new Mahjong(userIds, async (_) => {});
  const state = {
    isRon3: false,
    isAfterRichi: [false, false, false, false],
    checkAfterAgari: [(_: number) => {}],
    checkAfterRichi: [(_: number) => {}],
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
        for (let idx = 0; idx < state.checkAfterAgari.length; idx++) {
          await state.checkAfterAgari[idx](idx);
        }

        state.checkAfterRichi = [];
        state.checkAfterAgari = [];
        state.isAfterRichi = [false, false, false, false];
        state.isRon3 = false;
        const { hai0, hai1, hai2, hai3, yama, score, kyoku, honba, kyotk } = params.init!;
        // console.log(Deno.inspect(yama.map((e) => e.id), { iterableLimit: Infinity }));
        globalGame.enableDebug = true;
        globalGame.sleep = 0;
        globalGame.gameReset();
        globalGame.gameStart(yama.map((e) => new Pai(e.id)));

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
          if (globalGame.actions[i].type === MahjongActionType.DAHAI) {
            continue;
          }
          if (globalGame.actions[i].type === MahjongActionType.OWARI) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            usrId: globalGame.actions[i].user.id,
            state: globalGame.state,
          });
        }
        const { who, hai } = params.tsumo!;
        expect(globalGame.turnUser().paiTsumo).toEqual(new Pai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        break;
      }
      case "RNSHN": {
        for (let i = 0; i < globalGame.actions.length; i++) {
          if (globalGame.actions[i].type !== MahjongActionType.RON) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            usrId: globalGame.actions[i].user.id,
            state: globalGame.state,
          });
        }
        break;
      }
      case "DAHAI": {
        state.checkAfterRichi.forEach((check, idx) => check(idx - 1));
        state.checkAfterRichi = [];

        const { who, hai } = params.dahai!;
        expect(globalGame.turnUserIdx).toEqual(who);

        if (state.isAfterRichi[who] && (!globalGame.users[who].isRichi && !globalGame.users[who].isDabururichi)) {
          await globalGame.input(MahjongInput.RICHI, {
            usrId: globalGame.turnUser().id,
            state: globalGame.state,
            richi: { paiId: hai.id },
          });
        } else {
          await globalGame.input(MahjongInput.DAHAI, {
            usrId: globalGame.turnUser().id,
            state: globalGame.state,
            dahai: { paiId: hai.id },
          });
        }

        expect(globalGame.users[who].paiTsumo).toEqual(undefined);
        break;
      }
      case "RICHI": {
        const { who, step, ten } = params.richi!;
        if (step === 1) {
          expect(globalGame.turnUserIdx).toEqual(who);
          state.isAfterRichi[who] = true;
        }
        if (step == 2) {
          state.checkAfterRichi.push((_: number) => {
            expect(globalGame.users.map((e) => e.point)).toEqual(ten);
          });
        }
        break;
      }
      case "RYUKYOKU": {
        const { score, owari, type } = params.ryukyoku!;

        if (type === "ron3") {
          for (let i = 0; i < globalGame.actions.length; i++) {
            if (globalGame.actions[i].type !== MahjongActionType.RON) {
              continue;
            }
            const paiKawa = globalGame.turnUser().paiKawa;
            await globalGame.input(MahjongInput.AGARI, {
              usrId: globalGame.actions[i].user.id,
              state: globalGame.state,
              agari: {
                paiId: paiKawa[paiKawa.length - 1].id,
              },
            });
          }
        } else {
          for (let i = 0; i < globalGame.actions.length; i++) {
            if (globalGame.actions[i].type === MahjongActionType.OWARI) {
              continue;
            }
            if (globalGame.actions[i].type === MahjongActionType.DAHAI) {
              continue;
            }
            await globalGame.input(MahjongInput.SKIP, {
              usrId: globalGame.actions[i].user.id,
              state: globalGame.state,
            });
          }
        }
        if (type === "yao9") {
          await globalGame.input(MahjongInput.OWARI, {
            usrId: globalGame.turnUser().id,
            state: globalGame.state,
            owari: { type: "yao9" },
          });
        }

        expect(globalGame.users.map((e) => e.point)).toEqual(score);
        if (owari !== undefined) {
          globalGame = new Mahjong(userIds, async (_) => {});
        }
        break;
      }
      case "NAKI": {
        const { who, set } = params.naki!;
        const state = globalGame.state;
        for (const a of globalGame.actions) {
          if (a.user.id === globalGame.users[who].id) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            usrId: a.user.id,
            state,
          });
        }

        const convertMap: Record<number, "pon" | "chi" | "minkan" | "kakan" | "ankan"> = {
          [PaiSetType.MINSHUN]: "chi",
          [PaiSetType.MINKO]: "pon",
          [PaiSetType.MINKAN]: "minkan",
          [PaiSetType.ANKAN]: "ankan",
          [PaiSetType.KAKAN]: "kakan",
        };
        await globalGame.input(MahjongInput.NAKI, {
          usrId: globalGame.users[who].id,
          state: state,
          naki: {
            type: convertMap[set.type],
            usrId: globalGame.users[(who + set.fromWho) % 4].id,
            pmyId: set.paiRest.map((e) => e.id),
            purId: set.paiCall.map((e) => e.id),
          },
        });
        break;
      }
      case "AGARI": {
        const {
          who,
          score,
          owari,
          yakus,
          paiDora,
          paiDoraUra,
          paiLast,
        } = params.agari!;
        const isChnkn = yakus.map((e) => e.str).includes("槍槓");

        await globalGame.input(MahjongInput.AGARI, {
          usrId: globalGame.users[who].id,
          state: globalGame.state,
          agari: { isChnkn, paiId: paiLast.id },
        });
        state.checkAfterAgari.push(async (idx: number) => {
          for (const action of globalGame.actions) {
            if (action.enable !== undefined || action.type !== MahjongActionType.RON) {
              continue;
            }
            await globalGame.input(MahjongInput.SKIP, {
              usrId: action.user.id,
              state: globalGame.state,
            });
          }

          expect(globalGame.paiDora).toEqual(paiDora.map((e) => new Pai(e.id)));
          if (paiDoraUra.length > 0) {
            expect(globalGame.paiDoraUra).toEqual(paiDoraUra.map((e) => new Pai(e.id)));
          }

          const tokuten = globalGame.tokutens[idx];
          const actYakus = tokuten.output.yakus.filter((e) => e.val > 0);
          const actYakuVal = actYakus.map((e) => ({ ...e })).sort((a, b) => a.str.localeCompare(b.str));
          const expYakuVal = yakus.filter((e) => e.val > 0).sort((a, b) => a.str.localeCompare(b.str));
          expect(actYakuVal).toEqual(expYakuVal);
          if (idx === state.checkAfterAgari.length - 1) {
            expect(globalGame.users.map((e) => e.point)).toEqual(score);
          }
        });
        if (owari) {
          for (let idx = 0; idx < state.checkAfterAgari.length; idx++) {
            await state.checkAfterAgari[idx](idx);
          }
          state.checkAfterAgari = [];
          state.checkAfterRichi = [];
          globalGame = new Mahjong(userIds, async (_) => {});
        }
      }
    }
  });
});
