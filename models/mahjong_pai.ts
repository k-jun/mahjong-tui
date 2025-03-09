import { Pai, PaiSet, PaiSetType, Player } from "@k-jun/mahjong";

export class MahjongPai extends Pai {
  isOpen: boolean;
  isSide: boolean;
  constructor(id: number | string) {
    super(id);
    this.isOpen = false;
    this.isSide = false;
  }

  setOpen(v: boolean) {
    this.isOpen = v;
  }

  setSide(v: boolean) {
    this.isSide = v;
  }
}

export class MahjongPaiSet extends PaiSet {
  override paiRest: MahjongPai[];
  override paiCall: MahjongPai[];

  constructor(
    { paiRest, paiCall = [], type, fromWho = Player.JICHA }: {
      paiRest: MahjongPai[];
      paiCall?: MahjongPai[];
      type: PaiSetType;
      fromWho?: Player;
    },
  ) {
    super({ paiRest, paiCall, type, fromWho });
    this.paiCall = paiCall;
    this.paiRest = paiRest;
  }
}
