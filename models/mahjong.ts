import { createMutex, Mutex } from "@117/mutex";
import { MahjongUser } from "./mahjong_user.ts";
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
}

export type MahjongAction = {
  user: MahjongUser;
  type: MahjongActionType;
  enable?: boolean;
  naki?: {
    set: PaiSet;
  };
  agari?: {
    fromUser: MahjongUser;
    paiAgari: Pai;
    isChankan?: boolean;
  };
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
  result: TokutenOutput[] = [];
  mutex: Mutex = createMutex();

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

  generate(): Pai[] {
    const pais = [...PaiAll];
    for (let i = pais.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pais[i], pais[j]] = [pais[j], pais[i]];
    }
    return pais;
  }

  gameStart(pais: Pai[]): void {
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

  tsumo({ user }: { user: MahjongUser }): void {
    const pai = this.paiYama.splice(-1)[0];
    user.setPaiTsumo({ pai });

    this.actionSetAfterTsumo({ from: user, pai });
    this.output(this);
  }

  getPlayer(jicha: number, tacha: number): Player {
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
        throw new Error("failed to getPlayer");
    }
  }

  actionSetAfterKakan({ from, pai }: { from: MahjongUser; pai: Pai }): void {
    const fromIdx = this.users.findIndex((e) => e.id === from.id);
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const params = this.buildParams({
        user,
        pai,
        options: { isTsumo: false, isChankan: true },
      });
      const result = new Tokuten({ ...params }).count();
      if (result.pointSum > 0) {
        this.actions.push({
          user,
          type: MahjongActionType.RON,
        });
      }
    }
  }

  actionSetAfterTsumo({ from, pai }: { from: MahjongUser; pai: Pai }): void {
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
      this.actions.push({
        user,
        type: MahjongActionType.TSUMO,
      });
    }
    // ankan
    const setAnkan = user.canAnkan();
    if (setAnkan.length > 0) {
      this.actions.push({
        user,
        type: MahjongActionType.ANKAN,
      });
    }
    // kakan
    const setKakan = user.canKakan();
    if (setKakan.length > 0) {
      this.actions.push({
        user,
        type: MahjongActionType.KAKAN,
      });
    }
  }

  actionSetAfterDahai({ from, pai }: { from: MahjongUser; pai: Pai }): void {
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
      if (result.pointSum > 0) {
        this.actions.push({
          user,
          type: MahjongActionType.RON,
        });
      }
    }
    // minkan
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const set = user.canMinkan({
        pai,
        fromWho: this.getPlayer(userIdx, fromIdx),
      });
      if (set.length > 0) {
        this.actions.push({
          user,
          type: MahjongActionType.MINKAN,
        });
      }
    }
    // pon
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const set = user.canPon({
        pai,
        fromWho: this.getPlayer(userIdx, fromIdx),
      });
      if (set.length > 0) {
        this.actions.push({
          user,
          type: MahjongActionType.PON,
        });
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

  dahai({ user, pai }: { user: MahjongUser; pai: Pai }): void {
    if (this.turnUser().id !== user.id) {
      throw new Error("when dahai called, not your turn");
    }

    if (user.isAfterKakan) {
      this.users.forEach((e) => e.isIppatsu = false);
      user.isAfterKakan = false;
    }
    user.dahai({ pai });
    user.isIppatsu = false;
    user.isRinshankaiho = false;
    this.actionSetAfterDahai({ from: user, pai });

    if (this.actions.length === 0) {
      this.turnNext();
    }
  }

  dora(): void {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
  }

  rinshanTsumo({ user }: { user: MahjongUser }): void {
    const pai = this.paiRinshan.splice(0, 1)[0];
    user.setPaiTsumo({ pai });
    user.isRinshankaiho = true;
    this.actionSetAfterTsumo({ from: user, pai });
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

  buildParams(
    { user, pai, options }: {
      user: MahjongUser;
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
      user: MahjongUser;
      from: MahjongUser;
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

  agari(
    { user, from, pai, isChankan = false }: {
      user: MahjongUser;
      from: MahjongUser;
      pai: Pai;
      isChankan?: boolean;
    },
  ): void {
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
      throw new Error("when agari called, action is not allowed");
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
      this.output(this);
      return;
    }
    const actionEnable = this.actions.filter((e) =>
      e.enable === true && e.type === MahjongActionType.RON
    );
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

  naki({ user, set }: { user: MahjongUser; set: PaiSet }): void {
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
      throw new Error("when naki called, action is not allowed");
    }

    action.naki = { set };
    action.enable = true;

    const validActions = this.actions.filter((e) =>
      e.enable !== false && (e.user.id === user.id && e.type === action.type)
    );
    if (validActions[0].user.id !== user.id) {
      this.output(this);
      return;
    }
    this.actions = [];
    user.naki({ set });

    this.turnMove({ user });

    const userIdx = this.users.findIndex((e) => e.id === user.id);
    if (set.fromWho !== Player.JICHA) {
      this.users[(userIdx + set.fromWho) % 4].isCalled = true;
    }

    if (set.type === PaiSetType.KAKAN) {
      user.isAfterKakan = true;
      this.actionSetAfterKakan({
        from: user,
        pai: set.paiCall[set.paiCall.length - 1],
      });
      return;
    }
    this.users.forEach((e) => e.isIppatsu = false);
  }

  skip({ user }: { user: MahjongUser }): void {
    if (this.actions.filter((e) => e.enable === undefined).length === 0) {
      return;
    }

    // update
    this.actions.forEach((e) => {
      if (e.user.id === user.id && e.enable === undefined) {
        e.enable = false;
      }
    });

    const isAfterTsumo = this.actions.every((e) =>
      [
        MahjongActionType.TSUMO,
        MahjongActionType.ANKAN,
        MahjongActionType.KAKAN,
      ].includes(e.type)
    );

    if (this.actions.every((e) => e.enable === false) && !isAfterTsumo) {
      this.turnNext();
      return;
    }

    const actionActive = this.actions.filter((
      e,
    ) => (e.enable === true || e.enable === undefined));
    const isRon = (e: MahjongAction) => e.type === MahjongActionType.RON;
    const isUndef = (e: MahjongAction) => e.enable === undefined;
    actionActive.sort((a, b) => {
      if (isRon(a) && isRon(b)) {
        if (isUndef(a) && !isUndef(b)) return -1;
        if (!isUndef(a) && isUndef(b)) return 1;
      }
      return 0;
    });

    let isRonCalled = false;
    for (const action of actionActive) {
      if (action.type === MahjongActionType.RON) {
        if (action.enable === undefined) {
          break;
        }
        if (action.enable === true) {
          isRonCalled = true;
          this.agari({
            user: action.user,
            from: action.agari!.fromUser,
            pai: action.agari!.paiAgari,
          });
        }
      }

      if (action.type !== MahjongActionType.RON) {
        if (isRonCalled) {
          break;
        }
        if (action.enable === undefined) {
          break;
        }
        if (action.enable === true) {
          this.naki({ user: action.user, set: action.naki!.set });
          break;
        }
      }
    }
    this.output(this);
  }

  async input(
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
  ): Promise<void> {
    // mutex lock
    await this.mutex.acquire();
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
      case MahjongCommand.SKIP: {
        this.skip({ user });
        break;
      }
    }
    // mutex unlock
    this.mutex.release();
  }
}
