import { Mahjong, MahjongActionType, MahjongInput } from "./new_mahjong.ts";
import { expect } from "jsr:@std/expect";
import { fixtures } from "../utils/utils.ts";
import { Pai, PaiSet, PaiSetType } from "@k-jun/mahjong";
import { stringify } from "node:querystring";

Deno.test("mahjong new", async () => {
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
    console.log(
      name,
      globalGame.kyoku,
      globalGame.honba,
      globalGame.turnUserIdx,
      globalGame.turnRest(),
    );
    switch (name) {
      case "INIT": {
        state.isAfterRichi = false;
        state.isRon3 = false;
        const { hai0, hai1, hai2, hai3, yama, score, kyoku, honba, kyotk } = params.init!;
        resultChecker = [];
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
      case "DAHAI": {
        const { who, hai } = params.dahai!;
        expect(globalGame.turnUserIdx).toEqual(who);
        await globalGame.input(MahjongInput.DAHAI, {
          usrId: globalGame.turnUser().id,
          state: globalGame.state,
          dahai: { paiId: hai.id },
        });
        expect(globalGame.users[who].paiTsumo).toEqual(undefined);
        break;
      }
      case "RICHI": {
        console.log(globalGame.actions.map((e) => ({
          type: e.type,
          user: e.user.id,
          enable: e.enable,
        })));
        const { who, step, ten } = params.richi!;
        expect(globalGame.turnUserIdx).toEqual(who);
        if (step === 1) {
          await globalGame.input(MahjongInput.RICHI, {
            usrId: globalGame.turnUser().id,
            state: globalGame.state,
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
      case "RYUKYOKU": {
        const { score, owari, type } = params.ryukyoku!;

        if (type === "ron3") {
          // TODO
        } else {
          for (let i = 0; i < globalGame.actions.length; i++) {
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
        for (const a of globalGame.actions) {
          if (a.user.id === globalGame.users[who].id) {
            continue;
          }
          await globalGame.input(MahjongInput.SKIP, {
            usrId: a.user.id,
            state: globalGame.state,
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
          state: globalGame.state,
          naki: {
            type: convertMap[set.type],
            usrId: globalGame.users[(who + set.fromWho) % 4].id,
            pmyId: set.paiRest.map((e) => e.id),
            purId: set.paiCall.map((e) => e.id),
          },
        });
        break;
      }
    }
  }, 3);
});
