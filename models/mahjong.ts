// import { Pai, PaiSet } from "./mahjong_pai.ts";
import { MahjongUser } from "./mahjong_user.ts";
import {
  Pai,
  PaiKaze,
  PaiSet,
  PaiSetType,
  Player,
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
  paiYama: Pai[] = [];
  paiRinshan: Pai[] = [];
  paiWanpai: Pai[] = [];
  paiBakaze: Pai = new Pai("z1");
  paiDora: Pai[] = [];
  paiDoraUra: Pai[] = [];
  users: MahjongUser[] = [];
  turnUserIdx: number = 0;
  actions: MahjongAction[] = [];
  result?: TokutenOutput;

  kyotk: number = 0;
  honba: number = 0;
  kyoku: number = 0;
  isAgari: boolean = false;
  isOya: boolean = false;
  isNext: boolean = false;
  honbaRemove: boolean = true;

  output: (mjg: Mahjong) => void;

  constructor(
    userIds: string[],
    output: (mjg: Mahjong) => void,
  ) {
    const users: MahjongUser[] = [];
    userIds.forEach((id, idx) => {
      const paiJikaze = PaiKaze[idx];
      users.push(new MahjongUser({ id, paiJikaze }));
    });
    this.users = users;
    this.output = output;
  }

  paiRemain() {
    return this.paiYama.length + Math.floor(this.paiWanpai.length / 2) - 4;
  }

  nextTurn() {
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
    return;
  }

  updateKyokuHonba() {
    if (this.isAgari && this.isOya) {
      this.honba += 1;
    }
    if (this.isAgari && !this.isOya) {
      this.kyoku += 1;
      this.honba = 0;
    }
    if (!this.isAgari && this.isOya) {
      this.honba += 1;
    }
    if (!this.isAgari && !this.isOya) {
      this.kyoku += 1;
      this.honba += 1;
    }
  }

  nextGame({ isAgari, isOya }: { isAgari: boolean; isOya: boolean }) {
    this.isNext = true;
    this.isAgari = isAgari;
    this.isOya = isOya || this.isOya;
    this.honbaRemove = true;
  }

  turnUser() {
    return this.users[this.turnUserIdx];
  }

  reset(paiYama: Pai[]) {
    if (this.isNext) {
      this.updateKyokuHonba();
      this.isNext = false;
      this.isAgari = false;
      this.isOya = false;
    }
    this.paiYama = paiYama;
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];
    this.paiRinshan = [];
    this.honbaRemove = false;
    this.turnUserIdx = this.kyoku % 4;
    this.users.forEach((e) => e.reset());

    this.paiBakaze = PaiKaze[Math.floor(this.kyoku / 4)];

    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].paiJikaze = PaiKaze[i];
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

    const rinshan = this.paiWanpai.splice(0, 4);
    this.paiRinshan.push(rinshan[1], rinshan[0], rinshan[3], rinshan[2]);
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
    this.output(this);
  }

  ankan(): Pai {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
    return this.paiRinshan.splice(0, 1)[0];
  }

  kandora() {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
  }

  rinshanTsumo(): Pai {
    return this.paiRinshan.splice(0, 1)[0];
  }

  tsumo({ user }: { user: MahjongUser }) {
    if (user.afterAnKan) {
      user.setPaiTsumo(this.ankan());
      user.afterAnKan = false;
      user.isRinshankaiho = true;
    } else if (user.afterMinKanKakan) {
      user.setPaiTsumo(this.rinshanTsumo());
      user.isRinshankaiho = true;
    } else {
      user.setPaiTsumo(this.paiYama.splice(-1)[0]);
    }

    this.output(this);
  }

  dahai({ user, pai }: { user: MahjongUser; pai: Pai }) {
    if (user.afterMinKanKakan) {
      this.kandora();
      user.afterMinKanKakan = false;
    }
    if (user.aboutToKakan) {
      this.users.forEach((e) => e.isIppatsu = false);
      user.aboutToKakan = false;
    }
    if (user.id !== this.turnUser().id) {
      throw new Error("when dahai called, not your turn");
    }

    user.dahai({ pai });
    user.isIppatsu = false;
    user.isRinshankaiho = false;
    this.nextTurn();
  }

  isPao({ user }: { user: MahjongUser }): Player {
    const yakus = this.result!.yakus.map((e) => e.str);
    if (yakus.includes("大三元")) {
      const pais = user.paiCall.map((e) => e.pais[0].fmt);
      if (pais.includes("z5") && pais.includes("z6") && pais.includes("z7")) {
        const set = user.paiCall.findLast((e) => e.pais[0].isSangenHai());
        return set!.fromWho;
      }
    }

    if (yakus.includes("大四喜")) {
      const pais = user.paiCall.map((e) => e.pais[0].fmt);
      if (
        pais.includes("z1") && pais.includes("z2") && pais.includes("z3") &&
        pais.includes("z4")
      ) {
        const set = user.paiCall.findLast((e) =>
          e.pais[0].isJihai() && !e.pais[0].isSangenHai()
        );
        return set!.fromWho;
      }
    }
    return Player.JICHA;
  }

  agari(
    { user, fromUser, pai, isChankan }: {
      user: MahjongUser;
      fromUser: MahjongUser;
      pai: Pai;
      isChankan: boolean;
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
      paiDora: this.paiDora.map((e) => e.next()),
      paiDoraUra: (user.isRichi || user.isDabururichi)
        ? this.paiDoraUra.map((e) => e.next())
        : [],
      options: {
        isTsumo: isTsumo,
        isOya: user.paiJikaze.id === PaiKaze[0].id,
        isRichi: user.isRichi,
        isDabururichi: user.isDabururichi,
        isIppatsu: user.isIppatsu,
        isHaitei: isTsumo && this.paiRemain() === 0 && !user.isRinshankaiho,
        isHoutei: !isTsumo && this.paiRemain() === 0,
        isChankan: isChankan,
        isRinshankaiho: user.isRinshankaiho,
        isChiho: isTsumo && this.paiRemain() !== 69 &&
          user.paiKawa.length === 0 && allMenzen,
        isTenho: isTsumo && this.paiRemain() === 69,
      },
    };
    this.result = new Tokuten({ ...params }).count();

    const honba = this.honbaRemove ? 0 : this.honba;
    const playerPao = this.isPao({ user });

    user.score += this.result.pointSum + this.kyotk + (honba * 300);
    if (isTsumo) {
      if (playerPao !== Player.JICHA) {
        const userIdx = this.users.findIndex((e) => e.id === user.id);
        this.users[(userIdx + playerPao) % 4].score -= this.result.pointSum +
          (honba * 300);
      } else {
        for (let i = 0; i < this.users.length; i++) {
          if (this.users[i].id === user.id) {
            continue;
          }
          if ((this.kyoku % 4) === i) {
            this.users[i].score -= this.result.pointPrt + (honba * 100);
          } else {
            this.users[i].score -= this.result.pointCdn + (honba * 100);
          }
        }
      }
    } else {
      if (playerPao !== Player.JICHA) {
        const userIdx = this.users.findIndex((e) => e.id === user.id);
        this.users[(userIdx + playerPao) % 4].score -=
          (this.result.pointSum / 2) + (honba * 300);
        fromUser.score -= this.result.pointSum / 2;
      } else {
        fromUser.score -= this.result.pointSum + (honba * 300);
      }
    }

    this.kyotk = 0;
    const isOya = user.id === this.users[this.kyoku % 4].id;
    this.nextGame({ isAgari: true, isOya });
  }

  richi({ user }: { user: MahjongUser }) {
    const allMenzen = this.users.every((u) => u.paiCall.length === 0);
    const isDabururichi = [69, 68, 67, 66].includes(this.paiRemain()) &&
      allMenzen;
    if (user.isRichi) {
      throw new Error("when richi called, already richi");
    }
    if (isDabururichi) {
      user.isDabururichi = true;
    } else {
      user.isRichi = true;
    }

    user.isIppatsu = true;
    user.score -= 1000;
    this.kyotk += 1000;
  }

  owari({ nagashi }: { nagashi: boolean }) {
    if (nagashi) {
      this.nextGame({ isAgari: false, isOya: true });
      return;
    }

    const isTenpai = this.users.map((e) => e.isTenpai());

    const isNagashimangan = this.users.map((e) => e.isNagashimangan());
    if (this.paiRemain() === 0 && isNagashimangan.some((e) => e)) {
      for (let i = 0; i < 4; i++) {
        if (isNagashimangan[i] === false) {
          continue;
        }
        // isOya
        if (i === (this.kyoku % 4)) {
          this.users[i].score += 12000;
          for (let j = 1; j < 4; j++) {
            this.users[(i + j) % 4].score -= 4000;
          }
        } else {
          this.users[i].score += 8000;
          for (let j = 1; j < 4; j++) {
            if (((i + j) % 4) === (this.kyoku % 4)) {
              this.users[(i + j) % 4].score -= 4000;
            } else {
              this.users[(i + j) % 4].score -= 2000;
            }
          }
        }
      }
    } else {
      const cnt = isTenpai.filter((e) => e).length;

      const pntInc = cnt === 4 || cnt === 0 ? 0 : 3000 / cnt;
      const pntDcs = (pntInc * cnt) / (4 - cnt);
      for (const [idx, user] of this.users.entries()) {
        if (isTenpai[idx]) {
          user.score += pntInc;
        } else {
          user.score -= pntDcs;
        }
      }
    }

    const isOya = isTenpai[this.kyoku % 4];
    this.nextGame({ isAgari: false, isOya });
  }

  naki({ user, set }: { user: MahjongUser; set: PaiSet }) {
    if (set.type === PaiSetType.ANKAN) {
      if (user.afterMinKanKakan) {
        this.kandora();
        user.afterMinKanKakan = false;
      }
      user.paiHand.push(user.paiTsumo!);
      user.paiTsumo = undefined;
      user.afterAnKan = true;
    }
    if (set.type === PaiSetType.MINKAN) {
      user.afterMinKanKakan = true;
    }
    if (set.type === PaiSetType.KAKAN) {
      if (user.afterMinKanKakan) {
        this.kandora();
        user.afterMinKanKakan = false;
      }
      user.paiHand.push(user.paiTsumo!);
      user.paiTsumo = undefined;
      user.afterMinKanKakan = true;
      user.paiCall = user.paiCall.filter((e) => {
        const isMinko = e.type === PaiSetType.MINKO;
        const isSame = e.pais[0].fmt === set.pais[0].fmt;
        if (isMinko && isSame) {
          return false;
        }
        return true;
      });
    }

    const userIdx = this.users.findIndex((e) => e.id === user.id);
    if (set.fromWho !== Player.JICHA) {
      this.users[(userIdx + set.fromWho) % 4].isNagashimanganCalled = true;
    }

    user.paiHand = user.paiHand.filter((e) =>
      !set.pais.map((e) => e.id).includes(e.id)
    );
    user.paiCall.push(set);
    this.turnUserIdx = userIdx;

    if (set.type === PaiSetType.KAKAN && user.aboutToKakan === false) {
      user.aboutToKakan = true;
    } else {
      this.users.forEach((e) => e.isIppatsu = false);
    }
  }

  input(
    action: MahjongCommand,
    { user, params }: {
      user: MahjongUser;
      params: {
        agari?: {
          fromUser: MahjongUser;
          paiAgari: Pai;
          isChankan: boolean;
        };
        dahai?: {
          paiDahai: Pai;
        };
        naki?: {
          set: PaiSet;
        };
        owari?: {
          nagashi: boolean;
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
        const { paiAgari, fromUser, isChankan } = params.agari!;
        this.agari({ user, fromUser, pai: paiAgari, isChankan });
        break;
      }
      case MahjongCommand.RICHI: {
        this.richi({ user });
        break;
      }
      case MahjongCommand.OWARI: {
        const { nagashi } = params.owari!;
        this.owari({ nagashi });
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
