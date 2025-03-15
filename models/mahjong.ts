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
  kyotaku: number = 0;

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

  turnNext({ user }: { user: MahjongUser }) {
    const currentIdx = this.users.findIndex((u) => u.id === user.id);
    this.turnUserIdx = (currentIdx + 1) % 4;
    return;
  }

  kyokuNext() {
    for (const user of this.users) {
      user.paiJikaze = new MahjongPai(user.paiJikaze.next().next().next().id);
    }
    const oyaIdx = this.users.findIndex((e) =>
      e.paiJikaze.id === this.kazes[0].id
    );
    this.turnUserIdx = oyaIdx;
  }

  turnUser() {
    return this.users[this.turnUserIdx];
  }

  reset(paiYama: MahjongPai[]) {
    this.paiYama = paiYama;
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];

    const sidx = this.users.findIndex((e) =>
      e.paiJikaze.id === new MahjongPai("z1").id
    );

    for (let j = sidx; j < sidx + 4; j++) {
      this.users[j % 4].paiHand = [];
      this.users[j % 4].isRichi = false;
    }

    for (let i = 0; i < 3; i++) {
      for (let j = sidx; j < sidx + 4; j++) {
        this.users[j % 4].setHandPais(this.paiYama.splice(-4).reverse());
      }
    }
    for (let j = sidx; j < sidx + 4; j++) {
      this.users[j % 4].setHandPais(this.paiYama.splice(-1));
    }
    this.paiWanpai.push(...this.paiYama.splice(0, 14));

    const [omote, ura] = this.paiWanpai.splice(5, 2);
    this.paiDora.push(omote);
    this.paiDoraUra.push(ura);
    this.output(this);
  }

  callFrom(myIdx: number, yourIdx: number): Player {
    return this.players[(yourIdx - myIdx + 4) % 4];
  }

  tsumo({ user }: { user: MahjongUser }) {
    user.setPaiTsumo(this.paiYama.splice(-1)[0]);
    this.output(this);
  }

  dahai({ user, pai }: { user: MahjongUser; pai: MahjongPai }) {
    if (user.id !== this.turnUser().id) {
      throw new Error("when dahai called, not your turn");
    }
    if (user.paiTsumo === undefined) {
      throw new Error("when dahai called, paiTsumo is undefined");
    }
    user.dahai({ pai });
    this.output(this);
    this.turnNext({ user });
    this.output(this);
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
      paiDora: this.paiDora,
      paiDoraUra: this.paiDoraUra,
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
      // TODO
    } else {
      user.score += this.result.pointSum;
      fromUser.score -= this.result.pointSum;
      this.kyokuNext();
    }
  }

  richi({ user }: { user: MahjongUser }) {
    if (user.isRichi) {
      throw new Error("when richi called, already richi");
    }
    user.isRichi = true;
    user.score -= 1000;
    this.kyotaku += 1000;
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

    const oyaIdx = this.users.findIndex((e) =>
      e.paiJikaze.id === this.kazes[0].id
    );
    const isCombo = isTenpai[oyaIdx];
    if (isCombo) {
      // TODO
    } else {
      this.kyokuNext();
    }
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
        // tsumo?: {};
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
        this.naki();
        break;
      }
    }
  }
}
