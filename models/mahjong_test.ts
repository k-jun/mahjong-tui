import { Mahjong, MahjongCommand } from "./mahjong.ts";
import { MahjongPai } from "./mahjong_pai.ts";
import { expect } from "jsr:@std/expect";
import { fixtures } from "../utils/utils.ts";
import { Pai } from "@k-jun/mahjong";

Deno.test("mahjong start", async () => {
  const userIds = ["0", "1", "2", "3"];
  const mockOutput = (_: Mahjong) => {};

  let globalYama: Pai[] = [];
  const globalGame: Mahjong = new Mahjong(userIds, mockOutput);
  await fixtures(({ name, params }) => {
    // console.log(name)
    switch (name) {
      case "INIT": {
        const { hai0, hai1, hai2, hai3, yama } = params.init!;

        globalGame.reset(yama.map((e) => new MahjongPai(e.id)));
        globalYama = [...yama];

        expect(globalGame.users.map((e) => e.paiHand.length)).toEqual(
          new Array(4).fill(13),
        );

        // console.log("hai0")
        // for (const p of hai0) {
        //   console.log(globalYama.findIndex((e) => e.id === p.id));
        // }
        // console.log("users[0]")
        // for (const p of globalGame.users[0].paiHand) {
        //   console.log(globalYama.findIndex((e) => e.id === p.id));
        // }

        expect(globalGame.users[0].paiHand).toEqual(
          hai0.map((e) => new MahjongPai(e.id)),
        );
        expect(globalGame.users[1].paiHand).toEqual(
          hai1.map((e) => new MahjongPai(e.id)),
        );
        expect(globalGame.users[2].paiHand).toEqual(
          hai2.map((e) => new MahjongPai(e.id)),
        );
        expect(globalGame.users[3].paiHand).toEqual(
          hai3.map((e) => new MahjongPai(e.id)),
        );
        break;
      }
      case "AGARI": {
        const { who, fromWho, paiLast, yakus, score } = params.agari!;

        globalGame.input(MahjongCommand.AGARI, {
          user: globalGame.users[who],
          params: {
            agari: {
              paiAgari: new MahjongPai(paiLast.id),
              fromUser: globalGame.users[fromWho],
            },
          },
        });

        const actYakus = globalGame.result?.yakus.filter((e) => e.val > 0).map((
          e,
        ) => ({
          ...e,
        }));
        expect(actYakus).toEqual(yakus);
        expect(globalGame.users.map((e) => e.score)).toEqual(score);
        break;
      }
      case "TSUMO": {
        const { who, hai } = params.tsumo!;
        globalGame.input(MahjongCommand.TSUMO, {
          user: globalGame.turnUser(),
          params: {},
        });

        expect(globalGame.turnUser().paiTsumo).toEqual(new MahjongPai(hai.id));
        expect(globalGame.turnUserIdx).toEqual(who);
        break;
      }
      case "DAHAI": {
        const { who, hai } = params.dahai!;
        expect(globalGame.turnUserIdx).toEqual(who);

        globalGame.input(MahjongCommand.DAHAI, {
          user: globalGame.turnUser(),
          params: { dahai: { paiDahai: new MahjongPai(hai.id) } },
        });
        break;
      }
      case "RICHI": {
        console.log("RICHI");
        const { who, step, ten } = params.richi!;
        if (step == 2) {
          globalGame.input(MahjongCommand.RICHI, {
            user: globalGame.users[who],
            params: {},
          });
          expect(globalGame.users.map((e) => e.score)).toEqual(ten);
        }
        break;
      }
      case "NAKI": {
        console.log("NAKI");
        break;
      }
      case "RYUKYOKU": {
        console.log("OWARI");
        const { score } = params.ryukyoku!;
        globalGame.input(MahjongCommand.OWARI, {
          user: globalGame.turnUser(),
          params: {},
        });

        expect(globalGame.users.map((e) => e.score)).toEqual(score);
        break;
      }
    }
  }, 3);
});
