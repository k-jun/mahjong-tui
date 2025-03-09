import { MahjongPai, MahjongPaiSet } from "./mahjong_pai.ts";
import { User } from "./user.ts";

import { PaiSetType, Player, Shanten, Tokuten } from "@k-jun/mahjong";

type params = {
  paiBakaze: MahjongPai;
  paiJikaze: MahjongPai;
  paiDora: MahjongPai[];
  paiDoraUra: MahjongPai[];
  options: {
    isTsumo: boolean;
    isOya: boolean;
    isRichi?: boolean;
    isDabururichi?: boolean;
    isIppatsu?: boolean;
    isHaitei?: boolean;
    isHoutei?: boolean;
    isChankan?: boolean;
    isRinshankaiho?: boolean;
    isChiho?: boolean;
    isTenho?: boolean;
  };
};

export class MahjongUser extends User {
  paiHand: MahjongPai[];
  paiCall: MahjongPaiSet[];
  paiKawa: MahjongPai[];
  isRichi: boolean;

  paiTsumo?: MahjongPai;
  constructor(id: string = "") {
    super(id);
    this.paiHand = [];
    this.paiCall = [];
    this.paiKawa = [];
    this.isRichi = false;
  }

  setHandPais(pais: MahjongPai[]) {
    this.paiHand.push(...pais);
  }

  setPaiTsumo(pai: MahjongPai) {
    if (this.paiTsumo) {
      throw new Error("Already tsumoed");
    }
    this.paiTsumo = pai;
  }

  canChi(paiCall: MahjongPai): MahjongPaiSet[] {
    if (paiCall.isJihai()) {
      return [];
    }

    const result: MahjongPaiSet[] = [];
    const counts = new Map<number, MahjongPai[]>();
    const paiAll = [...this.paiHand];
    // the red pai comes first, as the red pai has the smallest id.
    paiAll.sort((a, b) => a.id - b.id);

    for (const pai of paiAll) {
      if (pai.typ != paiCall.typ || pai.isJihai()) {
        continue;
      }
      counts.set(pai.num, [...(counts.get(pai.num) || []), pai]);
    }

    const add = ({ key1, key2, idx1, idx2 }: { [key: string]: number }) => {
      const a = counts.get(key1) ?? [];
      const b = counts.get(key2) ?? [];
      if (a.length < idx1 || b.length < idx2) {
        return;
      }

      result.push(
        new MahjongPaiSet({
          paiRest: [a[idx1], b[idx2]],
          paiCall: [paiCall],
          type: PaiSetType.MINSHUN,
        }),
      );
    };

    for (
      const [key1, key2] of [
        [paiCall.num - 2, paiCall.num - 1],
        [paiCall.num - 1, paiCall.num + 1],
        [paiCall.num + 1, paiCall.num + 2],
      ]
    ) {
      if (counts.has(key1) && counts.has(key2)) {
        add({ key1, key2, idx1: 0, idx2: 0 });
        if (
          counts.get(key1)![0].isAka() &&
          counts.get(key1)!.length >= 2
        ) {
          add({ key1, key2, idx1: 1, idx2: 0 });
        }
        if (
          counts.get(key2)![0].isAka() &&
          counts.get(key2)!.length >= 2
        ) {
          add({ key1, key2, idx1: 0, idx2: 1 });
        }
      }
    }

    return result;
  }

  canPon(pai: MahjongPai, fromWho: Player): MahjongPaiSet[] {
    const result = [];

    const paiHits = this.paiHand.filter((e) => e.fmt == pai.fmt);
    // the red pai comes first, as the red pai has the smallest id.
    paiHits.sort((a, b) => a.id - b.id);
    if (paiHits.length >= 2) {
      result.push(
        new MahjongPaiSet({
          paiCall: [pai],
          paiRest: paiHits.slice(0, 2),
          type: PaiSetType.MINKO,
          fromWho,
        }),
      );
    }

    if (paiHits.length >= 3 && paiHits.some((e) => e.isAka())) {
      result.push(
        new MahjongPaiSet({
          paiCall: [pai],
          paiRest: paiHits.slice(1, 3),
          type: PaiSetType.MINKO,
          fromWho,
        }),
      );
    }

    return result;
  }

  canMinkan(pai: MahjongPai, fromWho: Player): MahjongPaiSet[] {
    const result = [];
    const paiHits = this.paiHand.filter((e) => e.fmt == pai.fmt);

    if (paiHits.length >= 3) {
      result.push(
        new MahjongPaiSet({
          paiRest: paiHits,
          paiCall: [pai],
          type: PaiSetType.MINKAN,
          fromWho,
        }),
      );
    }
    return result;
  }

  canAnkan(): MahjongPaiSet[] {
    const result = [];

    const paiAll = [...this.paiHand, ...(this.paiTsumo ? [this.paiTsumo] : [])];
    const counts: { [key: string]: MahjongPai[] } = {};
    for (const pai of paiAll) {
      if (!counts[pai.fmt]) {
        counts[pai.fmt] = [];
      }
      counts[pai.fmt].push(pai);
    }

    for (const [_, value] of Object.entries(counts)) {
      if (value.length >= 4) {
        result.push(
          new MahjongPaiSet({
            paiRest: value.slice(0, 4),
            type: PaiSetType.ANKAN,
          }),
        );
      }
    }

    return result;
  }

  canKakan(): MahjongPaiSet[] {
    if (!this.paiTsumo) {
      return [];
    }

    const result = [];
    const paiSet = this.paiCall.find((e) =>
      e.type == PaiSetType.MINKO && e.pais[0].fmt == this.paiTsumo?.fmt
    );
    if (paiSet) {
      result.push(
        new MahjongPaiSet({
          paiCall: [
            ...paiSet.paiCall,
            ...(this.paiTsumo ? [this.paiTsumo] : []),
          ],
          paiRest: paiSet.paiRest,
          type: PaiSetType.KAKAN,
        }),
      );
    }
    return result;
  }

  canRichi(): MahjongPai[] {
    if (!this.paiTsumo) {
      return [];
    }
    if (this.paiCall.length > 0) {
      return [];
    }

    const result = [];
    const paiAll = [...this.paiHand, ...(this.paiTsumo ? [this.paiTsumo] : [])];
    for (const [idx, pai] of paiAll.entries()) {
      const paiRest = [...paiAll];
      paiRest.splice(idx, 1);
      const x = new Shanten({
        paiRest: paiRest,
        paiSets: [],
      }).count();
      if (x != 0) {
        continue;
      }
      result.push(pai);
    }
    return result;
  }

  canRon(params: params, paiRon: MahjongPai) {
    params.options.isTsumo = false;
    params.options.isRichi = this.isRichi;

    const x = new Tokuten({
      ...params,
      paiRest: this.paiHand,
      paiLast: paiRon,
      paiSets: this.paiCall,
    }).count();
    return x.han != 0;
  }

  canAgari(params: params) {
    if (!this.paiTsumo) {
      return false;
    }
    params.options.isTsumo = true;
    params.options.isRichi = this.isRichi;

    const x = new Tokuten({
      ...params,
      paiRest: this.paiHand,
      paiLast: this.paiTsumo!,
      paiSets: this.paiCall,
    }).count();
    return x.han != 0;
  }
}
