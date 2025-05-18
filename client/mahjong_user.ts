import { Pai, PaiSet } from "@k-jun/mahjong";

export class MahjongUser {
  id: string;
  paiRest: Pai[];
  paiSets: PaiSet[];
  paiKawa: Pai[];
  paiCalled: Pai[];
  paiTsumo?: Pai;
  paiJikaze: Pai;
  point: number;

  isRichi: boolean = false;
  isDabururichi: boolean = false;
  isIppatsu: boolean = false;
  isRinshankaiho: boolean = false;
  isAfterKakan: boolean = false;
  isAfterRichi: boolean = false;
  isFuriten: boolean = false;
  isCalled: boolean = false;
  isOpen: boolean = false;

  countKans: number[] = [];
  constructor(
    { id, point }: { id: string; point: number },
  ) {
    this.id = id;
    this.paiRest = [];
    this.paiSets = [];
    this.paiKawa = [];
    this.paiCalled = [];
    this.paiJikaze = new Pai("z1");
    this.point = point;
  }
}
