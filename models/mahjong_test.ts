import { Mahjong, MahjongCommand } from "./mahjong.ts";
import { expect } from "jsr:@std/expect";
import { fixtures } from "../utils/utils.ts";
import { Pai, PaiSet } from "@k-jun/mahjong";

Deno.test("mahjong start", async () => {
  const userIds = ["0", "1", "2", "3"];
  const mockOutput = (_: Mahjong) => {};

  let globalGame: Mahjong = new Mahjong(userIds, mockOutput);
  await fixtures(({ name, params }) => {
    switch (name) {
      case "INIT": {
        const { hai0, hai1, hai2, hai3, yama } = params.init!;

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
          globalGame.input(MahjongCommand.CHNKN, {
            user: globalGame.users[who],
            params: {
              chnkn: {
                paiChnkn: new Pai(paiLast.id),
                fromUser: globalGame.users[fromWho],
              },
            },
          });
        } else {
          globalGame.input(MahjongCommand.AGARI, {
            user: globalGame.users[who],
            params: {
              agari: {
                paiAgari: new Pai(paiLast.id),
                fromUser: globalGame.users[fromWho],
              },
            },
          });
        }

        const actYakus = globalGame.result?.yakus.filter((e) => e.val > 0).map((
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

        expect(globalGame.users.map((e) => e.point)).toEqual(score);
        if (owari !== undefined) {
          globalGame = new Mahjong(userIds, mockOutput);
        }
        break;
      }
      case "TSUMO": {
        const { who, hai } = params.tsumo!;
        globalGame.input(MahjongCommand.TSUMO, {
          user: globalGame.turnUser(),
          params: {},
        });

        expect(globalGame.turnUser().paiTsumo).toEqual(new Pai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        break;
      }
      case "RNSHN": {
        const { who, hai } = params.tsumo!;
        globalGame.input(MahjongCommand.RNSHN, {
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

        globalGame.input(MahjongCommand.DAHAI, {
          user: globalGame.turnUser(),
          params: { dahai: { paiDahai: new Pai(hai.id) } },
        });
        break;
      }
      case "RICHI": {
        const { who, step, ten } = params.richi!;
        if (step == 2) {
          globalGame.input(MahjongCommand.RICHI, {
            user: globalGame.users[who],
            params: {},
          });
          expect(globalGame.users.map((e) => e.point)).toEqual(ten);
        }
        break;
      }
      case "NAKI": {
        const { who, set } = params.naki!;
        globalGame.input(MahjongCommand.NAKI, {
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
        let isNagashi = false;
        if (
          type === "kaze4" || type === "yao9" || type === "reach4" ||
          type === "ron3" || type === "kan4"
        ) {
          isNagashi = true;
        }
        globalGame.input(MahjongCommand.OWARI, {
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
        globalGame.input(MahjongCommand.DORA, {
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
