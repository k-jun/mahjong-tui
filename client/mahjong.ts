import {
  Pai,
  TokutenInput,
  TokutenOutput,
} from "@k-jun/mahjong";
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
  skip?: Record<never, never>;
  richi?: MahjongParamsRichi;
  dahai?: MahjongParamsDahai;
  agari?: MahjongParamsAgari;
  owari?: MahjongParamsOwari;
  naki?: MahjongParamsNaki;
};

export type MahjongParamsRichi = {
  paiId: number;
};

export type MahjongParamsDahai = {
  paiId: number;
};

export type MahjongParamsNaki = {
  type: "pon" | "chi" | "minkan" | "kakan" | "ankan";
  usrId: string;
  pmyId: number[]; // paiRest
  purId: number[]; // paiCall
};

export type MahjongParamsAgari = {
  isChnkn?: boolean;
  paiId: number;
};

export type MahjongParamsOwari = {
  type?: "yao9" | "kaze4" | "richi4" | "ron3" | "kan4";
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
  SKIP = "skip",
}

export type MahjongAction = {
  user: MahjongUser;
  type: MahjongActionType;
  enable?: boolean;
  naki?: MahjongParamsNaki;
  agari?: MahjongParamsAgari;
  options?: {
    naki?: MahjongParamsNaki[];
    agari?: MahjongParamsAgari[];
    richi?: MahjongParamsRichi[];
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
  tokutens: {
    user: MahjongUser;
    input: TokutenInput;
    output: TokutenOutput;
  }[] = [];
  scrdiffs: {
    base: number[];
    diff: number[];
  }[] = [];
  mutex: Mutex = createMutex();

  kyotaku: number = 0;
  honba: number = 0;
  kyoku: number = 0;

  isAgari: boolean = false;
  isRenchan: boolean = false;
  status: "playing" | "ended" | "completed" = "playing";
  EndedType?: "yao9" | "kaze4" | "richi4" | "ron3" | "kan4";
  isHonbaTaken: boolean = false;

  state: string = "";
  enableDebug: boolean = false;
  sleep: number = 500;

  output: (mjg: Mahjong) => Promise<void>;

  constructor(
    userIds: string[],
    output: (mjg: Mahjong) => Promise<void>,
  ) {
    this.state = crypto.randomUUID();
    this.users = userIds.map((val) =>
      new MahjongUser({ id: val, point: 25000 })
    );
    this.output = output;
  }
}
