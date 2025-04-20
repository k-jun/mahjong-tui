import { Pai, TokutenOutput } from "@k-jun/mahjong";
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
}

export type MahjongParams = {
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

export type MahjongAction = {
  user: MahjongUser;
  input: MahjongInput;
  params: MahjongParams;
  enable?: boolean;
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

  turnNext(): boolean {
    this.turnUserIdx = (this.turnUserIdx + 1) % 4;
    return true;
  }

  turnRest(): number {
    return this.paiYama.length + this.paiRinshan.length - 4;
  }

  turnMove({ user }: { user: MahjongUser }): void {
    const userIdx = this.users.findIndex((e) => e.id === user.id);
    this.turnUserIdx = userIdx;
  }

  findAction(user: MahjongUser, input: MahjongInput, _: MahjongParams): MahjongAction | undefined {
    if (input === MahjongInput.DAHAI) {
      return this.actions.find((e) => e.user === user && e.input === input);
    }

    if (input === MahjongInput.AGARI) {
      return this.actions.find((e) => e.user === user && e.input === input);
    }
    return undefined;
  }

  validate(input: MahjongInput, params: MahjongParams): boolean {
    const user = this.users.find((e) => e.id === params["usrId"]!);
    if (user === undefined) {
      return false;
    }
    switch (input) {
      case MahjongInput.DAHAI: {
        if (this.findAction(user, input, params) !== undefined) {
          return false;
        }
        break;
      }
      case MahjongInput.AGARI: {
        if (this.findAction(user, input, params) !== undefined) {
          return false;
        }
        break;
      }
      
    }
    return true;
  }

  dahai(params: MahjongParams): MahjongAction[] {
    const { paiId } = params["dahai"]!;
    const user = this.turnUser();
    const pai = user.pais.find((e) => e.id === paiId)!;
    user.dahai({ pai });
    return [];
  }

  debug(msg: string): void {
    if (this.enableDebug) {
      console.log(msg);
    }
  }

  sleep(millisec: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, millisec));
  }

  async input(state: string, input: MahjongInput, params: MahjongParams): Promise<void> {
    if (state !== this.state) {
      this.debug(`Invalid state: ${state} !== ${this.state}`);
      return;
    }
    if (!this.validate(input, params)) {
      this.debug(`Invalid input: ${input}`);
      return;
    }

    await this.mutex.acquire();

    let isRefresh = true;

    switch (input) {
      // case MahjongInput.TSUMO:
      //   this.tsumo(params);
      //   break;
      case MahjongInput.DAHAI:
        this.dahai(params["dahai"]);
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
    }

    if (isRefresh) {
      this.state = crypto.randomUUID();
      await this.output(this);
    }

    this.mutex.release();
  }
}
