import { MahjongUser } from "./new_mahjong_user.ts";
import { expect } from "jsr:@std/expect";
import { Pai, PaiSet, PaiSetType, Player } from "@k-jun/mahjong";

Deno.test("MahjongUser initialization", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });
  expect(user.id).toBe("test-user");
  expect(user.paiRest).toEqual([]);
  expect(user.paiSets).toEqual([]);
  expect(user.paiKawa).toEqual([]);
  expect(user.paiTsumo).toBeUndefined();
  expect(user.point).toBe(25000);
  expect(user.paiJikaze).toEqual(new Pai("z1"));
  expect(user.isRichi).toBe(false);
  expect(user.isDabururichi).toBe(false);
  expect(user.isIppatsu).toBe(false);
  expect(user.isRinshankaiho).toBe(false);
  expect(user.isAfterKakan).toBe(false);
  expect(user.isAfterRichi).toBe(false);
  expect(user.countMinkanKakan).toBe(0);
  expect(user.isFuriten).toBe(false);
});

Deno.test("MahjongUser get pais", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });
  const pai1 = new Pai(0);
  const pai2 = new Pai(1);

  user.paiRest = [pai1];
  expect(user.pais).toEqual([pai1]);

  user.paiTsumo = pai2;
  expect(user.pais).toEqual([pai1, pai2]);
});

Deno.test("MahjongUser validate dahai", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });
  const pai1 = new Pai(0);
  const pai2 = new Pai(1);

  // No tsumo pai
  expect(user.validate("dahai", { pai: pai1 })).toBe(false);

  // With tsumo pai
  user.paiTsumo = pai1;
  expect(user.validate("dahai", { pai: pai2 })).toBe(false);

  user.paiRest = [pai2];
  expect(user.validate("dahai", { pai: pai2 })).toBe(true);

  // Richi with tedashi
  user.isRichi = true;
  user.paiRest = [pai2];
  expect(user.validate("dahai", { pai: pai2 })).toBe(false);
  expect(user.validate("dahai", { pai: pai1 })).toBe(true);
});

Deno.test("MahjongUser validate naki ankan", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });
  user.paiRest = [new Pai(1), new Pai(2), new Pai(3)];
  user.paiTsumo = new Pai(0);

  const set = new PaiSet({
    type: PaiSetType.ANKAN,
    paiRest: [new Pai(1), new Pai(2), new Pai(3), new Pai(0)],
  });
  expect(user.validate("naki", { set })).toBe(true);

  const set2 = new PaiSet({
    type: PaiSetType.ANKAN,
    paiRest: [new Pai(1), new Pai(3), new Pai(2), new Pai(0)],
  });
  expect(user.validate("naki", { set: set2 })).toBe(false);
});

Deno.test("MahjongUser validate naki ankan2", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });
  user.paiRest = [
    new Pai("p2"),
    new Pai("p2"),
    new Pai("p2"),
    new Pai("p3"),
    new Pai("p4"),
    new Pai("p5"),
    new Pai("p6"),
    new Pai("m4"),
    new Pai("m5"),
    new Pai("m6"),
    new Pai("s4"),
    new Pai("s5"),
    new Pai("s6"),
  ];
  user.isRichi = true;
  user.paiTsumo = new Pai("p2");
  const results = user.canAnkan();
  expect(results.length).toBe(0);
});

Deno.test("MahjongUser validate naki kakan", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Add a minko set that can be kakan
  const minkoSet = new PaiSet({
    type: PaiSetType.MINKO,
    paiRest: [new Pai(0), new Pai(1)],
    paiCall: [new Pai(2)],
    fromWho: Player.TOIMEN,
  });
  user.paiSets.push(minkoSet);
  user.paiTsumo = new Pai(3);

  const set = new PaiSet({
    type: PaiSetType.KAKAN,
    paiRest: [new Pai(0), new Pai(1)],
    paiCall: [new Pai(2), new Pai(3)],
    fromWho: Player.TOIMEN,
  });
  expect(user.validate("naki", { set })).toBe(true);

  // Invalid kakan - wrong pai
  const set2 = new PaiSet({
    type: PaiSetType.KAKAN,
    paiRest: [new Pai(0), new Pai(1)],
    paiCall: [new Pai(3), new Pai(2)],
    fromWho: Player.TOIMEN,
  });
  expect(user.validate("naki", { set: set2 })).toBe(false);
});

Deno.test("MahjongUser validate naki minkan", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Add a minko set that can be minkan
  user.paiRest = [new Pai(0), new Pai(1), new Pai(3)];
  const set = new PaiSet({
    type: PaiSetType.MINKAN,
    paiRest: [new Pai(0), new Pai(1), new Pai(3)],
    paiCall: [new Pai(2)],
  });
  expect(user.validate("naki", { set })).toBe(true);

  user.paiRest = [new Pai(0), new Pai(1), new Pai(3)];
  const set2 = new PaiSet({
    type: PaiSetType.MINKAN,
    paiRest: [new Pai(0), new Pai(1), new Pai(2)],
    paiCall: [new Pai(3)],
  });
  expect(user.validate("naki", { set: set2 })).toBe(false);
});

Deno.test("MahjongUser validate naki minshun", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Add pais that can form a minshun
  user.paiRest = [new Pai(0), new Pai(4)]; // 1m, 2m
  const set = new PaiSet({
    type: PaiSetType.MINSHUN,
    paiRest: [new Pai(0), new Pai(4)],
    paiCall: [new Pai(8)], // 3m
    fromWho: Player.KAMICHA,
  });
  expect(user.validate("naki", { set })).toBe(true);

  user.paiRest = [new Pai(0), new Pai(1)]; // 1m, 2m
  const set2 = new PaiSet({
    type: PaiSetType.MINSHUN,
    paiRest: [new Pai(0), new Pai(1)],
    paiCall: [new Pai(2)], // 3m
  });
  expect(user.validate("naki", { set: set2 })).toBe(false);
});

Deno.test("MahjongUser validate naki minko", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Add pais that can form a minko
  user.paiRest = [new Pai(0), new Pai(1)];
  const set = new PaiSet({
    type: PaiSetType.MINKO,
    paiRest: [new Pai(0), new Pai(1)],
    paiCall: [new Pai(2)],
  });
  expect(user.validate("naki", { set })).toBe(true);

  user.paiRest = [new Pai(0), new Pai(1)];
  const set2 = new PaiSet({
    type: PaiSetType.MINKO,
    paiRest: [new Pai(0), new Pai(3)],
    paiCall: [new Pai(1)],
  });
  expect(user.validate("naki", { set: set2 })).toBe(false);
});

Deno.test("MahjongUser canChi", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Test case 1: Valid chi combinations with manzu
  user.paiRest = [new Pai("m3"), new Pai("m4"), new Pai("m6"), new Pai("m7")];
  const chiPai1 = new Pai("m5");
  const results1 = user.canChi({ pai: chiPai1 });
  expect(results1.length).toBe(3);
  expect(results1[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m4"]);
  expect(results1[0].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
  expect(results1[1].paiRest.map((p) => p.fmt)).toEqual(["m4", "m6"]);
  expect(results1[1].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
  expect(results1[2].paiRest.map((p) => p.fmt)).toEqual(["m6", "m7"]);
  expect(results1[2].paiCall.map((p) => p.fmt)).toEqual(["m5"]);

  // // Test case 2: No valid chi combinations with jihai
  user.paiRest = [new Pai("z1"), new Pai("z2")];
  const chiPai2 = new Pai("z3");
  const results2 = user.canChi({ pai: chiPai2 });
  expect(results2.length).toBe(0);

  // Test case 3: Valid chi combinations with pinzu and red five
  user.paiRest = [new Pai("p4"), new Pai(53), new Pai(52)]; // p4, normal 5p, red 5p
  const chiPai3 = new Pai("p6");
  const results3 = user.canChi({ pai: chiPai3 });
  expect(results3.length).toBe(2);
  expect(results3[0].paiRest.map((p) => p.id)).toEqual([48, 52]);
  expect(results3[0].paiCall.map((p) => p.fmt)).toEqual(["p6"]);
  expect(results3[1].paiRest.map((p) => p.id)).toEqual([48, 53]);
  expect(results3[1].paiCall.map((p) => p.fmt)).toEqual(["p6"]);

  // // Test case 4: No valid chi combinations with non-consecutive numbers
  user.paiRest = [new Pai("s1"), new Pai("s3"), new Pai("s7")];
  const chiPai4 = new Pai("s4");
  const results4 = user.canChi({ pai: chiPai4 });
  expect(results4.length).toBe(0);
});

Deno.test("MahjongUser canPon", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Test case 1: Valid pon with manzu
  user.paiRest = [new Pai("m3"), new Pai("m3"), new Pai("m4")];
  const ponPai1 = new Pai("m3");
  const results1 = user.canPon({ pai: ponPai1, fromWho: Player.TOIMEN });
  expect(results1.length).toBe(1);
  expect(results1[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m3"]);
  expect(results1[0].paiCall.map((p) => p.fmt)).toEqual(["m3"]);
  expect(results1[0].fromWho).toBe(Player.TOIMEN);

  // Test case 2: Valid pon with red five
  user.paiRest = [new Pai(52), new Pai(53), new Pai("p4")]; // red 5p, normal 5p, p4
  const ponPai2 = new Pai(52); // red 5p
  const results2 = user.canPon({ pai: ponPai2, fromWho: Player.KAMICHA });
  expect(results2.length).toBe(1);
  expect(results2[0].paiRest.map((p) => p.id)).toEqual([52, 53]);
  expect(results2[0].paiCall.map((p) => p.id)).toEqual([52]);
  expect(results2[0].fromWho).toBe(Player.KAMICHA);

  // Test case 3: No valid pon with insufficient tiles
  user.paiRest = [new Pai("s1"), new Pai("s1"), new Pai("s2")];
  const ponPai3 = new Pai("s3");
  const results3 = user.canPon({ pai: ponPai3, fromWho: Player.SHIMOCHA });
  expect(results3.length).toBe(0);

  // Test case 4: Valid pon with honor tiles
  user.paiRest = [new Pai("z1"), new Pai("z1"), new Pai("z2")];
  const ponPai4 = new Pai("z1");
  const results4 = user.canPon({ pai: ponPai4, fromWho: Player.TOIMEN });
  expect(results4.length).toBe(1);
  expect(results4[0].paiRest.map((p) => p.fmt)).toEqual(["z1", "z1"]);
  expect(results4[0].paiCall.map((p) => p.fmt)).toEqual(["z1"]);
  expect(results4[0].fromWho).toBe(Player.TOIMEN);
});

Deno.test("MahjongUser canMinkan", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Test case 1: Valid minkan with manzu
  user.paiRest = [new Pai("m3"), new Pai("m3"), new Pai("m3"), new Pai("m4")];
  const minkanPai1 = new Pai("m3");
  const results1 = user.canMinkan({ pai: minkanPai1, fromWho: Player.TOIMEN });
  expect(results1.length).toBe(1);
  expect(results1[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m3", "m3"]);
  expect(results1[0].paiCall.map((p) => p.fmt)).toEqual(["m3"]);
  expect(results1[0].fromWho).toBe(Player.TOIMEN);

  // Test case 2: Valid minkan with red five
  user.paiRest = [new Pai(52), new Pai(52), new Pai(53), new Pai("p4")]; // red 5p, red 5p, normal 5p, p4
  const minkanPai2 = new Pai(52); // red 5p
  const results2 = user.canMinkan({ pai: minkanPai2, fromWho: Player.KAMICHA });
  expect(results2.length).toBe(1);
  expect(results2[0].paiRest.map((p) => p.id)).toEqual([52, 52, 53]);
  expect(results2[0].paiCall.map((p) => p.id)).toEqual([52]);
  expect(results2[0].fromWho).toBe(Player.KAMICHA);

  // Test case 3: No valid minkan with insufficient tiles
  user.paiRest = [new Pai("s1"), new Pai("s1"), new Pai("s1"), new Pai("s2")];
  const minkanPai3 = new Pai("s3");
  const results3 = user.canMinkan({ pai: minkanPai3, fromWho: Player.SHIMOCHA });
  expect(results3.length).toBe(0);

  // Test case 4: Valid minkan with honor tiles
  user.paiRest = [new Pai("z1"), new Pai("z1"), new Pai("z1"), new Pai("z2")];
  const minkanPai4 = new Pai("z1");
  const results4 = user.canMinkan({ pai: minkanPai4, fromWho: Player.TOIMEN });
  expect(results4.length).toBe(1);
  expect(results4[0].paiRest.map((p) => p.fmt)).toEqual(["z1", "z1", "z1"]);
  expect(results4[0].paiCall.map((p) => p.fmt)).toEqual(["z1"]);
  expect(results4[0].fromWho).toBe(Player.TOIMEN);
});

Deno.test("MahjongUser canAnkan", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Test case 1: Valid ankan with manzu
  user.paiTsumo = new Pai("z7");
  user.paiRest = [new Pai("m3"), new Pai("m3"), new Pai("m3"), new Pai("m3")];
  const results1 = user.canAnkan();
  expect(results1.length).toBe(1);
  expect(results1[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m3", "m3", "m3"]);
  expect(results1[0].paiCall).toEqual([]);
  expect(results1[0].fromWho).toBe(Player.JICHA);

  // Test case 2: Valid ankan with red five
  user.paiRest = [new Pai(52), new Pai(52), new Pai(52), new Pai(52)]; // red 5p
  const results2 = user.canAnkan();
  expect(results2.length).toBe(1);
  expect(results2[0].paiRest.map((p) => p.id)).toEqual([52, 52, 52, 52]);
  expect(results2[0].paiCall).toEqual([]);
  expect(results2[0].fromWho).toBe(Player.JICHA);

  // Test case 3: No valid ankan with insufficient tiles
  user.paiRest = [new Pai("s1"), new Pai("s1"), new Pai("s1"), new Pai("s2")];
  const results3 = user.canAnkan();
  expect(results3.length).toBe(0);

  // Test case 4: Valid ankan with honor tiles
  user.paiRest = [new Pai("z1"), new Pai("z1"), new Pai("z1"), new Pai("z1")];
  const results4 = user.canAnkan();
  expect(results4.length).toBe(1);
  expect(results4[0].paiRest.map((p) => p.fmt)).toEqual(["z1", "z1", "z1", "z1"]);
  expect(results4[0].paiCall).toEqual([]);
  expect(results4[0].fromWho).toBe(Player.JICHA);

  // Test case 5: Multiple valid ankans
  user.paiRest = [
    new Pai("m3"),
    new Pai("m3"),
    new Pai("m3"),
    new Pai("m3"),
    new Pai("z1"),
    new Pai("z1"),
    new Pai("z1"),
    new Pai("z1"),
  ];
  const results5 = user.canAnkan();
  expect(results5.length).toBe(2);
  expect(results5[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m3", "m3", "m3"]);
  expect(results5[1].paiRest.map((p) => p.fmt)).toEqual(["z1", "z1", "z1", "z1"]);
});

Deno.test("MahjongUser canKakan", () => {
  const user = new MahjongUser({
    id: "test-user",
    point: 25000,
  });

  // Test case 1: Valid kakan with manzu
  user.paiTsumo = new Pai("m7");
  user.paiRest = [new Pai(3)];
  user.paiSets = [
    new PaiSet({
      paiCall: [new Pai(0)],
      paiRest: [new Pai(1), new Pai(2)],
      type: PaiSetType.MINKO,
    }),
  ];
  const results1 = user.canKakan();
  expect(results1.length).toBe(1);
  expect(results1[0].paiRest.map((p) => p.id)).toEqual([3, 1, 2]);
  expect(results1[0].paiCall.map((p) => p.id)).toEqual([0]);
  expect(results1[0].fromWho).toBe(Player.JICHA);

  // Test case 2: No valid kakan with insufficient tiles
  user.paiRest = [new Pai("s2")];
  user.paiSets = [
    new PaiSet({
      paiCall: [new Pai("s1")],
      paiRest: [new Pai("s1"), new Pai("s1")],
      type: PaiSetType.MINKO,
    }),
  ];
  const results3 = user.canKakan();
  expect(results3.length).toBe(0);
});

Deno.test("should return valid richi candidates", async (t) => {
  await t.step("should return empty array when no tsumo pai", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("m4"),
      new Pai("m5"),
      new Pai("m6"),
      new Pai("m7"),
      new Pai("m8"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m9"),
    ];
    const results = user.canRichi();
    expect(results.length).toBe(0);
  });

  await t.step("should return empty array when hand is not closed", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("m4"),
      new Pai("m5"),
      new Pai("m6"),
      new Pai("m7"),
      new Pai("m8"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m9"),
    ];
    user.paiTsumo = new Pai("m1");
    user.paiSets = [
      new PaiSet({
        paiCall: [new Pai("p1"), new Pai("p1"), new Pai("p1")],
        paiRest: [],
        type: PaiSetType.MINKO,
      }),
    ];
    const results = user.canRichi();
    expect(results.length).toBe(0);
  });

  await t.step("should return empty array when point is less than 1000", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 500,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("m4"),
      new Pai("m5"),
      new Pai("m6"),
      new Pai("m7"),
      new Pai("m8"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m9"),
    ];
    user.paiTsumo = new Pai("m1");
    const results = user.canRichi();
    expect(results.length).toBe(0);
  });

  await t.step("should return valid richi candidates when tenpai", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("m4"),
      new Pai("m5"),
      new Pai("m6"),
      new Pai("m7"),
      new Pai("m8"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m9"),
    ];
    user.paiTsumo = new Pai("m1");
    const results = user.canRichi();
    expect(results.length).toBe(14);
    expect(results[0].fmt).toBe("m1");
  });

  await t.step(
    "should return valid richi candidates when tenpai with 4 pairs",
    () => {
      const user = new MahjongUser({
        id: "test-user",
        point: 25000,
      });
      user.paiRest = [
        new Pai("s4"),
        new Pai("s5"),
        new Pai("s5"),
        new Pai("s5"),
        new Pai("s5"),
        new Pai("s9"),
        new Pai("s9"),
        new Pai("s9"),
        new Pai("s9"),
        new Pai("z4"),
        new Pai("z4"),
        new Pai("z4"),
        new Pai("z4"),
      ];
      user.paiTsumo = new Pai("s3");
      const results = user.canRichi();
      expect(results.length).toBe(8);
      expect(results[0].fmt).toBe("s9");
    },
  );
});

Deno.test("should return valid machi candidates", async (t) => {
  await t.step("should return richi candidates", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("m4"),
      new Pai("m5"),
      new Pai("m6"),
      new Pai("m7"),
      new Pai("m8"),
      new Pai("m9"),
      new Pai("p1"),
      new Pai("p2"),
      new Pai("p3"),
      new Pai("p4"),
    ];
    const results = user.machi();
    expect(results.length).toBe(2);
    expect(results.map((p) => p.fmt)).toEqual(["p1", "p4"]);
  });

  await t.step("should return valid machi candidates for 九蓮宝燈", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("m4"),
      new Pai("m5"),
      new Pai("m6"),
      new Pai("m7"),
      new Pai("m8"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m9"),
    ];
    user.paiTsumo = new Pai("m1");
    const results = user.machi();
    expect(results.length).toBe(9);
    expect(results.map((p) => p.fmt)).toEqual(["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"]);
  });

  await t.step("should return valid machi candidates for shanpon wait", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m1"),
      new Pai("z1"),
      new Pai("z1"),
      new Pai("z1"),
      new Pai("m3"),
      new Pai("m3"),
      new Pai("m3"),
      new Pai("z7"),
      new Pai("z7"),
      new Pai("z7"),
      new Pai("m6"),
      new Pai("m6"),
    ];
    user.paiTsumo = new Pai("z6");
    const results = user.machi();
    expect(results.length).toBe(2);
    expect(results.map((p) => p.fmt)).toEqual(["m1", "m6"]);
  });

  await t.step("should return valid machi candidates for tanki wait", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("s1"),
      new Pai("s2"),
      new Pai("s3"),
      new Pai("p1"),
      new Pai("p2"),
      new Pai("p3"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m6"),
    ];
    const results = user.machi();
    expect(results.length).toBe(1);
    expect(results[0].fmt).toBe("m6");
  });

  await t.step("should return valid machi candidates for kanchan wait", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("s1"),
      new Pai("s2"),
      new Pai("s3"),
      new Pai("p1"),
      new Pai("p2"),
      new Pai("p3"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("m4"),
      new Pai("m6"),
    ];
    user.paiTsumo = new Pai("m5");
    const results = user.machi();
    expect(results.length).toBe(1);
    expect(results[0].fmt).toBe("m5");
  });

  await t.step("should return valid machi candidates for penchan wait", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiRest = [
      new Pai("m1"),
      new Pai("m2"),
      new Pai("m3"),
      new Pai("s1"),
      new Pai("s2"),
      new Pai("s3"),
      new Pai("p1"),
      new Pai("p2"),
      new Pai("p3"),
      new Pai("m9"),
      new Pai("m9"),
      new Pai("p9"),
      new Pai("p8"),
    ];
    const results = user.machi();
    expect(results.length).toBe(1);
    expect(results[0].fmt).toBe("p7");
  });
});

Deno.test("MahjongUser isNagashimangan", async (t) => {
  await t.step("should return true when all discarded tiles are yaochu and no calls", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiKawa = [
      new Pai("m1"),
      new Pai("m9"),
      new Pai("s1"),
      new Pai("s9"),
      new Pai("p1"),
      new Pai("p9"),
      new Pai("z1"),
      new Pai("z2"),
      new Pai("z3"),
      new Pai("z4"),
      new Pai("z5"),
      new Pai("z6"),
      new Pai("z7"),
    ];
    user.isCalled = false;
    expect(user.isNagashimangan()).toBe(true);
  });

  await t.step("should return false when there are non-yaochu tiles in discard", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiKawa = [
      new Pai("m1"),
      new Pai("m2"), // non-yaochu tile
      new Pai("s1"),
      new Pai("s9"),
      new Pai("p1"),
      new Pai("p9"),
      new Pai("z1"),
      new Pai("z2"),
      new Pai("z3"),
      new Pai("z4"),
      new Pai("z5"),
      new Pai("z6"),
      new Pai("z7"),
    ];
    user.isCalled = false;
    expect(user.isNagashimangan()).toBe(false);
  });

  await t.step("should return false when player has made calls", () => {
    const user = new MahjongUser({
      id: "test-user",
      point: 25000,
    });
    user.paiKawa = [
      new Pai("m1"),
      new Pai("m9"),
      new Pai("s1"),
      new Pai("s9"),
      new Pai("p1"),
      new Pai("p9"),
      new Pai("z1"),
      new Pai("z2"),
      new Pai("z3"),
      new Pai("z4"),
      new Pai("z5"),
      new Pai("z6"),
      new Pai("z7"),
    ];
    user.isCalled = true;
    expect(user.isNagashimangan()).toBe(false);
  });
});
