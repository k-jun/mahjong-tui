import { PaiAllKind } from "@k-jun/mahjong";
import {
  Pai,
  PaiSet,
  PaiSetType,
  Player,
  Shanten,
  ShantenInput,
} from "@k-jun/mahjong";

export class User {
  id: string;
  paiRest: Pai[];
  paiSets: PaiSet[];
  paiKawa: Pai[];
  paiTsumo?: Pai;
  paiJikaze: Pai;
  paiCalled: Pai[];
  point: number = 0;

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
    this.paiCalled = [];
    this.paiJikaze = paiJikaze;
    this.point = point;
  }

  setPaiRest({ pais }: { pais: Pai[] }): void {
    this.paiRest.push(...pais);
    if (this.paiRest.length > 14) {
      throw new Error("invalid this.paiPais when setPaiPais called");
    }
  }

  setPaiTsumo({ pai }: { pai: Pai }): void {
    if (this.paiTsumo !== undefined) {
      throw new Error("this.paiTsumo is already set when setPaiTsumo called");
    }
    this.paiTsumo = pai;
  }

  dahai({ pai }: { pai: Pai }): void {
    const fromTsumo = this.paiTsumo?.id === pai.id;
    const fromTehai = this.paiRest.some((e) => e.id === pai.id);

    if (!fromTsumo && !fromTehai) {
      throw new Error("invalid pai when dahai called");
    }
    if (this.isRichi && !fromTsumo) {
      throw new Error("invalid this.paiTsumo when dahai called");
    }

    if (!this.isRichi && this.isFuriten) {
      this.isFuriten = false;
    }

    if (fromTsumo) {
      this.paiKawa.push(pai);
      this.paiTsumo = undefined;
      return;
    }

    const idx = this.paiRest.findIndex((e) => e.id === pai.id);
    this.paiKawa.push(...this.paiRest.splice(idx, 1));
    if (this.paiTsumo !== undefined) {
      this.paiRest.push(this.paiTsumo);
    }
    this.paiTsumo = undefined;
  }

  naki({ set }: { set: PaiSet }): void {
    switch (set.type) {
      case PaiSetType.ANKAN: {
        this.paiRest.push(this.paiTsumo!);
        this.paiTsumo = undefined;
        break;
      }
      case PaiSetType.KAKAN: {
        this.paiRest.push(this.paiTsumo!);
        this.paiTsumo = undefined;
        this.paiSets = this.paiSets.filter((e) => {
          return !(e.type === PaiSetType.MINKO &&
            e.pais[0].fmt === set.pais[0].fmt);
        });
        break;
      }
    }
    const filterIds = new Set(set.pais.map((e) => e.id));
    this.paiRest = this.paiRest.filter((e) => !filterIds.has(e.id));
    this.paiSets.push(set);
  }

  reset(): void {
    this.paiRest = [];
    this.paiSets = [];
    this.paiKawa = [];
    this.paiTsumo = undefined;
    this.isRichi = false;
    this.isDabururichi = false;
    this.isIppatsu = false;
    this.isCalled = false;
    this.isAfterKakan = false;
    this.isAfterRichi = false;
    this.countMinkanKakan = 0;
  }

  machi(): Pai[] {
    const count: Map<string, number> = new Map();
    for (const pai of this.paiRest) {
      count.set(pai.fmt, (count.get(pai.fmt) ?? 0) + 1);
    }

    const result: Pai[] = [];
    for (const lastPai of PaiAllKind) {
      const params: ShantenInput = {
        paiRest: [...this.paiRest, lastPai],
        paiSets: this.paiSets,
      };
      const shanten = new Shanten(params).count();
      if (shanten === -1 && count.get(lastPai.fmt) !== 4) {
        result.push(lastPai);
      }
    }
    return result;
  }

  canRon(): boolean {
    if (this.isFuriten) {
      return false;
    }

    const machi = this.machi();
    if (machi.length === 0) {
      return false;
    }

    for (const pai of machi) {
      if (this.paiKawa.includes(pai)) {
        return false;
      }
      if (this.paiCalled.includes(pai)) {
        return false;
      }
    }

    return true;
  }

  isNagashimangan(): boolean {
    return this.paiKawa.every((p) => p.isYaochuHai()) &&
      this.isCalled === false;
  }

  canChi({ pai }: { pai: Pai }): PaiSet[] {
    if (pai.isJihai()) {
      return [];
    }

    const result: PaiSet[] = [];
    const counts = new Map<number, Pai[]>();
    const paiAll = [...this.paiRest];
    // the red pai comes first, as the red pai has the smallest id.
    paiAll.sort((a, b) => a.id - b.id);

    for (const p of paiAll) {
      if (p.typ != pai.typ) {
        continue;
      }
      counts.set(p.num, [...(counts.get(p.num) || []), p]);
    }

    const add = ({ key1, key2, idx1, idx2 }: { [key: string]: number }) => {
      const a = counts.get(key1) ?? [];
      const b = counts.get(key2) ?? [];
      if (a.length < idx1 || b.length < idx2) {
        return;
      }

      result.push(
        new PaiSet({
          paiRest: [a[idx1], b[idx2]],
          paiCall: [pai],
          type: PaiSetType.MINSHUN,
          fromWho: Player.KAMICHA,
        }),
      );
    };

    for (
      const [key1, key2] of [
        [pai.num - 2, pai.num - 1],
        [pai.num - 1, pai.num + 1],
        [pai.num + 1, pai.num + 2],
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

  canPon({ pai, fromWho }: { pai: Pai; fromWho: Player }): PaiSet[] {
    const result = [];

    const paiHits = this.paiRest.filter((e) => e.fmt == pai.fmt);
    // the red pai comes first, as the red pai has the smallest id.
    paiHits.sort((a, b) => a.id - b.id);
    if (paiHits.length >= 2) {
      result.push(
        new PaiSet({
          paiCall: [pai],
          paiRest: paiHits.slice(0, 2),
          type: PaiSetType.MINKO,
          fromWho,
        }),
      );
    }

    if (paiHits.length >= 3 && paiHits.some((e) => e.isAka())) {
      result.push(
        new PaiSet({
          paiCall: [pai],
          paiRest: paiHits.slice(1, 3),
          type: PaiSetType.MINKO,
          fromWho,
        }),
      );
    }

    return result;
  }

  canMinkan({ pai, fromWho }: { pai: Pai; fromWho: Player }): PaiSet[] {
    const result = [];
    const paiHits = this.paiRest.filter((e) => e.fmt == pai.fmt);

    if (paiHits.length >= 3) {
      result.push(
        new PaiSet({
          paiRest: paiHits,
          paiCall: [pai],
          type: PaiSetType.MINKAN,
          fromWho,
        }),
      );
    }
    return result;
  }

  canAnkan(): PaiSet[] {
    const result = [];

    const paiAll = [...this.paiRest, ...(this.paiTsumo ? [this.paiTsumo] : [])];
    const counts: { [key: string]: Pai[] } = {};
    for (const pai of paiAll) {
      if (!counts[pai.fmt]) {
        counts[pai.fmt] = [];
      }
      counts[pai.fmt].push(pai);
    }

    for (const [key, value] of Object.entries(counts)) {
      if (value.length >= 4) {
        // リーチ後に待ちの変わる暗槓は出来ない
        const set = new PaiSet({
          paiRest: value.slice(0, 4),
          type: PaiSetType.ANKAN,
        });
        if (this.isRichi) {
          const before = this.machi().map((e) => e.fmt).join(",");
          const copyUser = new User({ ...this });
          copyUser.paiRest = paiAll.filter((e) => e.fmt !== key);
          copyUser.paiSets = [...this.paiSets, set];
          const after = copyUser.machi().map((e) => e.fmt).join(",");
          if (before !== after) {
            continue;
          }
        }
        result.push(set);
      }
    }

    return result;
  }

  canKakan(): PaiSet[] {
    if (this.paiTsumo === undefined) {
      return [];
    }

    const result = [];
    const paiAll = [...this.paiRest, this.paiTsumo];

    for (const set of this.paiSets) {
      if (set.type !== PaiSetType.MINKO) {
        continue;
      }

      for (const pai of paiAll) {
        if (pai.fmt !== set.paiCall[0].fmt) {
          continue;
        }
        result.push(
          new PaiSet({
            paiCall: [...set.paiCall, pai],
            paiRest: set.paiRest,
            type: PaiSetType.KAKAN,
          }),
        );
      }
    }

    return result;
  }

  canRichi(): Pai[] {
    if (!this.paiTsumo) {
      return [];
    }
    if (this.paiSets.some((e) => e.isOpen())) {
      return [];
    }
    if (this.point < 1000) {
      return [];
    }
    if (this.isRichi) {
      return [];
    }

    const result = [];
    const paiAll = [...this.paiRest, ...(this.paiTsumo ? [this.paiTsumo] : [])];
    for (const [idx, pai] of paiAll.entries()) {
      const paiRest = [...paiAll];
      paiRest.splice(idx, 1);
      const x = new Shanten({
        paiRest: paiRest,
        paiSets: this.paiSets,
      }).count();
      if (x != 0) {
        continue;
      }
      result.push(pai);
    }
    return result;
  }
}
