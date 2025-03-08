import { MahjongPai } from "./mahjong_pai.ts";
import { MahjongUser } from "./mahjong_user.ts";
import { AllPais } from "./constants.ts";

export enum MahjongAction {
  TSUMO = "tsumo",
  DAHAI = "dahai",
  RICHI = "richi",
  AGARI = "agari",
  CHI = "chi",
  PON = "pon",
  KAN = "kan",
  RON = "ron",
}

export class Mahjong {
  yama: MahjongPai[];
  wanPais: MahjongPai[];
  users: MahjongUser[];
  bakaze: MahjongPai;
  turnCount: number;
  turnUser: number;

  kazes = [
    new MahjongPai("z1"), // 108 東
    new MahjongPai("z2"), // 112 南
    new MahjongPai("z3"), // 116 西
    new MahjongPai("z4"), // 120 北
  ];

  output: (mjg: Mahjong) => void;

  constructor(userIds: string[], output: (mjg: Mahjong) => void) {
    this.yama = [];
    this.wanPais = [];
    this.bakaze = this.kazes[0];
    this.output = output;
    this.turnCount = 0;
    this.turnUser = 0;
    this.users = userIds.map((id) => new MahjongUser(id));
  }

  shuffle<T>(pais: T[]) {
    for (let i = pais.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pais[i], pais[j]] = [pais[j], pais[i]];
    }
  }

  start() {
    const pais = [...AllPais];
    this.shuffle(pais);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[j].setHandPais(pais.splice(0, 4));
      }
    }
    for (let j = 0; j < 4; j++) {
      this.users[j].setHandPais(pais.splice(0, 1));
    }
    this.wanPais.push(...pais.splice(-14));
    this.wanPais[5].isOpen = true;
    this.yama.push(...pais);

    this.output(this);
    this.input(MahjongAction.TSUMO, this.users[this.turnUser].id);
  }

  input(action: MahjongAction, userId: string) {
    const user = this.users.find((e) => e.id == userId);

    switch (action) {
      case MahjongAction.TSUMO:
        user?.setPaiTsumo(this.yama.splice(0, 1)[0]);
        break;
      case MahjongAction.DAHAI:
        
      case MahjongAction.RICHI:
      case MahjongAction.AGARI:
      case MahjongAction.CHI:
      case MahjongAction.PON:
      case MahjongAction.KAN:
      case MahjongAction.RON:
    }

    this.output(this);
  }
}
