import { Pai, PaiKaze, PaiSet, Player, Tokuten, TokutenInput, TokutenOutput } from "@k-jun/mahjong";
import { createMutex, Mutex } from "@117/mutex";
import { MahjongUser } from "./new_mahjong_user.ts";

export enum MahjongInput {
  TSUMO = "tsumo",
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
    paiId: number;
    paiIds: number[];
  };
  skip?: Record<never, never>;
};

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

  output: (mjg: Mahjong) => Promise<void>;

  constructor(
    users: MahjongUser[],
    output: (mjg: Mahjong) => Promise<void>,
  ) {
    this.state = crypto.randomUUID();
    this.users = users;
    this.output = output;
  }

  turnUser(): MahjongUser {
    return this.users[this.turnUserIdx];
  }

  turnNext(): [MahjongInput, MahjongParams] {
    if (this.turnRest() === 0) {
      return [MahjongInput.BREAK, { usrId: this.turnUser().id }];
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
        return Player.TOIMEN;
      default:
        throw new Error("failed to fromWho");
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
    return [MahjongInput.BREAK, params];
  }

  dahai(params: MahjongParams): [MahjongInput, MahjongParams] {
    const { paiId } = params["dahai"]!;
    const user = this.turnUser();
    const pai = user.pais.find((e) => e.id === paiId)!;

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
      return [MahjongInput.OWARI, {
        usrId: user.id,
        owari: { type: "kan4" },
      }];
    }

    // 四風連打
    if (this.turnRest() === 66 && pai.isKazeHai()) {
      const allMenzen = this.users.every((u) => u.paiSets.length === 0);
      const allKaze = this.users.every((u) => u.paiKawa[0]?.fmt === pai.fmt);
      if (allMenzen && allKaze) {
        return [MahjongInput.OWARI, {
          usrId: user.id,
          owari: { type: "kaze4" },
        }];
      }
    }

    this.actions = this.actionAfterDahai({ from: user, pai });
    if (this.actions.length === 0) {
      this.richiAfter({ user });
      // 四家立直
      if (this.users.every((e) => e.isRichi)) {
        return [MahjongInput.OWARI, {
          usrId: user.id,
          owari: { type: "richi4" },
        }];
      }
      return this.turnNext();
    }
    return [MahjongInput.BREAK, params];
  }

  richiBefore({ user }: { user: MahjongUser }): void {
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

  debug(msg: string): void {
    if (this.enableDebug) {
      console.log(msg);
    }
  }

  // findAction(user: MahjongUser, input: MahjongInput, _: MahjongParams): MahjongAction | undefined {
  //   if (input === MahjongInput.DAHAI) {
  //     return this.actionValid.find((e) => e.input === input && e.params.usrId === user.id);
  //   }

  //   if (input === MahjongInput.AGARI) {
  //     return this.actionValid.find((e) => e.input === input && e.params.usrId === user.id);
  //   }
  //   return undefined;
  // }

  validate(_: MahjongInput, params: MahjongParams): boolean {
    const user = this.users.find((e) => e.id === params["usrId"]!);
    if (user === undefined) {
      return false;
    }
    return true;
  }

  async input(input: MahjongInput, params: MahjongParams): Promise<void> {
    if (params.state !== this.state) {
      this.debug(`Invalid state: ${params.state} !== ${this.state}`);
      return;
    }
    if (!this.validate(input, params)) {
      this.debug(`Invalid input: ${input}`);
      return;
    }

    await this.mutex.acquire();

    let isRefresh = true;
    outer: while (true) {
      switch (input) {
        case MahjongInput.TSUMO:
          [input, params] = this.tsumo(params);
          break;
        case MahjongInput.DAHAI:
          [input, params] = this.dahai(params);
          break;
          // case MahjongInput.AGARI:
          //   this.agari(params);
          //   break;
          // case MahjongInput.RICHI:
          //   this.richi(params);
          //   break;
          // case MahjongInput.OWARI:
          //   this.owari(params);
          //   break;
          // case MahjongInput.NAKI:
          //   this.naki(params);
          //   break;
          // case MahjongInput.SKIP:
          //   isRefresh = false;
          //   this.skip(params);
          //   break;
        case MahjongInput.BREAK:
          break outer;
      }
      this.output(this);
      // sleep 1 sec
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (isRefresh) {
      this.state = crypto.randomUUID();
      await this.output(this);
    }

    this.mutex.release();
  }
}
