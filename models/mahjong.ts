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

  turnUser(): MahjongUser {
    return this.users[this.turnUserIdx];
  }

  turnNext(): void {
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
  }

  turnRest(): number {
    return this.paiYama.length + Math.floor(this.paiWanpai.length / 2) - 4;
  }

  turnMove({ user }: { user: MahjongUser }): void {
    const userIdx = this.users.findIndex((e) => e.id === user.id);
    this.turnUserIdx = userIdx;
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
    if (isAgari) {
      this.kyotaku = 0;
    }
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

  tsumo({ user }: { user: MahjongUser }): void {
    user.setPaiTsumo({ pai: this.paiYama.splice(-1)[0] });
  }

  dahai({ user, pai }: { user: MahjongUser; pai: Pai }): void {
    if (user.isAfterKakan) {
      this.users.forEach((e) => e.isIppatsu = false);
      user.isAfterKakan = false;
    }
    if (user.id !== this.turnUser().id) {
      throw new Error("when dahai called, not your turn");
    }

    user.dahai({ pai });
    user.isIppatsu = false;
    user.isRinshankaiho = false;

    this.turnNext();
  }

  dora(): void {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
  }

  rinshanTsumo({ user }: { user: MahjongUser }): void {
    user.setPaiTsumo({ pai: this.paiRinshan.splice(0, 1)[0] });
    user.isRinshankaiho = true;
  }

  isPaoDaisangen(
    { user, yakus }: { user: MahjongUser; yakus: string[] },
  ): Player {
    if (!yakus.includes("大三元")) {
      return Player.JICHA;
    }
    const pais = user.paiSets.map((e) => e.pais[0].fmt);
    if (!(pais.includes("z5") && pais.includes("z6") && pais.includes("z7"))) {
      return Player.JICHA;
    }
    const set = user.paiSets.findLast((e) => e.pais[0].isSangenHai());
    return set?.fromWho ?? Player.JICHA;
  }

  isPaoDaisushi(
    { user, yakus }: { user: MahjongUser; yakus: string[] },
  ): Player {
    if (!yakus.includes("大四喜")) {
      return Player.JICHA;
    }
    const pais = user.paiSets.map((e) => e.pais[0].fmt);
    if (
      !(pais.includes("z1") && pais.includes("z2") && pais.includes("z3") &&
        pais.includes("z4"))
    ) {
      return Player.JICHA;
    }

    const set = user.paiSets.findLast((e) => e.pais[0].isKazeHai());
    return set?.fromWho ?? Player.JICHA;
  }

  isPao({ user, yakus }: { user: MahjongUser; yakus: string[] }): Player {
    const daisangen = this.isPaoDaisangen({ user, yakus });
    const daisushi = this.isPaoDaisushi({ user, yakus });
    return daisangen === Player.JICHA ? daisushi : daisangen;
  }

  agariMinusPointTsumo(
    { user, result, pao }: {
      user: MahjongUser;
      result: TokutenOutput;
      pao: Player;
    },
  ): number[] {
    const honba = this.isHonbaTaken ? 0 : this.honba;
    if (pao !== Player.JICHA) {
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      return this.users.map((_, idx) => {
        let point = 0;
        if (idx === (userIdx + pao) % 4) {
          point += result.pointSum + (honba * 300);
        }
        return point;
      });
    }

    return this.users.map((e, idx) => {
      if (e.id === user.id) {
        return 0;
      }
      if ((this.kyoku % 4) === idx) {
        return result.pointPrt + (honba * 100);
      }
      return result.pointCdn + (honba * 100);
    });
  }

  agariMinusPointRon(
    { user, from, result, pao }: {
      user: MahjongUser;
      from: MahjongUser;
      result: TokutenOutput;
      pao: Player;
    },
  ): number[] {
    const honba = this.isHonbaTaken ? 0 : this.honba;
    if (pao !== Player.JICHA) {
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const fromUserIdx = this.users.findIndex((e) => e.id === from.id);
      return this.users.map((_, idx) => {
        let point = 0;
        if (idx === fromUserIdx) {
          point += result.pointSum / 2;
        }
        if (idx === (userIdx + pao) % 4) {
          point += result.pointSum / 2 + (honba * 300);
        }
        return point;
      });
    }

    return this.users.map((e) => {
      if (e.id !== from.id) {
        return 0;
      }
      return result.pointSum + (honba * 300);
    });
  }

  agari(
    { user, from, pai, isChankan = false }: {
      user: MahjongUser;
      from: MahjongUser;
      pai: Pai;
      isChankan?: boolean;
    },
  ): void {
    const allMenzen = this.users.every((u) => u.paiSets.length === 0);
    const isTsumo = user.id === from.id;

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
    const result = new Tokuten({ ...params }).count();
    this.result = result;

    const honba = this.isHonbaTaken ? 0 : this.honba;
    const pao = this.isPao({
      user,
      yakus: result.yakus.map((e) => e.str),
    });

    user.point += this.result.pointSum + (this.kyotaku * 1000) + (honba * 300);
    let pointMinus = [];
    if (isTsumo) {
      pointMinus = this.agariMinusPointTsumo({ user, result, pao });
    } else {
      pointMinus = this.agariMinusPointRon({ user, from, result, pao });
    }
    for (const [idx, user] of this.users.entries()) {
      user.point -= pointMinus[idx];
    }
    const isOya = user.id === this.users[this.kyoku % 4].id;
    this.gameEnded({ isAgari: true, isRenchan: isOya });
  }

  richi({ user }: { user: MahjongUser }): void {
    if (user.isRichi) {
      throw new Error("when richi called, already richi");
    }

    const allMenzen = this.users.every((u) => u.paiSets.length === 0);
    const isDabururichi = [69, 68, 67, 66].includes(this.turnRest()) &&
      allMenzen;
    if (isDabururichi) {
      user.isDabururichi = true;
    } else {
      user.isRichi = true;
    }

    user.isIppatsu = true;
    user.point -= 1000;
    this.kyotaku += 1;
  }

  owariNagashimangan(): number[] {
    const isNagashimangan = this.users.map((e) => e.isNagashimangan());
    const points = [0, 0, 0, 0];
    const isOya = (e: number) => e === (this.kyoku % 4);

    for (let i = 0; i < 4; i++) {
      if (isNagashimangan[i] === false) {
        continue;
      }
      if (isOya(i)) {
        points[i] += 12000;
        for (let j = 1; j < 4; j++) {
          points[(i + j) % 4] -= 4000;
        }
      } else {
        points[i] += 8000;
        for (let j = 1; j < 4; j++) {
          if (isOya((i + j) % 4)) {
            points[(i + j) % 4] -= 4000;
          } else {
            points[(i + j) % 4] -= 2000;
          }
        }
      }
    }
    return points;
  }

  owariNormal({ isTenpai }: { isTenpai: boolean[] }): number[] {
    const cnt = isTenpai.filter((e) => e).length;
    const points = [0, 0, 0, 0];
    const pntInc = (cnt === 4 || cnt === 0) ? 0 : 3000 / cnt;
    const pntDcs = (pntInc * cnt) / (4 - cnt);
    isTenpai.forEach((e, idx) => {
      if (e) {
        points[idx] += pntInc;
      } else {
        points[idx] -= pntDcs;
      }
    });

    return points;
  }

  owari({ nagashi }: { nagashi: boolean }): void {
    if (nagashi) {
      this.gameEnded({ isAgari: false, isRenchan: true });
      return;
    }

    if (this.turnRest() !== 0) {
      throw new Error("when owari called, pai remained");
    }

    const isTenpai = this.users.map((e) => e.isTenpai());
    const pointsNagashimangan = this.owariNagashimangan();
    if (pointsNagashimangan.some((e) => e !== 0)) {
      this.users.forEach((e, idx) => {
        e.point += pointsNagashimangan[idx];
      });
    } else {
      const points = this.owariNormal({ isTenpai });
      this.users.forEach((e, idx) => {
        e.point += points[idx];
      });
    }

    const isOyaTempai = isTenpai[this.kyoku % 4];
    this.gameEnded({ isAgari: false, isRenchan: isOyaTempai });
  }

  naki({ user, set }: { user: MahjongUser; set: PaiSet }): void {
    user.naki({ set });
    this.turnMove({ user });

    const userIdx = this.users.findIndex((e) => e.id === user.id);
    if (set.fromWho !== Player.JICHA) {
      this.users[(userIdx + set.fromWho) % 4].isCalled = true;
    }

    if (set.type === PaiSetType.KAKAN) {
      user.isAfterKakan = true;
      return;
    }
    this.users.forEach((e) => e.isIppatsu = false);
  }

  input(
    action: MahjongCommand,
    { user, params }: {
      user: MahjongUser;
      params: {
        agari?: {
          fromUser: MahjongUser;
          paiAgari: Pai;
        };
        chnkn?: {
          fromUser: MahjongUser;
          paiChnkn: Pai;
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
      case MahjongCommand.TSUMO: {
        this.tsumo({ user });
        break;
      }
      case MahjongCommand.DAHAI: {
        const { paiDahai } = params.dahai!;
        this.dahai({ user, pai: paiDahai });
        break;
      }
      case MahjongCommand.AGARI: {
        const { paiAgari, fromUser } = params.agari!;
        this.agari({ user, from: fromUser, pai: paiAgari });
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
      case MahjongCommand.RNSHN: {
        this.rinshanTsumo({ user });
        break;
      }
      case MahjongCommand.CHNKN: {
        const { paiChnkn, fromUser } = params.chnkn!;
        this.agari({ user, from: fromUser, pai: paiChnkn, isChankan: true });
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
