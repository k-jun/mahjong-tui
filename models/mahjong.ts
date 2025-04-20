import { createMutex, Mutex } from "@117/mutex";
import { User } from "./user.ts";
import {
  Pai,
  PaiAll,
  PaiKaze,
  PaiSet,
  PaiSetType,
  Player,
  Tokuten,
  TokutenInput,
  TokutenOutput,
} from "@k-jun/mahjong";
import seedrandom from "npm:seedrandom";

export enum MahjongInput {
  TSUMO = "tsumo",
  DAHAI = "dahai",
  AGARI = "agari",
  RICHI = "richi",
  OWARI = "owari",
  CHNKN = "chankan",
  RNSHN = "rinshan",
  NAKI = "naki",
  SKIP = "skip",
}

export enum MahjongActionType {
  TSUMO = "tsumo",
  RON = "ron",
  ANKAN = "ankan",
  KAKAN = "kakan",
  MINKAN = "minkan",
  PON = "pon",
  CHI = "chi",
  OWARI = "owari",
  RICHI = "richi",
}

export type MahjongAction = {
  user: User;
  type: MahjongActionType;
  enable?: boolean;
  naki?: {
    set: PaiSet;
  };
  agari?: {
    fromUser: User;
    paiAgari: Pai;
    isChankan?: boolean;
  };
};

export type MahjongInputParams = {
  agari?: {
    fromUser: User;
    paiAgari: Pai;
  };
  chnkn?: {
    fromUser: User;
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

export class Mahjong {
  paiYama: Pai[] = [];
  paiRinshan: Pai[] = [];
  paiWanpai: Pai[] = [];
  paiBakaze: Pai = new Pai("z1");
  paiDora: Pai[] = [];
  paiDoraUra: Pai[] = [];
  users: User[] = [];
  turnUserIdx: number = 0;
  actions: MahjongAction[] = [];
  result: TokutenOutput[] = [];
  mutex: Mutex = createMutex();
  state: string = "";

  kyotaku: number = 0;
  honba: number = 0;
  kyoku: number = 0;

  isAgari: boolean = false;
  isRenchan: boolean = false;
  isEnded: boolean = false;
  isHonbaTaken: boolean = false;

  sleepSec: number = 0.5;

  output: (mjg: Mahjong) => Promise<void>;

  constructor(
    userIds: string[],
    output: (mjg: Mahjong) => Promise<void>,
  ) {
    this.users = userIds.map((val, idx) =>
      new User({ id: val, point: 25000, paiJikaze: PaiKaze[idx] })
    );
    this.output = output;
    this.state = crypto.randomUUID();
  }

  turnUser(): User {
    return this.users[this.turnUserIdx];
  }

  async turnNext(): Promise<boolean> {
    if (this.turnRest() === 0) {
      this.output(this);
      await this.sleep();
      this.owari({ nagashi: false });
      return false;
    }
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
    return true;
  }

  turnRest(): number {
    return this.paiYama.length + this.paiRinshan.length - 4;
  }

  turnMove({ user }: { user: User }): void {
    const userIdx = this.users.findIndex((e) => e.id === user.id);
    this.turnUserIdx = userIdx;
  }

  sleep(): Promise<void> {
    if (this.sleepSec === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, this.sleepSec * 1000));
  }

  generate(): Pai[] {
    const pais = [...PaiAll];
    const rng = seedrandom();
    for (let i = pais.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pais[i], pais[j]] = [pais[j], pais[i]];
    }
    return pais;
  }

  async gameStart(pais: Pai[]): Promise<void> {
    this.paiYama = pais;
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].paiJikaze = PaiKaze[i];
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[(j + this.kyoku) % 4].setPaiRest({
          pais: this.paiYama.splice(-4).reverse(),
        });
      }
    }
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].setPaiRest({
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
    await this.tsumo({ user: this.turnUser() });
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
    this.output(this);
  }

  gameReset(): void {
    if (this.isEnded) {
      this.updateBakyo();
      this.isEnded = false;
      this.isAgari = false;
      this.isRenchan = false;
    }
    this.result = [];
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];
    this.paiRinshan = [];
    this.isHonbaTaken = false;
    this.users.forEach((e) => e.reset());
    this.actions = [];
    this.output(this);
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

  async tsumo({ user }: { user: User }): Promise<void> {
    if (this.turnRest() === 0) {
      throw new Error("tsumo called while turnRest is 0");
    }

    this.output(this);
    await this.sleep();
    const pai = this.paiYama.splice(-1)[0];
    user.setPaiTsumo({ pai });
    this.actionSetAfterTsumo({ from: user, pai });
  }

  async tsumoRinshan({ user }: { user: User }): Promise<void> {
    if (this.turnRest() === 0) {
      throw new Error("tsumoRinshan called while turnRest is 0");
    }

    this.output(this);
    await this.sleep();
    const pai = this.paiRinshan.splice(0, 1)[0];
    user.setPaiTsumo({ pai });

    user.isRinshankaiho = true;
    if (user.countMinkanKakan > 1) {
      this.dora();
      user.countMinkanKakan -= 1;
    }

    this.actionSetAfterTsumo({ from: user, pai });
  }

  fromWho(jicha: number, tacha: number): Player {
    switch ((tacha - jicha + 4) % 4) {
      case 0:
        return Player.JICHA;
      case 1:
        return Player.SHIMOCHA;
      case 2:
        return Player.TOIMEN;
      case 3:
        return Player.TOIMEN;
      default:
        throw new Error("failed to fromWho");
    }
  }

  actionSetAfterKakan({ from, pai }: { from: User; pai: Pai }): void {
    const fromIdx = this.users.findIndex((e) => e.id === from.id);
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const params = this.buildParams({
        user,
        pai,
        options: { isTsumo: false, isChankan: true },
      });
      const result = new Tokuten({ ...params }).count();
      if (result.pointSum === 0) {
        continue;
      }
      this.actions.push({ user, type: MahjongActionType.RON });
    }
  }

  actionSetAfterTsumo({ from, pai }: { from: User; pai: Pai }): void {
    this.actions = [];

    const userIdx = this.users.findIndex((e) => e.id === from.id);
    const user = this.users[userIdx];

    // tsumo
    const params = this.buildParams({
      user,
      pai,
      options: { isTsumo: true, isChankan: false },
    });

    const result = new Tokuten({ ...params }).count();
    if (result.pointSum > 0) {
      this.actions.push({ user, type: MahjongActionType.TSUMO });
    }

    // ankan
    const setAnkan = user.canAnkan();
    if (
      setAnkan.length > 0 && this.paiRinshan.length > 0 && this.turnRest() > 0
    ) {
      this.actions.push({ user, type: MahjongActionType.ANKAN });
    }
    // kakan
    const setKakan = user.canKakan();
    if (
      setKakan.length > 0 && this.paiRinshan.length > 0 && this.turnRest() > 0
    ) {
      this.actions.push({ user, type: MahjongActionType.KAKAN });
    }

    // richi
    const pais = user.canRichi();
    if (pais.length > 0 && this.paiRinshan.length > 0 && this.turnRest() > 0) {
      this.actions.push({ user, type: MahjongActionType.RICHI });
    }
  }

  actionSetAfterDahai({ from, pai }: { from: User; pai: Pai }): void {
    this.actions = [];

    const fromIdx = this.users.findIndex((e) => e.id === from.id);
    // ron
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const params = this.buildParams({
        user,
        pai,
        options: { isTsumo: false, isChankan: false },
      });
      const result = new Tokuten({ ...params }).count();
      if (result.pointSum === 0) {
        continue;
      }
      if (!user.canRon()) {
        continue;
      }
      this.actions.push({ user, type: MahjongActionType.RON });
    }

    // 海底牌 は鳴くことが出来ない
    if (this.turnRest() === 0) {
      return;
    }

    // minkan
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const fromWho = this.fromWho(userIdx, fromIdx);
      const set = user.canMinkan({ pai, fromWho });
      if (set.length > 0) {
        this.actions.push({ user, type: MahjongActionType.MINKAN });
      }
    }
    // pon
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const fromWho = this.fromWho(userIdx, fromIdx);
      const set = user.canPon({ pai, fromWho });
      if (set.length > 0) {
        this.actions.push({ user, type: MahjongActionType.PON });
      }
    }
    // chi
    for (let i = 1; i < 2; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const set = user.canChi({ pai });

      if (set.length > 0) {
        this.actions.push({
          user,
          type: MahjongActionType.CHI,
        });
      }
    }
  }

  async dahai({ user, pai }: { user: User; pai: Pai }): Promise<void> {
    if (this.turnUser().id !== user.id) {
      throw new Error("when dahai called, not your turn");
    }

    if (user.isAfterKakan) {
      this.users.forEach((e) => e.isIppatsu = false);
      user.isAfterKakan = false;
    }
    if (user.countMinkanKakan > 0) {
      this.dora();
      user.countMinkanKakan = 0;
    }
    user.dahai({ pai });
    user.isIppatsu = false;
    user.isRinshankaiho = false;

    // 四槓散了
    if (this.paiRinshan.length === 0) {
      this.output(this);
      await this.sleep();
      this.owari({ nagashi: true });
    }

    // 四風連打
    if (this.turnRest() === 66 && pai.isKazeHai()) {
      const allMenzen = this.users.every((u) => u.paiSets.length === 0);
      const allKaze = this.users.every((u) => u.paiKawa[0]?.fmt === pai.fmt);
      if (allMenzen && allKaze) {
        this.output(this);
        await this.sleep();
        this.owari({ nagashi: true });
      }
    }

    this.actionSetAfterDahai({ from: user, pai });
    if (this.actions.length === 0) {
      await this.richiAfter({ user });
      if (await this.turnNext()) {
        await this.tsumo({ user: this.turnUser() });
      }
    }
  }

  dora(): void {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
  }

  isPaoDaisangen(
    { user, yakus }: { user: User; yakus: string[] },
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
    { user, yakus }: { user: User; yakus: string[] },
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

  isPao({ user, yakus }: { user: User; yakus: string[] }): Player {
    const daisangen = this.isPaoDaisangen({ user, yakus });
    const daisushi = this.isPaoDaisushi({ user, yakus });
    return daisangen === Player.JICHA ? daisushi : daisangen;
  }

  agariMinusPointTsumo(
    { user, result, pao }: {
      user: User;
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
      user: User;
      from: User;
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

  buildParams(
    { user, pai, options }: {
      user: User;
      pai: Pai;
      options: {
        isTsumo: boolean;
        isChankan: boolean;
      };
    },
  ): TokutenInput {
    const allMenzen = this.users.every((u) => u.paiSets.length === 0);
    const { isTsumo, isChankan } = options;
    return {
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
  }

  calcPoint(
    { user, from, pai, isChankan = false }: {
      user: User;
      from: User;
      pai: Pai;
      isChankan?: boolean;
    },
  ): void {
    const isTsumo = user.id === from.id;
    const params = this.buildParams({
      user,
      pai,
      options: { isTsumo, isChankan },
    });

    const result = new Tokuten({ ...params }).count();
    this.result.push(result);

    const honba = this.isHonbaTaken ? 0 : this.honba;
    const pao = this.isPao({
      user,
      yakus: result.yakus.map((e) => e.str),
    });

    user.point += result.pointSum + (this.kyotaku * 1000) + (honba * 300);
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

  async agari(
    { user, from, pai, isChankan = false }: {
      user: User;
      from: User;
      pai: Pai;
      isChankan?: boolean;
    },
  ): Promise<void> {
    const isTsumo = user.id === from.id;
    const action = this.actions.find((action) => {
      if (action.user.id !== user.id) {
        return false;
      }
      if (isTsumo) {
        return action.type === MahjongActionType.TSUMO;
      }
      return action.type === MahjongActionType.RON;
    });

    if (action === undefined) {
      throw new Error("when agari called, action: `agari` is not allowed");
    }

    action.enable = true;
    action.agari = { fromUser: from, paiAgari: pai, isChankan };

    if (isTsumo) {
      this.calcPoint({ user, from, pai, isChankan });
      return;
    }
    // ダブロン
    const actionUndefined = this.actions.filter((e) =>
      e.enable === undefined && e.type === MahjongActionType.RON
    );
    if (actionUndefined.length >= 1) {
      return;
    }
    const actionEnable = this.actions.filter((e) =>
      e.enable === true && e.type === MahjongActionType.RON
    );

    // 三家和了
    if (actionEnable.length === 3) {
      this.output(this);
      await this.sleep();
      this.owari({ nagashi: true });
      return;
    }

    for (const action of actionEnable) {
      if (action.agari === undefined) {
        throw new Error("when agari called, action.agari is undefined");
      }
      this.calcPoint({
        user: action.user,
        from: action.agari!.fromUser,
        pai: action.agari!.paiAgari,
        isChankan: action.agari?.isChankan ?? false,
      });
    }
  }

  richiBefore({ user }: { user: User }): void {
    if (user.isRichi) {
      throw new Error("when richi called, already richi");
    }
    const action = this.actions.find((action) => {
      if (action.user.id !== user.id) {
        return false;
      }
      return action.type === MahjongActionType.RICHI;
    });

    if (action === undefined) {
      throw new Error(
        "when richi called, action: `richi` is not allowed",
      );
    }
    this.actions = [];
    user.isAfterRichi = true;

    return;
  }

  async richiAfter({ user }: { user: User }): Promise<void> {
    if (!user.isAfterRichi) {
      return;
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
    user.isAfterRichi = false;

    // 四家立直
    if (this.users.every((e) => e.isRichi)) {
      this.output(this);
      await this.sleep();
      this.owari({ nagashi: true });
    }
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

    const isTenpai = this.users.map((e) => e.machi().length > 0);
    const pointsNagashimangan = this.owariNagashimangan();
    const points = this.owariNormal({ isTenpai });

    if (pointsNagashimangan.some((e) => e !== 0)) {
      this.users.forEach((e, idx) => {
        e.point += pointsNagashimangan[idx];
      });
    } else {
      this.users.forEach((e, idx) => {
        e.point += points[idx];
      });
    }

    const isOyaTempai = isTenpai[this.kyoku % 4];
    this.gameEnded({ isAgari: false, isRenchan: isOyaTempai });
  }

  async naki({ user, set }: { user: User; set: PaiSet }): Promise<void> {
    const action = this.actions.find((action) => {
      if (action.user.id !== user.id) {
        return false;
      }
      switch (set.type) {
        case PaiSetType.MINKO:
          return action.type === MahjongActionType.PON;
        case PaiSetType.MINSHUN:
          return action.type === MahjongActionType.CHI;
        case PaiSetType.MINKAN:
          return action.type === MahjongActionType.MINKAN;
        case PaiSetType.ANKAN:
          return action.type === MahjongActionType.ANKAN;
        case PaiSetType.KAKAN:
          return action.type === MahjongActionType.KAKAN;
        default:
          return false;
      }
    });

    if (action === undefined) {
      throw new Error(`when naki called, action: ${set.type} is not allowed`);
    }

    action.naki = { set };
    action.enable = true;
    for (const a of this.actions) {
      if (a.user.id === user.id && a.enable === undefined) {
        a.enable = false;
      }
    }
    const primaryAction = this.actions.find((e) =>
      [undefined, true].includes(e.enable)
    );
    if (primaryAction!.user.id !== user.id) {
      return;
    }

    this.actions = [];
    if (this.turnUser().isAfterRichi) {
      await this.richiAfter({ user: this.turnUser() });
    }
    user.naki({ set });

    const userIdx = this.users.findIndex((e) => e.id === user.id);
    const fromUser = this.users[(userIdx + set.fromWho) % 4];
    if (user.id !== fromUser.id) {
      fromUser.paiKawa = fromUser.paiKawa.filter((e) =>
        e.id !== set.paiCall[0].id
      );
      fromUser.paiCalled.push(set.paiCall[0]);
    }
    this.turnMove({ user });

    if (set.fromWho !== Player.JICHA) {
      this.users[(userIdx + set.fromWho) % 4].isCalled = true;
    }

    if (set.type === PaiSetType.ANKAN) {
      this.dora();
      await this.tsumoRinshan({ user });
    }
    if (set.type === PaiSetType.MINKAN) {
      user.countMinkanKakan += 1;
      await this.tsumoRinshan({ user });
    }
    if (set.type === PaiSetType.KAKAN) {
      user.countMinkanKakan += 1;
      user.isAfterKakan = true;
      this.actionSetAfterKakan({
        from: user,
        pai: set.paiCall[set.paiCall.length - 1],
      });
      if (this.actions.length === 0) {
        await this.tsumoRinshan({ user });
      }
      return;
    }
    this.users.forEach((e) => e.isIppatsu = false);
  }

  async skip({ user }: { user: User }): Promise<boolean> {
    const liveActions = this.actions.filter((e) => e.enable === undefined);
    const userActions = liveActions.filter((e) => e.user.id === user.id);
    if (userActions.length === 0) {
      return false;
    }

    // update
    userActions.forEach((e) => {
      e.enable = false;
    });

    // furiten
    if (
      this.actions.some((e) =>
        e.user.id == user.id && e.type === MahjongActionType.RON
      )
    ) {
      user.isFuriten = true;
    }

    const isAfterTsumo = this.actions.every((e) =>
      [
        MahjongActionType.TSUMO,
        MahjongActionType.ANKAN,
        MahjongActionType.KAKAN,
        MahjongActionType.RICHI,
      ].includes(e.type)
    );

    if (this.actions.every((e) => e.enable === false)) {
      this.actions = [];
      if (this.turnUser().isAfterKakan) {
        await this.tsumoRinshan({ user: this.turnUser() });
      }

      if (!isAfterTsumo) {
        await this.richiAfter({ user: this.turnUser() });
        if (await this.turnNext()) {
          await this.tsumo({ user: this.turnUser() });
        }
      }

      return true;
    }

    const actionActive = this.actions.filter((e) =>
      [undefined, true].includes(e.enable)
    );

    const isRon = (e: MahjongAction) => e.type === MahjongActionType.RON;
    const isUndef = (e: MahjongAction) => e.enable === undefined;
    actionActive.sort((a, b) => {
      if (isRon(a) && isRon(b)) {
        if (isUndef(a) && !isUndef(b)) return -1;
        if (!isUndef(a) && isUndef(b)) return 1;
      }
      return 0;
    });

    for (const action of actionActive) {
      if (action.enable === undefined) {
        break;
      }
      if (action.type === MahjongActionType.RON) {
        this.agari({
          user: action.user,
          from: action.agari!.fromUser,
          pai: action.agari!.paiAgari,
        });
        break;
      }
      this.naki({ user: action.user, set: action.naki!.set });
      break;
    }

    return false;
  }

  async input(
    action: MahjongInput,
    { user, params }: {
      user: User;
      params: MahjongInputParams;
    },
  ): Promise<void> {
    // mutex lock
    await this.mutex.acquire();

    let isRefresh = true;
    switch (action) {
      case MahjongInput.DAHAI: {
        const { paiDahai } = params.dahai!;
        await this.dahai({ user, pai: paiDahai });
        break;
      }
      case MahjongInput.AGARI: {
        const { paiAgari, fromUser } = params.agari!;
        await this.agari({ user, from: fromUser, pai: paiAgari });
        break;
      }
      case MahjongInput.RICHI: {
        await this.richiBefore({ user });
        break;
      }
      case MahjongInput.OWARI: {
        const { nagashi } = params.owari!;
        await this.owari({ nagashi });
        break;
      }
      case MahjongInput.CHNKN: {
        const { paiChnkn, fromUser } = params.chnkn!;
        await this.agari({
          user,
          from: fromUser,
          pai: paiChnkn,
          isChankan: true,
        });
        break;
      }
      case MahjongInput.NAKI: {
        const { set } = params.naki!;
        await this.naki({ user, set });
        break;
      }
      case MahjongInput.SKIP: {
        isRefresh = await this.skip({ user });
        break;
      }
    }

    if (isRefresh) {
      this.state = crypto.randomUUID();
      this.output(this);
    }

    // mutex unlock
    this.mutex.release();
  }
}
