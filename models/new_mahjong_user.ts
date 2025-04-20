import { Pai, PaiSet } from "@k-jun/mahjong";

export class MahjongUser {
  id: string;
  paiRest: Pai[];
  paiSets: PaiSet[];
  paiKawa: Pai[];
  paiTsumo?: Pai;
  paiJikaze: Pai;
  point: number;

  isRichi: boolean = false;
  isDabururichi: boolean = false;
  isIppatsu: boolean = false;
  isRinshankaiho: boolean = false;
  isCalled: boolean = false;
  isAfterKakan: boolean = false;
  isAfterRichi: boolean = false;
  countMinkanKakan: number = 0;
  isFuriten: boolean = false;

  constructor(
    { id, point, paiJikaze }: { id: string; point: number; paiJikaze: Pai },
  ) {
    this.id = id;
    this.paiRest = [];
    this.paiSets = [];
    this.paiKawa = [];
    this.paiJikaze = paiJikaze;
    this.point = point;
  }

  get pais(): Pai[] {
    const pais = [...this.paiRest]
    if (this.paiTsumo !== undefined) {
      pais.push(this.paiTsumo);
    }
    return pais;
  }

  dahai({ pai }: { pai: Pai }): void {
    
  }
}
