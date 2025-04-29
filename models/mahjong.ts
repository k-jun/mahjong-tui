import { Pai, PaiAll, PaiKaze, PaiSet, PaiSetType, Player, Tokuten, TokutenInput, TokutenOutput } from "@k-jun/mahjong";
import { createMutex, Mutex } from "@117/mutex";
import { MahjongUser } from "./mahjong_user.ts";

export enum MahjongInput {
  TSUMO = "tsumo",
  RNSHN = "rnshn",
  DAHAI = "dahai",
  AGARI = "agari",
  RICHI = "richi",
  OWARI = "owari",
  NAKI = "naki",
  SKIP = "skip",
  BREAK = "break",
}

export type MahjongParams = {
  state?: string;
  usrId: string;
  tsumo?: Record<never, never>;
  dahai?: {
    paiId: number;
  };
  agari?: {
    isChnkn?: boolean;
    paiId: number;
  };
  richi?: Record<never, never>;
  owari?: {
    type?: "yao9" | "kaze4" | "richi4" | "ron3" | "kan4";
  };
  naki?: {
    type: "pon" | "chi" | "minkan" | "kakan" | "ankan";
    usrId: string;
    pmyId: number[]; // paiRest
    purId: number[]; // paiCall
  };
  skip?: Record<never, never>;
};

export enum MahjongActionType {
  TSUMO = "tsumoAgari",
  DAHAI = "dahai",
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
  user: MahjongUser;
  type: MahjongActionType;
  enable?: boolean;
  naki?: {
    type: "pon" | "chi" | "minkan" | "kakan" | "ankan";
    usrId: string;
    pmyId: number[]; // paiRest
    purId: number[]; // paiCall
  };
  agari?: {
    isChnkn?: boolean;
    paiId: number;
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
  tokutens: TokutenOutput[] = [];
  mutex: Mutex = createMutex();

  kyotaku: number = 0;
  honba: number = 0;
  kyoku: number = 0;

  isAgari: boolean = false;
  isRenchan: boolean = false;
  isEnded: boolean = false;
  isHonbaTaken: boolean = false;

  state: string = "";
  enableDebug: boolean = false;
  sleep: number = 1000;

  output: (mjg: Mahjong) => Promise<void>;

  constructor(
    userIds: string[],
    output: (mjg: Mahjong) => Promise<void>,
  ) {
    this.state = crypto.randomUUID();
    this.users = userIds.map((val) => new MahjongUser({ id: val, point: 25000 }));
    this.output = output;
  }

  turnUser(): MahjongUser {
    return this.users[this.turnUserIdx];
  }

  turnNext(): [MahjongInput, MahjongParams] {
    if (this.turnRest() === 0) {
      return [MahjongInput.OWARI, { usrId: this.turnUser().id, owari: {} }];
    }
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
    return [MahjongInput.TSUMO, { usrId: this.turnUser().id }];
  }

  turnRest(): number {
    return this.paiYama.length + this.paiRinshan.length - 4;
  }

  turnMove({ user }: { user: MahjongUser }): void {
    const userIdx = this.users.findIndex((e) => e.id === user.id);
    this.turnUserIdx = userIdx;
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
        return Player.KAMICHA;
      default:
        this.debug(`failed to fromWho: ${jicha}, ${tacha}`);
        return Player.JICHA;
    }
  }

  generate(): Pai[] {
    return [...PaiAll];
  }

  gameStart(pais: Pai[]): void {
    this.paiYama = pais;
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].paiJikaze = PaiKaze[i];
    }

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[(j + this.kyoku) % 4].paiRest.push(...this.paiYama.splice(-4).reverse());
      }
    }
    for (let i = 0; i < 4; i++) {
      this.users[(i + this.kyoku) % 4].paiRest.push(...this.paiYama.splice(-1));
    }
    this.paiWanpai.push(...this.paiYama.splice(0, 14));

    const rinshan = this.paiWanpai.splice(0, 4);
    this.paiRinshan.push(rinshan[1], rinshan[0], rinshan[3], rinshan[2]);
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
    this.turnUserIdx = this.kyoku % 4;
    this.paiBakaze = PaiKaze[Math.floor(this.kyoku / 4)];
    this.tsumo({ usrId: this.turnUser().id });
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
    this.tokutens = [];
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

  dora(): void {
    const [ura, omote] = this.paiWanpai.splice(0, 2);
    this.paiDoraUra.push(ura);
    this.paiDora.push(omote);
  }

  tsumo(params: MahjongParams): [MahjongInput, MahjongParams] {
    if (this.turnRest() === 0) {
      this.debug("tsumo called while turnRest is 0");
      return [MahjongInput.BREAK, params];
    }
    const user = this.users.find((e) => e.id === params["usrId"]!)!;
    const pai = this.paiYama.splice(-1)[0];
    user.paiTsumo = pai;
    this.actions = this.actionAfterTsumo({ from: user, pai });
    this.actions.push({ user: this.turnUser(), type: MahjongActionType.DAHAI });
    return [MahjongInput.BREAK, params];
  }

  dahai(params: MahjongParams): [MahjongInput, MahjongParams] {
    const { paiId } = params["dahai"]!;
    const user = this.turnUser();
    const pai = new Pai(paiId);

    if (user.isAfterKakan) {
      this.users.forEach((e) => e.isIppatsu = false);
      user.isAfterKakan = false;
    }

    user.countKans = user.countKans.map((e) => Math.max(0, e - 1));
    if (user.countKans.some((e) => e === 0)) {
      this.dora();
    }
    user.countKans = user.countKans.filter((e) => e > 0);

    if (!user.dahai({ pai })) {
      this.debug(`dahai failed: ${user.id}, ${pai.fmt}`);
    }

    user.isIppatsu = false;
    user.isRinshankaiho = false;

    // 四槓散了 && not 四槓子
    if (this.paiRinshan.length === 0) {
      const isKan = (e: PaiSet) => [PaiSetType.ANKAN, PaiSetType.MINKAN, PaiSetType.KAKAN].includes(e.type);
      let cnt = 0;
      for (const e of this.users) {
        if (e.paiSets.some(isKan)) {
          cnt += 1;
        }
      }
      if (cnt > 1) {
        return [MahjongInput.OWARI, { usrId: user.id, owari: { type: "kan4" } }];
      }
    }

    // 四風連打
    if (this.turnRest() === 66 && pai.isKazeHai()) {
      const allMenzen = this.users.every((u) => u.paiSets.length === 0);
      const allKaze = this.users.every((u) => u.paiKawa[0]?.fmt === pai.fmt);
      if (allMenzen && allKaze) {
        return [MahjongInput.OWARI, { usrId: user.id, owari: { type: "kaze4" } }];
      }
    }

    this.actions = this.actionAfterDahai({ from: user, pai });
    if (this.actions.length === 0) {
      this.richiAfter({ user });
      // 四家立直
      if (this.users.every((e) => e.isRichi || e.isDabururichi)) {
        return [MahjongInput.OWARI, { usrId: user.id, owari: { type: "richi4" } }];
      }
      return this.turnNext();
    }
    return [MahjongInput.BREAK, params];
  }

  agari(params: MahjongParams): [MahjongInput, MahjongParams] {
    const user = this.users.find((e) => e.id === params["usrId"]!)!;
    const isTsumo = user.id === this.turnUser().id;
    const action = this.findAction(user, MahjongInput.AGARI, params)!;

    action.enable = true;
    action.agari = params.agari!;

    if (isTsumo) {
      this.calcPoint({
        user,
        from: this.turnUser(),
        pai: new Pai(params.agari!.paiId),
        isChankan: params.agari!.isChnkn ?? false,
      });
      return [MahjongInput.BREAK, params];
    }

    // ダブロン
    const actionUndefined = this.actions.filter((e) => e.enable === undefined && e.type === MahjongActionType.RON);
    if (actionUndefined.length >= 1) {
      return [MahjongInput.BREAK, params];
    }
    const actionEnable = this.actions.filter((e) => e.enable === true && e.type === MahjongActionType.RON);

    // 三家和了
    if (actionEnable.length === 3) {
      return [MahjongInput.OWARI, { usrId: this.turnUser().id, owari: { type: "ron3" } }];
    }
    for (const action of actionEnable) {
      this.calcPoint({
        user: action.user,
        from: this.turnUser(),
        pai: new Pai(action.agari!.paiId),
        isChankan: action.agari?.isChnkn ?? false,
      });
    }
    return [MahjongInput.BREAK, params];
  }

  owari(params: MahjongParams): [MahjongInput, MahjongParams] {
    const { type } = params["owari"]!;
    if (type != undefined) {
      this.gameEnded({ isAgari: false, isRenchan: true });
      return [MahjongInput.BREAK, params];
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
    return [MahjongInput.BREAK, params];
  }

  richiBefore(params: MahjongParams): [MahjongInput, MahjongParams] {
    const user = this.users.find((e) => e.id === params["usrId"]!)!;
    this.actions = [{ user, type: MahjongActionType.DAHAI }];
    user.isAfterRichi = true;
    return [MahjongInput.BREAK, params];
  }

  richiAfter({ user }: { user: MahjongUser }): void {
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
  }

  naki(params: MahjongParams): [MahjongInput, MahjongParams] {
    const user = this.users.find((e) => e.id === params["usrId"]!)!;
    const userIdx = this.users.findIndex((e) => e.id === params["usrId"]!);
    const tacha = this.users.find((e) => e.id === params.naki!.usrId)!;
    const tachaIdx = this.users.findIndex((e) => e.id === params.naki!.usrId);
    const paiRest = params.naki!.pmyId.map((e) => new Pai(e));
    const paiCall = params.naki!.purId.map((e) => new Pai(e));
    const fromWho = this.fromWho(userIdx, tachaIdx);
    const convertor: Record<string, PaiSetType> = {
      pon: PaiSetType.MINKO,
      chi: PaiSetType.MINSHUN,
      minkan: PaiSetType.MINKAN,
      kakan: PaiSetType.KAKAN,
      ankan: PaiSetType.ANKAN,
    };

    const set = new PaiSet({ type: convertor[params.naki!.type], paiRest, paiCall, fromWho });

    const action = this.findAction(user, MahjongInput.NAKI, params)!;
    action.naki = params.naki!;
    action.enable = true;
    this.actions.forEach((a) => {
      if (a.user.id === user.id && a.enable === undefined) {
        a.enable = false;
      }
    });
    const primaryAction = this.actions.find((e) => [undefined, true].includes(e.enable));
    if (primaryAction!.user.id !== user.id) {
      return [MahjongInput.BREAK, params];
    }

    this.actions = [];
    this.richiAfter({ user: this.turnUser() });
    if (!user.naki({ set })) {
      this.debug(`naki failed: ${user.id}, ${set.pais.map((e) => e.fmt).join(",")}`);
    }

    if (user.id !== tacha.id) {
      tacha.paiCalled.push(tacha.paiKawa.splice(tacha.paiKawa.length - 1, 1)[0]);
    }
    this.turnMove({ user });

    if (![PaiSetType.ANKAN, PaiSetType.MINKAN, PaiSetType.KAKAN].includes(set.type)) {
      this.users[(userIdx + set.fromWho) % 4].isCalled = true;
      this.users.forEach((e) => e.isIppatsu = false);
    } else {
      switch (set.type) {
        case PaiSetType.ANKAN:
          this.dora();
          break;
        case PaiSetType.MINKAN:
          user.countKans.push(2);
          break;
        case PaiSetType.KAKAN:
          user.countKans.push(2);
          user.isAfterKakan = true;
          this.actions = this.actionAfterKakan({ from: user, pai: set.paiCall[set.paiCall.length - 1] });
          break;
      }
      if (this.actions.length === 0) {
        this.users.forEach((e) => e.isIppatsu = false);
        return [MahjongInput.RNSHN, params];
      }
    }

    if (this.actions.length === 0) {
      this.actions.push({ user: this.turnUser(), type: MahjongActionType.DAHAI });
    }
    return [MahjongInput.BREAK, params];
  }

  tsumoRinshan(params: MahjongParams): [MahjongInput, MahjongParams] {
    const user = this.users.find((e) => e.id === params["usrId"]!)!;
    const pai = this.paiRinshan.splice(0, 1)[0];
    user.paiTsumo = pai;

    user.isRinshankaiho = true;
    user.countKans = user.countKans.map((e) => Math.max(0, e - 1));
    // console.log("user.countKans", user.countKans);
    if (user.countKans.some((e) => e === 0)) {
      this.dora();
    }
    user.countKans = user.countKans.filter((e) => e > 0);

    this.actions = this.actionAfterTsumo({ from: user, pai });
    this.actions.push({ user: this.turnUser(), type: MahjongActionType.DAHAI });
    return [MahjongInput.BREAK, params];
  }

  skip(params: MahjongParams): [MahjongInput, MahjongParams] {
    const user = this.users.find((e) => e.id === params["usrId"]!)!;

    const liveActions = this.actions.filter((e) => e.enable === undefined);
    const userActions = liveActions.filter((e) => e.user.id === user.id);
    if (userActions.length === 0) {
      return [MahjongInput.BREAK, params];
    }

    userActions.forEach((e) => {
      if (e.type === MahjongActionType.DAHAI) {
        return;
      }
      e.enable = false;
    });

    if (userActions.some((e) => e.type === MahjongActionType.RON)) {
      user.isFuriten = true;
    }

    const isAfterDahai = this.actions.every((e) =>
      [
        MahjongActionType.RON,
        MahjongActionType.MINKAN,
        MahjongActionType.PON,
        MahjongActionType.CHI,
      ].includes(e.type)
    );
    const isAllFalse = this.actions.every((e) => e.enable === false);
    if (isAllFalse) {
      this.actions = [];
      if (this.turnUser().isAfterKakan) {
        return [MahjongInput.RNSHN, { usrId: this.turnUser().id }];
      }
      if (isAfterDahai) {
        this.richiAfter({ user: this.turnUser() });
        if (this.users.every((e) => e.isRichi || e.isDabururichi)) {
          return [MahjongInput.OWARI, { usrId: user.id, owari: { type: "richi4" } }];
        }
        return this.turnNext();
      }
    }

    const actionActive = this.actions.filter((e) => [undefined, true].includes(e.enable));

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
        return [MahjongInput.AGARI, { usrId: action.user.id, agari: action.agari! }];
      }
      return [MahjongInput.NAKI, { usrId: action.user.id, naki: action.naki! }];
    }

    return [MahjongInput.BREAK, params];
  }

  actionAfterKakan({ from, pai }: { from: MahjongUser; pai: Pai }): MahjongAction[] {
    const actions: MahjongAction[] = [];
    const fromIdx = this.users.findIndex((e) => e.id === from.id);
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const params = this.buildParams({ user, pai, options: { isTsumo: false, isChankan: true } });
      const result = new Tokuten({ ...params }).count();
      if (result.pointSum === 0) {
        continue;
      }
      actions.push({ user, type: MahjongActionType.RON });
    }
    return actions;
  }

  actionAfterTsumo({ from, pai }: { from: MahjongUser; pai: Pai }): MahjongAction[] {
    const actions: MahjongAction[] = [];

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
      actions.push({ user, type: MahjongActionType.TSUMO });
    }

    // ankan
    const setAnkan = user.canAnkan();
    if (
      setAnkan.length > 0 && this.paiRinshan.length > 0 && this.turnRest() > 0
    ) {
      actions.push({ user, type: MahjongActionType.ANKAN });
    }
    // kakan
    const setKakan = user.canKakan();
    if (
      setKakan.length > 0 && this.paiRinshan.length > 0 && this.turnRest() > 0
    ) {
      actions.push({ user, type: MahjongActionType.KAKAN });
    }

    // richi
    const pais = user.canRichi();
    if (pais.length > 0 && this.paiRinshan.length > 0 && this.turnRest() > 0) {
      actions.push({ user, type: MahjongActionType.RICHI });
    }

    // owari
    const allMenzen = this.users.every((e) => e.paiSets.length === 0);
    if (allMenzen && user.paiKawa.length === 0 && user.isKyushukyuhai()) {
      actions.push({ user, type: MahjongActionType.OWARI });
    }

    return actions;
  }

  actionAfterDahai({ from, pai }: { from: MahjongUser; pai: Pai }): MahjongAction[] {
    const actions: MahjongAction[] = [];
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
      actions.push({ user, type: MahjongActionType.RON });
    }

    // 海底牌 は鳴くことが出来ない
    if (this.turnRest() === 0) {
      return actions;
    }

    // minkan
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const fromWho = this.fromWho(userIdx, fromIdx);
      const set = user.canMinkan({ pai, fromWho });
      if (set.length > 0) {
        actions.push({ user, type: MahjongActionType.MINKAN });
      }
    }
    // pon
    for (let i = 1; i < 4; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      const fromWho = this.fromWho(userIdx, fromIdx);
      const set = user.canPon({ pai, fromWho });
      if (set.length > 0) {
        actions.push({ user, type: MahjongActionType.PON });
      }
    }
    // chi
    for (let i = 1; i < 2; i++) {
      const user = this.users[(fromIdx + i) % 4];
      const set = user.canChi({ pai });

      if (set.length > 0) {
        actions.push({ user, type: MahjongActionType.CHI });
      }
    }
    return actions;
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
      paiDoraUra: (user.isRichi || user.isDabururichi) ? this.paiDoraUra.map((e) => e.next()) : [],
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

  agariMinusPointTsumo(
    { user, tokuten, pao }: {
      user: MahjongUser;
      tokuten: TokutenOutput;
      pao: Player;
    },
  ): number[] {
    const honba = this.isHonbaTaken ? 0 : this.honba;
    if (pao !== Player.JICHA) {
      const userIdx = this.users.findIndex((e) => e.id === user.id);
      return this.users.map((_, idx) => {
        let point = 0;
        if (idx === (userIdx + pao) % 4) {
          point += tokuten.pointSum + (honba * 300);
        }
        return point;
      });
    }

    return this.users.map((e, idx) => {
      if (e.id === user.id) {
        return 0;
      }
      if ((this.kyoku % 4) === idx) {
        return tokuten.pointPrt + (honba * 100);
      }
      return tokuten.pointCdn + (honba * 100);
    });
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

  agariMinusPointRon(
    { user, from, tokuten, pao }: {
      user: MahjongUser;
      from: MahjongUser;
      tokuten: TokutenOutput;
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
          point += tokuten.pointSum / 2;
        }
        if (idx === (userIdx + pao) % 4) {
          point += tokuten.pointSum / 2 + (honba * 300);
        }
        return point;
      });
    }

    return this.users.map((e) => {
      if (e.id !== from.id) {
        return 0;
      }
      return tokuten.pointSum + (honba * 300);
    });
  }

  calcPoint(
    { user, from, pai, isChankan: isChnkn }: { user: MahjongUser; from: MahjongUser; pai: Pai; isChankan: boolean },
  ): void {
    const isTsumo = user.id === from.id;
    const params = this.buildParams({
      user,
      pai,
      options: { isTsumo, isChankan: isChnkn },
    });

    const tokuten = new Tokuten({ ...params }).count();
    this.tokutens.push(tokuten);

    const honba = this.isHonbaTaken ? 0 : this.honba;
    const pao = this.isPao({
      user,
      yakus: tokuten.yakus.map((e) => e.str),
    });

    user.point += tokuten.pointSum + (this.kyotaku * 1000) + (honba * 300);
    let pointMinus = [];
    if (isTsumo) {
      pointMinus = this.agariMinusPointTsumo({ user, tokuten, pao });
    } else {
      pointMinus = this.agariMinusPointRon({ user, from, tokuten, pao });
    }
    for (const [idx, user] of this.users.entries()) {
      user.point -= pointMinus[idx];
    }
    const isOya = user.id === this.users[this.kyoku % 4].id;
    this.gameEnded({ isAgari: true, isRenchan: isOya });
  }

  debug(msg: string): void {
    if (this.enableDebug) {
      throw new Error(msg);
    }
    console.log(msg);
  }

  findAction(user: MahjongUser, input: MahjongInput, params: MahjongParams): MahjongAction | undefined {
    if (![MahjongInput.DAHAI, MahjongInput.RICHI, MahjongInput.NAKI, MahjongInput.AGARI, MahjongInput.OWARI].includes(input)) {
      return undefined;
    }
    if (input === MahjongInput.NAKI) {
      return this.actions.find((e) => e.user.id === user.id && e.type === params.naki!.type);
    }
    if (input === MahjongInput.AGARI) {
      const user = this.users.find((e) => e.id === params["usrId"]!)!;
      const isTsumo = user.id === this.turnUser().id;
      return this.actions.find((e) =>
        e.user.id === user.id && e.type === (isTsumo ? MahjongActionType.TSUMO : MahjongActionType.RON)
      );
    }
    if (input === MahjongInput.OWARI) {
      return this.actions.find((e) => e.user.id === user.id && e.type === MahjongActionType.OWARI);
    }
    const convertMap: Record<string, MahjongActionType | undefined> = {
      [MahjongInput.DAHAI]: MahjongActionType.DAHAI,
      [MahjongInput.RICHI]: MahjongActionType.RICHI,
    };
    return this.actions.find((e) => e.user.id === user.id && e.type === convertMap[input]!);
  }

  validate(input: MahjongInput, params: MahjongParams): boolean {
    const user = this.users.find((e) => e.id === params["usrId"]!);
    if (user === undefined) {
      this.debug(`user not found: ${params["usrId"]}`);
      return false;
    }

    switch (input) {
      case MahjongInput.DAHAI: {
        if (user.id !== this.turnUser().id) {
          return false;
        }
        if (params["dahai"] === undefined) {
          return false;
        }
        const action = this.findAction(user, input, params);
        if (action === undefined) {
          this.debug(`action not found: ${input}`);
          return false;
        }
        break;
      }
      case MahjongInput.AGARI: {
        if (params["agari"] === undefined) {
          return false;
        }
        const action = this.findAction(user, input, params);
        if (action === undefined) {
          this.debug(`action not found: ${input}`);
          return false;
        }
        break;
      }
      case MahjongInput.RICHI: {
        const action = this.findAction(user, input, params);
        if (action === undefined) {
          this.debug(`action not found: ${input}`);
          return false;
        }
        break;
      }
      case MahjongInput.NAKI: {
        if (params["naki"] === undefined) {
          return false;
        }
        const action = this.findAction(user, input, params);
        if (action === undefined) {
          this.debug(`action not found: ${input}`);
          return false;
        }
        break;
      }
      case MahjongInput.SKIP: {
        break;
      }
      case MahjongInput.OWARI: {
        if (params["owari"] === undefined) {
          return false;
        }
        const action = this.findAction(user, input, params);
        if (action === undefined) {
          this.debug(`action not found: ${input}`);
          return false;
        }
        break;
      }
      default: {
        this.debug(`unknown input: ${input}`);
        return false;
      }
    }
    return true;
  }

  async input(input: MahjongInput, params: MahjongParams): Promise<void> {
    await this.mutex.acquire();
    if (params.state !== this.state) {
      this.mutex.release();
      return;
    }

    console.log("input", params); 
    if (!this.validate(input, params)) {
      this.debug(`Invalid input: ${input}`);
      return;
    }

    console.log(`before input: ${input}, user: ${params["usrId"]}, turn: ${this.turnUser().id}`); 
    let isRefresh = true;
    outer: while (true) {
      switch (input) {
        case MahjongInput.TSUMO: {
          [input, params] = this.tsumo(params);
          break;
        }
        case MahjongInput.DAHAI: {
          [input, params] = this.dahai(params);
          break;
        }
        case MahjongInput.AGARI: {
          [input, params] = this.agari(params);
          if (input === MahjongInput.BREAK) {
            isRefresh = false;
          }
          break;
        }
        case MahjongInput.OWARI: {
          [input, params] = this.owari(params);
          break;
        }
        case MahjongInput.RICHI: {
          [input, params] = this.richiBefore(params);
          break;
        }
        case MahjongInput.NAKI: {
          [input, params] = this.naki(params);
          const existActions = this.actions.filter((e) => e.type !== MahjongActionType.DAHAI).length !== 0;
          if (input === MahjongInput.BREAK && existActions) {
            isRefresh = false;
          }
          break;
        }
        case MahjongInput.RNSHN: {
          [input, params] = this.tsumoRinshan(params);
          break;
        }
        case MahjongInput.SKIP: {
          [input, params] = this.skip(params);
          if (input === MahjongInput.BREAK) {
            isRefresh = false;
          }
          break;
        }
        case MahjongInput.BREAK:
          break outer;
        default:
          this.debug(`unknown input: ${input}`);
          break outer;
      }
      this.output(this);
      // sleep 1 sec
      if (this.sleep > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.sleep));
      }
    }

    console.log(`after input: ${input}, user: ${params["usrId"]}, turn: ${this.turnUser().id}`); 
    if (isRefresh) {
      this.state = crypto.randomUUID();
      this.output(this);
    }

    this.mutex.release();
  }
}
