import { Pai } from "@k-jun/mahjong";
import { User } from "./user.ts";

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
  tsumo?: Record<never, never>;
  dahai?: {
    pid: number;
  };
  agari?: {
    isChnkn: boolean;
    uid: number;
    pid: number;
  };
  richi?: Record<never, never>;
  owari?: {
    isTochu: boolean;
    why: string;
  };
  naki?: {
    sid: number;
  };
  skip?: Record<never, never>;
};

export class Mahjong {
  users: User[] = [];
  output: (mjg: Mahjong) => Promise<void>;

  constructor(
    users: User[],
    output: (mjg: Mahjong) => Promise<void>,
  ) {
    this.users = users;
    this.output = output;
  }
}
