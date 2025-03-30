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
  AGARI = "agari",
  RICHI = "richi",
  OWARI = "owari",
  CHNKN = "chankan",
  RNSHN = "rinshan",
  NAKI = "naki",
  DORA = "dora",
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

  kyotaku: number = 0;
  honba: number = 0;
  kyoku: number = 0;

  isAgari: boolean = false;
  isRenchan: boolean = false;
  isEnded: boolean = false;
  isHonbaTaken: boolean = true;

  output: (mjg: Mahjong) => void;

  constructor(userIds: string[], output: (mjg: Mahjong) => void) {
    this.users = userIds.map((val, idx) =>
      new MahjongUser({ id: val, point: 25000, paiJikaze: PaiKaze[idx] })
    );
    this.output = output;
  }

  get paiRemain(): number {
    return this.paiYama.length + Math.floor(this.paiWanpai.length / 2) - 4;
  }

  turnUser(): MahjongUser {
    return this.users[this.turnUserIdx];
  }

  turnNext(): void {
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
  }

  turnRest(): number {
    return this.paiYama.length + Math.floor(this.paiWanpai.length / 2) - 4;
  }

  gameStart(pais: Pai[]): void {
    this.paiYama = pais;
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].paiJikaze = PaiKaze[i];
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[(j + this.kyoku) % 4].setPaiPais({
          pais: this.paiYama.splice(-4).reverse(),
        });
      }
    }
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].setPaiPais({
        pais: this.paiYama.splice(-1),
      });
    }
    this.paiWanpai.push(...this.paiYama.splice(0, 14));

    const rinshan = this.paiWanpai.splice(0, 4);
    this.paiRinshan.push(rinshan[1], rinshan[0], rinshan[3], rinshan[2]);
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
    this.turnUserIdx = this.kyoku % 4;
    this.paiBakaze = PaiKaze[Math.floor(this.kyoku / 4)];
    this.output(this);
  }

  gameEnded(
    { isRenchan, isAgari }: { isRenchan: boolean; isAgari: boolean },
  ): void {
    this.isEnded = true;
    this.isAgari = isAgari;
    this.isRenchan = isRenchan || this.isRenchan;
    this.isHonbaTaken = true;
  }

  gameReset(): void {
    if (this.isEnded) {
      this.updateBakyo();
      this.isEnded = false;
      this.isAgari = false;
      this.isRenchan = false;
    }
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];
    this.paiRinshan = [];
    this.isHonbaTaken = false;
    this.users.forEach((e) => e.reset());
  }

  updateBakyo(): void {
    if (this.isAgari && this.isRenchan) {
      this.honba += 1;
    }
    if (this.isAgari && !this.isRenchan) {
      this.kyoku += 1;
      this.honba = 0;
    }
    if (!this.isAgari && this.isRenchan) {
      this.honba += 1;
    }
    if (!this.isAgari && !this.isRenchan) {
      this.kyoku += 1;
      this.honba += 1;
    }
  }

  dora(): void {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
  }

  ankan(): Pai {
    // this.kandora();
    return this.paiRinshan.splice(0, 1)[0];
  }

  rinshanTsumo({ user }: { user: MahjongUser }): void {
    user.setPaiTsumo({ pai: this.paiRinshan.splice(0, 1)[0] });
    user.isRinshankaiho = true;
  }

  tsumo({ user }: { user: MahjongUser }): void {
    // if (user.afterAnKan) {
    //   user.setPaiTsumo({ pai: this.ankan() });
    //   user.afterAnKan = false;
    //   user.isRinshankaiho = true;
    //   return;
    // }
    // if (user.afterMinKanKakan) {
    //   user.setPaiTsumo({ pai: this.rinshanTsumo() });
    //   user.isRinshankaiho = true;
    //   return;
    // }
    user.setPaiTsumo({ pai: this.paiYama.splice(-1)[0] });
  }

  dahai({ user, pai }: { user: MahjongUser; pai: Pai }): void {
    // if (user.afterMinKanKakan) {
    //   this.kandora();
    //   user.afterMinKanKakan = false;
    // }
    // if (user.aboutToKakan) {
    //   this.users.forEach((e) => e.isIppatsu = false);
    //   user.aboutToKakan = false;
    // }
    if (user.id !== this.turnUser().id) {
      throw new Error("when dahai called, not your turn");
    }

    user.dahai({ pai });
    user.isIppatsu = false;
    user.isRinshankaiho = false;

    this.turnNext();
  }

  isPao({}: { user: MahjongUser }): Player {
    // const yakus = this.result!.yakus.map((e) => e.str);
    // if (yakus.includes("大三元")) {
    //   const pais = user.paiCall.map((e) => e.pais[0].fmt);
    //   if (pais.includes("z5") && pais.includes("z6") && pais.includes("z7")) {
    //     const set = user.paiCall.findLast((e) => e.pais[0].isSangenHai());
    //     return set!.fromWho;
    //   }
    // }

    // if (yakus.includes("大四喜")) {
    //   const pais = user.paiCall.map((e) => e.pais[0].fmt);
    //   if (
    //     pais.includes("z1") && pais.includes("z2") && pais.includes("z3") &&
    //     pais.includes("z4")
    //   ) {
    //     const set = user.paiCall.findLast((e) =>
    //       e.pais[0].isJihai() && !e.pais[0].isSangenHai()
    //     );
    //     return set!.fromWho;
    //   }
    // }
    return Player.JICHA;
  }

  agari(
    { user, fromUser, pai, isChankan }: {
      user: MahjongUser;
      fromUser: MahjongUser;
      pai: Pai;
      isChankan: boolean;
    },
  ): void {
    const allMenzen = this.users.every((u) => u.paiSets.length === 0);
    const isTsumo = user.id === fromUser.id;

    const params: TokutenInput = {
      paiRest: user.paiRest,
      paiLast: pai,
      paiSets: user.paiSets,
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
        isHaitei: isTsumo && this.turnRest() === 0 && !user.isRinshankaiho,
        isHoutei: !isTsumo && this.turnRest() === 0,
        isChankan: isChankan,
        isRinshankaiho: user.isRinshankaiho,
        isChiho: isTsumo && this.turnRest() !== 69 &&
          user.paiKawa.length === 0 && allMenzen,
        isTenho: isTsumo && this.turnRest() === 69,
      },
    };
    this.result = new Tokuten({ ...params }).count();

    const honba = this.isHonbaTaken ? 0 : this.honba;
    const playerPao = this.isPao({ user });

    user.point += this.result.pointSum + this.kyotaku + (honba * 300);
    if (isTsumo) {
      if (playerPao !== Player.JICHA) {
        const userIdx = this.users.findIndex((e) => e.id === user.id);
        this.users[(userIdx + playerPao) % 4].point -= this.result.pointSum +
          (honba * 300);
      } else {
        for (let i = 0; i < this.users.length; i++) {
          if (this.users[i].id === user.id) {
            continue;
          }
          if ((this.kyoku % 4) === i) {
            this.users[i].point -= this.result.pointPrt + (honba * 100);
          } else {
            this.users[i].point -= this.result.pointCdn + (honba * 100);
          }
        }
      }
    } else {
      if (playerPao !== Player.JICHA) {
        const userIdx = this.users.findIndex((e) => e.id === user.id);
        this.users[(userIdx + playerPao) % 4].point -=
          (this.result.pointSum / 2) + (honba * 300);
        fromUser.point -= this.result.pointSum / 2;
      } else {
        fromUser.point -= this.result.pointSum + (honba * 300);
      }
    }

    this.kyotaku = 0;
    const isOya = user.id === this.users[this.kyoku % 4].id;
    this.gameEnded({ isAgari: true, isRenchan: isOya });
  }

  richi({ user }: { user: MahjongUser }): void {
    const allMenzen = this.users.every((u) => u.paiSets.length === 0);
    const isDabururichi = [69, 68, 67, 66].includes(this.turnRest()) &&
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
    user.point -= 1000;
    this.kyotaku += 1000;
  }

  owari({ nagashi }: { nagashi: boolean }): void {
    if (nagashi) {
      this.gameEnded({ isAgari: false, isRenchan: true });
      return;
    }

    const isTenpai = this.users.map((e) => e.isTenpai());

    const isNagashimangan = this.users.map((e) => e.isNagashimangan());
    if (this.turnRest() === 0 && isNagashimangan.some((e) => e)) {
      for (let i = 0; i < 4; i++) {
        if (isNagashimangan[i] === false) {
          continue;
        }
        // isOya
        if (i === (this.kyoku % 4)) {
          this.users[i].point += 12000;
          for (let j = 1; j < 4; j++) {
            this.users[(i + j) % 4].point -= 4000;
          }
        } else {
          this.users[i].point += 8000;
          for (let j = 1; j < 4; j++) {
            if (((i + j) % 4) === (this.kyoku % 4)) {
              this.users[(i + j) % 4].point -= 4000;
            } else {
              this.users[(i + j) % 4].point -= 2000;
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
          user.point += pntInc;
        } else {
          user.point -= pntDcs;
        }
      }
    }

    const isOyaTempai = isTenpai[this.kyoku % 4];
    this.gameEnded({ isAgari: false, isRenchan: isOyaTempai });
  }

  naki({ user, set }: { user: MahjongUser; set: PaiSet }): void {
    if (set.type === PaiSetType.ANKAN) {
      if (user.afterMinKanKakan) {
        // this.kandora();
        user.afterMinKanKakan = false;
      }
      user.paiRest.push(user.paiTsumo!);
      user.paiTsumo = undefined;
      user.afterAnKan = true;
    }
    if (set.type === PaiSetType.MINKAN) {
      user.afterMinKanKakan = true;
    }
    if (set.type === PaiSetType.KAKAN) {
      if (user.afterMinKanKakan) {
        // this.kandora();
        user.afterMinKanKakan = false;
      }
      user.paiRest.push(user.paiTsumo!);
      user.paiTsumo = undefined;
      user.afterMinKanKakan = true;
      user.paiSets = user.paiSets.filter((e) => {
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
      // TODO
      // this.users[(userIdx + set.fromWho) % 4].isNagashimanganCalled = true;
    }

    user.paiRest = user.paiRest.filter((e) =>
      !set.pais.map((e) => e.id).includes(e.id)
    );
    user.paiSets.push(set);
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
  ): void {
    switch (action) {
      case MahjongCommand.TSUMO:
        this.tsumo({ user });
        break;
      case MahjongCommand.RNSHN:
        this.rinshanTsumo({ user });
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
      case MahjongCommand.DORA: {
        this.dora();
        break;
      }
    }
  }
}
