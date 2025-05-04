import { Pai, PaiAllKind, PaiSet, PaiSetType, Player, Shanten, ShantenInput } from "@k-jun/mahjong";

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

  reset(): void {
    this.paiRest = [];
    this.paiSets = [];
    this.paiKawa = [];
    this.paiCalled = [];
    this.paiTsumo = undefined;
    this.isRichi = false;
    this.isDabururichi = false;
    this.isIppatsu = false;
    this.isCalled = false;
    this.isAfterKakan = false;
    this.isAfterRichi = false;
    this.isOpen = false;
    this.countKans = [];
  }

  get pais(): Pai[] {
    const pais = [...this.paiRest];
    if (this.paiTsumo !== undefined) {
      pais.push(this.paiTsumo);
    }
    return pais;
  }

  validate(input: "dahai" | "naki", params: { pai?: Pai; set?: PaiSet }): boolean {
    switch (input) {
      case "dahai": {
        if (params.pai === undefined) {
          return false;
        }

        const target = params.pai;
        const tedashi = this.paiRest.some((e) => e.id === target.id);
        if ((this.isRichi || this.isDabururichi) && tedashi) {
          return false;
        }
        return this.pais.map((e) => e.id).includes(target.id);
      }
      case "naki": {
        if (params.set === undefined) {
          return false;
        }
        let candidate: PaiSet[] = [];
        switch (params.set.type) {
          case PaiSetType.ANKAN: {
            candidate = this.canAnkan();
            break;
          }
          case PaiSetType.KAKAN: {
            candidate = this.canKakan();
            break;
          }
          case PaiSetType.MINKAN: {
            candidate = this.canMinkan({ pai: params.set.paiCall[0], fromWho: params.set.fromWho });
            break;
          }
          case PaiSetType.MINSHUN: {
            candidate = this.canChi({ pai: params.set.paiCall[0] });
            break;
          }
          case PaiSetType.MINKO: {
            candidate = this.canPon({ pai: params.set.paiCall[0], fromWho: params.set.fromWho });
            break;
          }
        }

        const isEqual = (e: PaiSet): boolean => {
          if (e.type !== params.set!.type) {
            return false;
          }
          if (e.fromWho !== params.set!.fromWho) {
            return false;
          }
          return e.pais.map((e) => e.fmt).join(",") === params.set!.pais.map((e) => e.fmt).join(",");
        };
        return candidate.some((e) => isEqual(e));
      }
    }
  }

  dahai({ pai }: { pai: Pai }): boolean {
    if (!this.validate("dahai", { pai })) {
      return false;
    }

    if (this.paiTsumo !== undefined) {
      this.paiRest.push(this.paiTsumo);
    }
    this.paiTsumo = undefined;
    const idx = this.paiRest.findIndex((e) => e.id === pai.id);
    this.paiKawa.push(...this.paiRest.splice(idx, 1));

    if (!this.isRichi && !this.isDabururichi && this.isFuriten) {
      this.isFuriten = false;
    }

    return true;
  }

  naki({ set }: { set: PaiSet }): boolean {
    if (!this.validate("naki", { set })) {
      return false;
    }

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
          const isMinko = e.type === PaiSetType.MINKO;
          const isSame = e.pais[0].fmt === set.pais[0].fmt;
          return !(isMinko && isSame);
        });
        break;
      }
    }
    const filterIds = new Set(set.pais.map((e) => e.id));
    this.paiRest = this.paiRest.filter((e) => !filterIds.has(e.id));
    this.paiSets.push(set);
    return true;
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
    if (this.paiTsumo === undefined) {
      return [];
    }

    const result = [];
    const paiAll = [...this.paiRest, this.paiTsumo];
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
        if (this.isRichi || this.isDabururichi) {
          const before = this.machi().map((e) => e.fmt).join(",");
          const copyUser = new MahjongUser({ ...this });
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
            paiCall: set.paiCall,
            paiRest: [pai, ...set.paiRest],
            type: PaiSetType.KAKAN,
            fromWho: set.fromWho,
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
    if (this.isRichi || this.isDabururichi) {
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
    return this.paiKawa.every((p) => p.isYaochuHai()) && this.isCalled === false;
  }

  isKyushukyuhai(): boolean {
    const set = new Set<string>();
    const paiAll = [...this.paiRest, ...(this.paiTsumo ? [this.paiTsumo] : [])];
    for (const pai of paiAll) {
      if (pai.isYaochuHai()) {
        set.add(pai.fmt);
      }
    }
    return set.size >= 9;
  }
}
