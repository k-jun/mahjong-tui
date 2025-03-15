import { MahjongPai, MahjongPaiSet } from "./mahjong_pai.ts";
import { MahjongUser } from "./mahjong_user.ts";
import {
  Player,
  Shanten,
  ShantenInput,
  Tokuten,
  TokutenInput,
  TokutenOutput,
} from "@k-jun/mahjong";

export enum MahjongCommand {
  TSUMO = "tsumo",
  DAHAI = "dahai",
  RICHI = "richi",
  AGARI = "agari",
  OWARI = "owari",
  NAKI = "naki",
}

export type MahjongAction = {
  player: Player;
  command: MahjongCommand;
  enable: boolean;
};

export class Mahjong {
  paiYama: MahjongPai[] = [];
  paiWanpai: MahjongPai[] = [];
  paiBakaze: MahjongPai = new MahjongPai("z1");
  paiDora: MahjongPai[] = [];
  paiDoraUra: MahjongPai[] = [];
  users: MahjongUser[] = [];
  turnUserIdx: number = 0;
  actions: MahjongAction[] = [];
  result?: TokutenOutput;

  kyotk: number = 0;
  honba: number = 0;
  kyoku: number = 0;

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

  constructor(
    userIds: string[],
    output: (mjg: Mahjong) => void,
  ) {
    const users: MahjongUser[] = [];
    userIds.forEach((id, idx) => {
      const paiJikaze = this.kazes[idx];
      users.push(new MahjongUser({ id, paiJikaze }));
    });
    this.users = users;
    this.output = output;
  }

  paiRemain() {
    return this.paiYama.length + (this.paiWanpai.length / 3) - 4;
  }

  nextTurn() {
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
    return;
  }

  nextGame({ isAgari, isOya }: { isAgari: boolean; isOya: boolean }) {
    if (isAgari && isOya) {
      this.honba += 1;
    }
    if (isAgari && !isOya) {
      this.kyoku += 1;
      this.honba = 0;
    }
    if (!isAgari && isOya) {
      this.honba += 1;
    }
    if (!isAgari && !isOya) {
      this.kyoku += 1;
      this.honba += 1;
    }
  }

  turnUser() {
    return this.users[this.turnUserIdx];
  }

  reset(paiYama: MahjongPai[]) {
    this.paiYama = paiYama;
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];
    this.turnUserIdx = this.kyoku % 4;
    this.users.forEach((e) => e.reset());

    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].paiJikaze = this.kazes[i];
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[(j + this.kyoku) % 4].setHandPais(
          this.paiYama.splice(-4).reverse(),
        );
      }
    }
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].setHandPais(this.paiYama.splice(-1));
    }
    this.paiWanpai.push(...this.paiYama.splice(0, 14));

    const [ura, omote] = this.paiWanpai.splice(4, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
    this.output(this);
  }

  tsumo({ user }: { user: MahjongUser }) {
    user.setPaiTsumo(this.paiYama.splice(-1)[0]);
    this.output(this);
  }

  dahai({ user, pai }: { user: MahjongUser; pai: MahjongPai }) {
    if (user.id !== this.turnUser().id) {
      throw new Error("when dahai called, not your turn");
    }

    user.dahai({ pai });
    user.isIppatsu = false;
    this.nextTurn();
  }

  agari(
    { user, fromUser, pai }: {
      user: MahjongUser;
      fromUser: MahjongUser;
      pai: MahjongPai;
    },
  ) {
    const allMenzen = this.users.every((u) => u.paiCall.length === 0);
    const isTsumo = user.id === fromUser.id;
    const params: TokutenInput = {
      paiRest: user.paiHand,
      paiLast: pai,
      paiSets: user.paiCall,
      paiBakaze: this.paiBakaze,
      paiJikaze: user.paiJikaze,
      paiDora: this.paiDora.map((e) => new MahjongPai(e.next().id)),
      paiDoraUra: user.isRichi
        ? this.paiDoraUra.map((e) => new MahjongPai(e.next().id))
        : [],
      options: {
        isTsumo: isTsumo,
        isOya: user.paiJikaze.id === this.kazes[0].id,
        isRichi: user.isRichi,
        isDabururichi: user.isDabururichi,
        isIppatsu: user.isIppatsu,
        isHaitei: this.paiRemain() === 0,
        isHoutei: false,
        isChankan: false,
        isRinshankaiho: false,
        isChiho: [68, 67, 66].includes(this.paiRemain()) && allMenzen,
        isTenho: this.paiRemain() === 69,
      },
    };
    this.result = new Tokuten({ ...params }).count();

    if (isTsumo) {
      user.score += this.result.pointSum + this.kyotk + (this.honba * 300);
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].id === user.id) {
          continue;
        }
        if ((this.kyoku % 4) === i) {
          this.users[i].score -= this.result.pointPrt + (this.honba * 100);
        } else {
          this.users[i].score -= this.result.pointCdn + (this.honba * 100);
        }
      }
    } else {
      user.score += this.result.pointSum + this.kyotk + (this.honba * 300);
      fromUser.score -= this.result.pointSum + (this.honba * 300);
    }
    this.kyotk = 0;
    const isOya = user.id === this.users[this.kyoku % 4].id;
    this.nextGame({ isAgari: true, isOya });
  }

  richi({ user }: { user: MahjongUser }) {
    if (user.isRichi) {
      throw new Error("when richi called, already richi");
    }
    user.isRichi = true;
    user.isIppatsu = true;
    user.score -= 1000;
    this.kyotk += 1000;
  }

  owari() {
    const isTenpai = [];
    for (const user of this.users) {
      const params: ShantenInput = {
        paiRest: user.paiHand,
        paiSets: user.paiCall,
      };
      isTenpai.push(new Shanten(params).count() === 0);
    }

    const cnt = isTenpai.filter((e) => e).length;
    const pntInc = cnt === 4 ? 0 : 3000 / cnt;
    const pntDcs = (pntInc * cnt) / (4 - cnt);
    for (const [idx, user] of this.users.entries()) {
      if (isTenpai[idx]) {
        user.score += pntInc;
      } else {
        user.score -= pntDcs;
      }
    }
    console.log(this.users.map((e) => e.score));
    const isOya = isTenpai[this.kyoku % 4];
    this.nextGame({ isAgari: false, isOya });
  }

  naki({ user, set }: { user: MahjongUser; set: MahjongPaiSet }) {
    user.paiCall.push(set);
    this.turnUserIdx = this.users.findIndex((e) => e.id === user.id);
    this.users.forEach((e) => e.isIppatsu = false);
  }

  input(
    action: MahjongCommand,
    { user, params }: {
      user: MahjongUser;
      params: {
        agari?: {
          fromUser: MahjongUser;
          paiAgari: MahjongPai;
        };
        dahai?: {
          paiDahai: MahjongPai;
        };
        naki?: {
          set: MahjongPaiSet;
        };
      };
    },
  ) {
    switch (action) {
      case MahjongCommand.TSUMO:
        this.tsumo({ user });
        break;
      case MahjongCommand.DAHAI: {
        const { paiDahai } = params.dahai!;
        this.dahai({ user, pai: paiDahai });
        break;
      }
      case MahjongCommand.AGARI: {
        const { paiAgari, fromUser } = params.agari!;
        this.agari({ user, fromUser, pai: paiAgari });
        break;
      }
      case MahjongCommand.RICHI: {
        this.richi({ user });
        break;
      }
      case MahjongCommand.OWARI: {
        this.owari();
        break;
      }
      case MahjongCommand.NAKI: {
        const { set } = params.naki!;
        this.naki({ user, set });
        break;
      }
    }
  }
}
