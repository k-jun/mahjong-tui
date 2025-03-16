// @deno-types="npm:@types/jsdom@21.1.7"
import { JSDOM } from "npm:jsdom@26.0.0";
import { Pai, PaiSet, PaiSetType } from "@k-jun/mahjong";
import { yakus as constantYakus } from "./constants.ts";
import { YamaGenerator } from "./seed.ts";

type inputParams = {
  init?: {
    yama: Pai[];
    kyoku: number;
    honba: number;
    kyotk: number;
    dora: number;
    ten: number[];
    oya: number;
    hai0: Pai[];
    hai1: Pai[];
    hai2: Pai[];
    hai3: Pai[];
  };
  tsumo?: {
    who: number;
    hai: Pai;
  };
  dahai?: {
    who: number;
    hai: Pai;
  };
  naki?: {
    who: number;
    set: PaiSet;
  };
  dora?: {
    hai: Pai;
  };
  richi?: {
    who: number;
    step: number;
    ten: number[];
  };
  ryukyoku?: {
    ba: string;
    score: number[];
    type: string;
    owari?: number[];
  };
  agari?: {
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
    who: number;
    fromWho: number;
    fu: number;
    ten: number;
    ba: string;
    owari?: number[];
    score: number[];
    yakus: { str: string; val: number; yakuman: boolean }[];
    paiBakaze: Pai;
    paiJikaze: Pai;
    paiDora: Pai[];
    paiDoraUra: Pai[];
    paiRest: Pai[];
    paiSets: PaiSet[];
    paiLast: Pai;
  };
};

type state = {
  enable: boolean;
  oya: number;
  kyoku: number;
  seed?: YamaGenerator;
};

export const fixtures = async (
  input: ({ name, params }: { name: string; params: inputParams }) => void,
  limit: number = 1_000_000_000,
) => {
  let cnt = 0;
  for await (const d of Deno.readDir("./fixtures/")) {
    if (!d.isDirectory) {
      continue;
    }
    for await (const f of Deno.readDir(`./fixtures/${d.name}`)) {
      if (!f.name.endsWith(".xml")) {
        continue;
      }
      const text = await Deno.readTextFile(
        `./fixtures/${d.name}/${f.name}`,
      );
      if (text == "") {
        continue;
      }
      console.log("f.name", f.name);
      const dom = new JSDOM(text, { contentType: "text/xml" });
      let state: state = {
        enable: false,
        oya: 0,
        kyoku: 0,
      };

      for (const e of dom.window.document.children[0].children) {
        if (e.tagName == "SHUFFLE") {
          const raw_seed = e.attributes.getNamedItem("seed")?.value ?? "";
          const seed = raw_seed.split(",")[1];
          state.seed = new YamaGenerator(seed);
        }
        if (e.tagName == "GO") {
          state.enable = isYonmaAriAriAka(e);
        }
        if (state.enable === false) {
          continue;
        }

        switch (e.tagName) {
          case "INIT":
            state = { ...state, ..._init(e, state, input) };
            break;
          case "N":
            _naki(e, input);
            break;
          case "DORA":
            _dora(e, input);
            break;
          case "REACH":
            _richi(e, input);
            break;
          case "AGARI":
            cnt += 1;
            _agari(e, state, input);
            break;
          case "RYUUKYOKU":
            cnt += 1;
            _ryukyoku(e, input);
            break;
          default:
            if (
              /^[TUVW](\d{1,3})$/.test(e.tagName) &&
              Number(e.tagName.slice(1)) <= 135
            ) {
              _tsumo(e, input);
            }
            if (
              /^[DEFG](\d{1,3})$/.test(e.tagName) &&
              Number(e.tagName.slice(1)) <= 135
            ) {
              _dahai(e, input);
            }
            break;
        }
        if (cnt >= limit) {
          break;
        }
      }
      if (cnt >= limit) {
        break;
      }
    }
    if (cnt >= limit) {
      break;
    }
  }
};

const isYonmaAriAriAka = (e: Element): boolean => {
  const typ = Number(e.attributes.getNamedItem("type")?.value);
  if (
    // 赤ドラ
    Boolean(typ & (1 << 1)) ||
    // 喰いタン、後付け
    Boolean(typ & (1 << 2)) ||
    // 四麻
    Boolean(typ & (1 << 4))
  ) {
    return false;
  }
  return true;
};

const _init = (
  e: Element,
  s: state,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
): { oya: number; kyoku: number } => {
  const seeds = e.attributes.getNamedItem("seed")!.value.split(",");
  input({
    name: "INIT",
    params: {
      init: {
        yama: (s.seed!.generate() ?? []).map((e) => new Pai(e)),
        kyoku: Number(seeds[0]),
        honba: Number(seeds[1]),
        kyotk: Number(seeds[2]),
        dora: Number(seeds[5]),
        oya: Number(e.attributes.getNamedItem("oya")!.value),
        ten: e.attributes.getNamedItem("ten")!.value.split(",").map(Number),
        hai0: e.attributes.getNamedItem("hai0")!.value.split(",").map(Number)
          .map((e) => new Pai(e)),
        hai1: e.attributes.getNamedItem("hai1")!.value.split(",").map(Number)
          .map((e) => new Pai(e)),
        hai2: e.attributes.getNamedItem("hai2")!.value.split(",").map(Number)
          .map((e) => new Pai(e)),
        hai3: e.attributes.getNamedItem("hai3")!.value.split(",").map(Number)
          .map((e) => new Pai(e)),
      },
    },
  });

  return {
    kyoku: Number(seeds[0]),
    oya: Number(e.attributes.getNamedItem("oya")!.value),
  };
};

const _tsumo = (
  e: Element,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  const who = ["T", "U", "V", "W"].findIndex((x) => x == e.tagName[0]);
  input({
    name: "TSUMO",
    params: {
      tsumo: { who, hai: new Pai(Number(e.tagName.slice(1))) },
    },
  });
};

const _dahai = (
  e: Element,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  const who = ["D", "E", "F", "G"].findIndex((x) => x == e.tagName[0]);
  input({
    name: "DAHAI",
    params: {
      dahai: { who, hai: new Pai(Number(e.tagName.slice(1))) },
    },
  });
};

const _naki = (
  e: Element,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  const who = e.attributes.getNamedItem("who")!.value;
  input({
    name: "NAKI",
    params: {
      naki: {
        who: Number(who),
        set: _parseM(Number(e.attributes.getNamedItem("m")!.value)),
      },
    },
  });
};

const _dora = (
  e: Element,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  input({
    name: "DORA",
    params: {
      dora: { hai: new Pai(Number(e.attributes.getNamedItem("hai")!.value)) },
    },
  });
};

const _richi = (
  e: Element,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  const who = Number(e.attributes.getNamedItem("who")!.value);
  const step = Number(e.attributes.getNamedItem("step")!.value);
  const ten =
    e.attributes.getNamedItem("ten")?.value.split(",").map((e) =>
      Number(e) * 100
    ) ?? [];
  input({
    name: "RICHI",
    params: {
      richi: { who, step, ten },
    },
  });
};

const _agari = (
  e: Element,
  s: state,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  const attrs = new Map<string, string>();
  for (let i = 0; i < e.attributes.length; i++) {
    const attr = e.attributes[i];
    attrs.set(attr.name, attr.value);
  }
  const kazes = [
    new Pai(4 * 3 * 9), // 東
    new Pai(4 * 3 * 9 + 4), // 南
    new Pai(4 * 3 * 9 + 8), // 西
    new Pai(4 * 3 * 9 + 12), // 北
  ];
  const paiBakaze = kazes[Math.floor(s.kyoku / 4)];
  const paiJikaze = kazes[(Number(attrs.get("who")) - (s.kyoku % 4) + 4) % 4];

  // const paiDora =
  //   attrs.get("doraHai")?.split(",").map((e) => new Pai(Number(e)).next()) ??
  //     [];
  const paiDora =
    attrs.get("doraHai")?.split(",").map((e) => new Pai(Number(e))) ?? [];

  const paiDoraUra: Pai[] = [];
  if (attrs.get("doraHaiUra")) {
    // attrs.get("doraHaiUra")?.split(",").forEach((e) => {
    //   paiDoraUra.push(new Pai(Number(e)).next());
    // });
    attrs.get("doraHaiUra")?.split(",").forEach((e) => {
      paiDoraUra.push(new Pai(Number(e)));
    });
  }
  const yakus: { str: string; val: number; yakuman: boolean }[] = [];
  if (attrs.get("yaku")) {
    const a = attrs.get("yaku")?.split(",") ?? [];
    for (let i = 0; i < a.length; i += 2) {
      yakus.push({
        str: constantYakus[Number(a[i])],
        val: Number(a[i + 1]),
        yakuman: false,
      });
    }
  }

  if (attrs.get("yakuman")) {
    attrs.get("yakuman")?.split(",").forEach((e) => {
      const str = constantYakus[Number(e)];
      const val = 1;
      // 天鳳は単一の役満でのダブル役満を採用していない。
      // if (
      //   ["四暗刻単騎", "純正九蓮宝燈", "国士無双１３面", "大四喜"].includes(str)
      // ) {
      //   val = 2;
      // }
      yakus.push({ str, val, yakuman: true });
    });
  }

  const isTsumo = attrs.get("who") == attrs.get("fromWho");
  const isIppatsu = yakus.some((e) => e.str == "一発");
  const isRichi = yakus.some((e) => e.str == "立直");
  const isDabururichi = yakus.some((e) => e.str == "両立直");
  const isHaitei = yakus.some((e) => e.str == "海底摸月");
  const isHoutei = yakus.some((e) => e.str == "河底撈魚");
  const isChankan = yakus.some((e) => e.str == "槍槓");
  const isRinshankaiho = yakus.some((e) => e.str == "嶺上開花");
  const isChiho = yakus.some((e) => e.str == "地和");
  const isTenho = yakus.some((e) => e.str == "天和");
  const isOya = s.oya == Number(attrs.get("who"));

  const fu = Number(attrs.get("ten")?.split(",")[0]);
  const ten = Number(attrs.get("ten")?.split(",")[1]);
  const who = Number(attrs.get("who"));
  const sc = attrs.get("sc")?.split(",").map(Number) ?? [];
  const ba = attrs.get("ba") ?? "";
  const owari = e.attributes.getNamedItem("owari")?.value.split(",").map(
    Number,
  );
  const score = [];
  for (let i = 0; i < sc.length; i += 2) {
    const bfr = sc[i] * 100;
    const nxt = bfr + sc[i + 1] * 100;
    score.push(nxt);
  }
  const fromWho = Number(attrs.get("fromWho"));
  const paiSets: PaiSet[] = [];
  if (attrs.get("m")) {
    attrs.get("m")?.split(",").forEach((mi) => {
      paiSets.push(_parseM(Number(mi)));
    });
  }
  const paiLast = new Pai(Number(attrs.get("machi")));
  const paiRest =
    attrs.get("hai")?.split(",").map((e: string) => new Pai(Number(e))) ?? [];
  paiRest.splice(paiRest.findIndex((e) => e.id == paiLast.id), 1)[0];

  input({
    name: "AGARI",
    params: {
      agari: {
        paiBakaze,
        paiJikaze,
        paiDora,
        paiDoraUra,
        paiRest,
        paiSets,
        paiLast,
        yakus,
        fu,
        ten,
        who,
        ba,
        owari,
        score,
        fromWho,
        options: {
          isTsumo,
          isRichi,
          isDabururichi,
          isIppatsu,
          isHaitei,
          isHoutei,
          isChankan,
          isRinshankaiho,
          isChiho,
          isTenho,
          isOya,
        },
      },
    },
  });
};

const _parseM = (m: number): PaiSet => {
  const fromWho = m & 3;
  // 0: 鳴きなし、1: 下家、2: 対面、3: 上家。
  if (m & (1 << 2)) {
    // 順子
    let t = (m & 0xFC00) >> 10;
    const nakiIdx = t % 3;
    t = Math.floor(t / 3);
    t = Math.floor(t / 7) * 9 + t % 7;
    t *= 4;
    const h = [
      t + 4 * 0 + ((m & 0x0018) >> 3),
      t + 4 * 1 + ((m & 0x0060) >> 5),
      t + 4 * 2 + ((m & 0x0180) >> 7),
    ];

    const pais = h.map((e) => new Pai(e));
    const paiCall = pais.splice(nakiIdx, 1);
    const paiRest = pais;
    return new PaiSet({ type: PaiSetType.MINSHUN, paiRest, paiCall, fromWho });
  } else if (m & (1 << 3) || m & (1 << 4)) {
    // 刻子、加槓
    const extra = (m & 0x0060) >> 5;
    let t = (m & 0xFE00) >> 9;
    const nakiIdx = t % 3;
    t = Math.floor(t / 3);
    t *= 4;
    const h = [t, t, t];
    switch (extra) {
      case 0:
        h[0] += 1;
        h[1] += 2;
        h[2] += 3;
        break;
      case 1:
        h[0] += 0;
        h[1] += 2;
        h[2] += 3;
        break;
      case 2:
        h[0] += 0;
        h[1] += 1;
        h[2] += 3;
        break;
      case 3:
        h[0] += 0;
        h[1] += 1;
        h[2] += 2;
        break;
    }
    if (m & (1 << 3)) {
      // 刻子
      const pais = h.map((e) => new Pai(e));
      const paiCall = pais.splice(nakiIdx, 1);
      const paiRest = pais;
      return new PaiSet({ type: PaiSetType.MINKO, paiRest, paiCall, fromWho });
    } else {
      // 加槓
      h.unshift(t + extra);
      const pais = h.map((e) => new Pai(e));
      const paiCall = pais.splice(nakiIdx, 1);
      const paiRest = pais;
      return new PaiSet({ type: PaiSetType.KAKAN, paiRest, paiCall, fromWho });
    }
  } else {
    let hai0 = (m & 0xFF00) >> 8;
    const t = Math.floor(hai0 / 4) * 4;
    if (fromWho == 0) {
      // 暗槓
      const h = [t, t + 1, t + 2, t + 3];
      const pais = h.map((e) => new Pai(e));
      const paiCall = pais.splice(0, 1);
      const paiRest = pais;
      return new PaiSet({ type: PaiSetType.ANKAN, paiRest, paiCall, fromWho });
    } else {
      // 大明槓
      const h = [t, t, t];
      switch (hai0 % 4) {
        case 0:
          h[0] += 1;
          h[1] += 2;
          h[2] += 3;
          break;
        case 1:
          h[0] += 0;
          h[1] += 2;
          h[2] += 3;
          break;
        case 2:
          h[0] += 0;
          h[1] += 1;
          h[2] += 3;
          break;
        case 3:
          h[0] += 0;
          h[1] += 1;
          h[2] += 2;
          break;
      }
      if (fromWho == 1) {
        const a = hai0;
        hai0 = h[2];
        h[2] = a;
      }
      if (fromWho == 2) {
        const a = hai0;
        hai0 = h[0];
        h[0] = a;
      }
      h.unshift(hai0);
      const pais = h.map((e) => new Pai(e));
      const paiCall = pais.splice(0, 1);
      const paiRest = pais;
      return new PaiSet({ type: PaiSetType.MINKAN, paiRest, paiCall, fromWho });
    }
  }
};

const _ryukyoku = (
  e: Element,
  input: ({ name, params }: { name: string; params: inputParams }) => void,
) => {
  // const sc = e.attrs.get("sc")?.split(",").map(Number) ?? [];
  const ba = e.attributes.getNamedItem("ba")!.value;
  const sc = e.attributes.getNamedItem("sc")!.value.split(",").map(Number);
  const type = e.attributes.getNamedItem("type")?.value ?? "";
  const owari = e.attributes.getNamedItem("owari")?.value.split(",").map(
    Number,
  );
  const score = [];
  for (let i = 0; i < sc.length; i += 2) {
    const bfr = sc[i] * 100;
    const nxt = bfr + sc[i + 1] * 100;
    score.push(nxt);
  }
  input({
    name: "RYUKYOKU",
    params: {
      ryukyoku: {
        ba,
        score,
        type,
        owari,
      },
    },
  });
};
