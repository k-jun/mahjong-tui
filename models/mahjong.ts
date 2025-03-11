import { MahjongPai, MahjongPaiSet } from "./mahjong_pai.ts";
import { MahjongUser } from "./mahjong_user.ts";
import { AllPais } from "./constants.ts";
import { Player } from "@k-jun/mahjong";

export enum MahjongCommand {
  TSUMO = "tsumo",
  DAHAI = "dahai",
  RICHI = "richi",
  AGARI = "agari",
  CHI = "chi",
  PON = "pon",
  KAN = "kan",
  RON = "ron",
}

export type MahjongAction = {
  player: Player;
  command: MahjongCommand;
  enable: boolean;
};

export class Mahjong {
  yama: MahjongPai[];
  paiWanpai: MahjongPai[];
  paiBakaze: MahjongPai;
  paiDora: MahjongPai[];
  paiDoraUra: MahjongPai[];
  users: MahjongUser[];
  turnCount: number;
  turnUser: number;
  actions: MahjongAction[];

  kazes = [
    new MahjongPai("z1"), // 108 東
    new MahjongPai("z2"), // 112 南
    new MahjongPai("z3"), // 116 西
    new MahjongPai("z4"), // 120 北
  ];
  players = [
    Player.JICHA,
    Player.SHIMOCHA,
    Player.TOIMEN,
    Player.KAMICHA,
  ];

  output: (mjg: Mahjong) => void;

  constructor(userIds: string[], output: (mjg: Mahjong) => void) {
    this.yama = [];
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];
    this.paiBakaze = this.kazes[0];
    this.output = output;
    this.turnCount = 0;
    this.turnUser = 0;

    const users: MahjongUser[] = [];
    userIds.forEach((id, idx) => {
      const paiJikaze = this.kazes[idx];
      users.push(new MahjongUser({ id, paiJikaze, isOya: idx == 0 }));
    });
    this.users = users;
    this.actions = [];
  }

  shuffle<T>(pais: T[]) {
    for (let i = pais.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pais[i], pais[j]] = [pais[j], pais[i]];
    }
  }

  start() {
    const paiAll = [...AllPais];
    this.shuffle(paiAll);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[j].setHandPais(paiAll.splice(0, 4));
      }
    }
    for (let j = 0; j < 4; j++) {
      this.users[j].setHandPais(paiAll.splice(0, 1));
    }
    this.paiWanpai.push(...paiAll.splice(-14));
    this.paiWanpai[5].isOpen = true;
    this.yama.push(...paiAll);

    this.output(this);
    this.input(MahjongCommand.TSUMO, { userId: this.users[this.turnUser].id });
  }

  whichPlayer(myIdx: number, yourIdx: number): Player {
    return this.players[(yourIdx - myIdx + 4) % 4];
  }

  tsumo({ user }: { user: MahjongUser }) {
    user.setPaiTsumo(this.yama.splice(0, 1)[0]);
    this.output(this);
  }

  agari({ user }: { user: MahjongUser }) {
    // params.options.isTsumo = false;
    // params.options.isRichi = this.isRichi;

    // type params = {
    //   paiBakaze: MahjongPai;
    //   paiJikaze: MahjongPai;
    //   paiDora: MahjongPai[];
    //   paiDoraUra: MahjongPai[];
    //   options: {
    //     isTsumo: boolean;
    //     isOya: boolean;
    //     isHaitei?: boolean;
    //     isHoutei?: boolean;
    //     isChankan?: boolean;
    //     isRinshankaiho?: boolean;
    //     isChiho?: boolean;
    //     isTenho?: boolean;
    //   };
    // };
    //     isRichi?: boolean;
    //     isDabururichi?: boolean;
    //     isIppatsu?: boolean;
    const params = {
      paiBakaze: this.paiBakaze,
      paiJikaze: user.paiJikaze,
      paiDora: this.paiDora,
      paiDoraUra: this.paiDoraUra,
      options: {
        isTsumo: false,
        isRichi: user.isRichi,
        isOya: user.isOya,
      },
    };
    // user.canAgari(params);
  }

  // dahai({ userId, pai }: { userId: string; pai: MahjongPai }) {
  //   const userIdx = this.users.findIndex((e) => e.id == userId);
  //   const user = this.users[userIdx];
  // }

  input(
    action: MahjongCommand,
    { userId, pai, paiSet }: {
      userId: string;
      pai?: MahjongPai;
      paiSet?: MahjongPaiSet;
    },
  ) {
    const userIdx = this.users.findIndex((e) => e.id == userId);
    const user = this.users[userIdx];

    // const params = {
    //   paiBakaze: new MahjongPai("z1"),
    //   paiJikaze: new MahjongPai("z1"),
    //   paiDora: [],
    //   paiDoraUra: [],
    //   options: {
    //     isTsumo: false,
    //     isRichi: false,
    //     isOya: false,
    //   },
    // };

    switch (action) {
      case MahjongCommand.TSUMO:
        user?.setPaiTsumo(this.yama.splice(0, 1)[0]);
        // const actionAnkan = user?.canAnkan();
        // this.actions.push(actionAnkan);
        break;
      case MahjongCommand.DAHAI:
        for (let i = 1; i < 4; i++) {
          // const otherUser = this.users[userIdx + 1];
          // if (otherUser.canRon(params, pai!)) {
          //   this.actions.push({
          //     command: MahjongCommand.RON,
          //     player: this.players[i],
          //     enable: false,
          //   });
          // }
        }
        for (let i = 1; i < 4; i++) {
          const otherUser = this.users[userIdx + i % 4];
          if (
            otherUser.canMinkan(
              pai!,
              this.whichPlayer(userIdx, userIdx + i % 4),
            )
          ) {
            this.actions.push({
              command: MahjongCommand.RON,
              player: this.players[i],
              enable: false,
            });
          }
        }
        break;
      case MahjongCommand.RICHI:
      case MahjongCommand.AGARI:
      case MahjongCommand.CHI:
      case MahjongCommand.PON:
      case MahjongCommand.KAN:
      case MahjongCommand.RON:
    }

    this.output(this);
  }
}
