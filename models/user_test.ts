import { User } from "./user.ts";
import { expect } from "jsr:@std/expect";

import { Pai, PaiSet, PaiSetType, Player } from "@k-jun/mahjong";

Deno.test("MahjongUser", async (t) => {
  await t.step("should initialize with empty arrays", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    expect(user.id).toBe("test-user");
    expect(user.paiRest).toEqual([]);
    expect(user.paiSets).toEqual([]);
    expect(user.paiKawa).toEqual([]);
    expect(user.paiTsumo).toBeUndefined();
  });

  await t.step("should set hand pais correctly", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    const pais = [new Pai(0)];

    user.setPaiRest({ pais });
    expect(user.paiRest).toEqual(pais);
  });

  await t.step("should set tsumo pai correctly", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    const tsumoPai = new Pai(0);

    user.setPaiTsumo({ pai: tsumoPai });
    expect(user.paiTsumo).toEqual(tsumoPai);
  });

  await t.step("should throw error when setting tsumo pai twice", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    const tsumoPai = new Pai(0);

    user.setPaiTsumo({ pai: tsumoPai });
    expect(() => user.setPaiTsumo({ pai: tsumoPai })).toThrow(
      "invalid this.paiTsumo when setPaiTsumo called",
    );
  });

  await t.step("should return empty array for jihai pai in canChi", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    const jihaiPai = new Pai("z1"); // East wind
    expect(user.canChi({ pai: jihaiPai })).toEqual([]);
  });

  await t.step("should return valid chi combinations", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    // Set up hand with 3-4 of manzu
    user.setPaiRest({
      pais: [
        new Pai("m3"),
        new Pai("m4"),
        new Pai("m6"),
        new Pai("m7"),
      ]
    });

    // Try to chi a 5 manzu
    const chiPai = new Pai("m5");
    const results = user.canChi({ pai: chiPai });

    expect(results.length).toBe(3);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m4"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
    expect(results[1].paiRest.map((p) => p.fmt)).toEqual(["m4", "m6"]);
    expect(results[1].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
    expect(results[2].paiRest.map((p) => p.fmt)).toEqual(["m6", "m7"]);
    expect(results[2].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
  });

  await t.step("should handle red five in chi combinations", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    // Set up hand with regular 4 and red 5 of pinzu
    user.setPaiRest({
      pais: [
        new Pai("p4"),
        new Pai(53), // normal 5 pin
        new Pai(52), // Red 5 pin
      ]
    });

    // Try to chi a 6 pinzu
    const chiPai = new Pai("p6");
    const results = user.canChi({ pai: chiPai });

    expect(results.length).toBe(2);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([48, 52]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p6"]);
    expect(results[1].paiRest.map((p) => p.id)).toEqual([48, 53]);
    expect(results[1].paiCall.map((p) => p.fmt)).toEqual(["p6"]);
  });

  await t.step("should handle chi combinations with p1", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    // Set up hand with 2-3 of pinzu
    user.setPaiRest({
      pais: [
        new Pai("p2"),
        new Pai("p3"),
      ]
    });

    // Try to chi a p1
    const chiPai = new Pai("p1");
    const results = user.canChi({ pai: chiPai });

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["p2", "p3"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p1"]);
  });

  await t.step("should handle basic pon combinations", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p4"),
      ]
    });

    const ponPai = new Pai("p3");
    const results = user.canPon({ pai: ponPai, fromWho: Player.TOIMEN });

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["p3", "p3"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p3"]);
    expect(results[0].fromWho).toBe(Player.TOIMEN);
  });

  await t.step("should handle pon with red five", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai(52), // Red 5 pin
        new Pai(53), // Normal 5 pin
        new Pai(54), // Normal 5 pin
      ]
    });

    const ponPai = new Pai("p5");
    const results = user.canPon({ pai: ponPai, fromWho: Player.SHIMOCHA });

    expect(results.length).toBe(2);
    // First combination using red 5
    expect(results[0].paiRest.map((p) => p.id)).toEqual([52, 53]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p5"]);
    // Second combination without red 5
    expect(results[1].paiRest.map((p) => p.id)).toEqual([53, 54]);
    expect(results[1].paiCall.map((p) => p.fmt)).toEqual(["p5"]);
    expect(results[0].fromWho).toBe(Player.SHIMOCHA);
  });

  await t.step("should return empty array when pon is not possible", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p4"),
        new Pai("p5"),
      ]
    });

    const ponPai = new Pai("p3");
    const results = user.canPon({ pai: ponPai, fromWho: Player.KAMICHA });

    expect(results.length).toBe(0);
  });

  await t.step("should handle basic minkan", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p3"),
      ]
    });

    const kanPai = new Pai("p3");
    const results = user.canMinkan({ pai: kanPai, fromWho: Player.TOIMEN });

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["p3", "p3", "p3"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p3"]);
    expect(results[0].type).toBe(PaiSetType.MINKAN);
    expect(results[0].fromWho).toBe(Player.TOIMEN);
  });

  await t.step("should handle minkan with red five", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai(52), // Red 5 pin
        new Pai(53), // Normal 5 pin
        new Pai(54), // Normal 5 pin
      ]
    });

    const kanPai = new Pai("p5");
    const results = user.canMinkan({ pai: kanPai, fromWho: Player.SHIMOCHA });

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([52, 53, 54]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p5"]);
    expect(results[0].type).toBe(PaiSetType.MINKAN);
    expect(results[0].fromWho).toBe(Player.SHIMOCHA);
  });

  await t.step("should return empty array when minkan is not possible", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p4"),
      ]
    });

    const kanPai = new Pai("p3");
    const results = user.canMinkan({ pai: kanPai, fromWho: Player.KAMICHA });

    expect(results.length).toBe(0);
  });

  await t.step("should handle basic ankan", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p3"),
      ]
    });

    const results = user.canAnkan();

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual([
      "p3",
      "p3",
      "p3",
      "p3",
    ]);
    expect(results[0].type).toBe(PaiSetType.ANKAN);
  });

  await t.step("should handle ankan with multiple tile types", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.isRichi = true
    user.setPaiRest({
      pais: [
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
      ]
    });
    user.setPaiTsumo({ pai: new Pai("p2") });

    const results = user.canAnkan();
    expect(results.length).toBe(0);
  });

  await t.step("should handle ankan with 6m6m6m3p3p7p8p6s7s8s tsumo6m", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.isRichi = true
    user.setPaiRest({
      pais: [
        new Pai("m6"),
        new Pai("m6"),
        new Pai("m6"),
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p7"),
        new Pai("p8"),
        new Pai("s6"),
        new Pai("s7"),
        new Pai("s8"),
        new Pai("z4"),
        new Pai("z4"),
        new Pai("z4"),
      ]
    });
    user.setPaiTsumo({ pai: new Pai("m6") });

    const results = user.canAnkan();

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual([
      "m6",
      "m6",
      "m6",
      "m6",
    ]);
    expect(results[0].type).toBe(PaiSetType.ANKAN);
    expect(results[0].fromWho).toBe(Player.JICHA);
  });

  await t.step("should handle ankan with tsumo pai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p3"),
      ]
    });
    user.setPaiTsumo({ pai: new Pai("p3") });

    const results = user.canAnkan();

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual([
      "p3",
      "p3",
      "p3",
      "p3",
    ]);
    expect(results[0].type).toBe(PaiSetType.ANKAN);
    expect(results[0].fromWho).toBe(Player.JICHA);
  });

  await t.step("should handle ankan with red five", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai(52), // Red 5 pin
        new Pai(53), // Normal 5 pin
        new Pai(54), // Normal 5 pin
        new Pai(55), // Normal 5 pin
      ]
    });

    const results = user.canAnkan();

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([52, 53, 54, 55]);
    expect(results[0].type).toBe(PaiSetType.ANKAN);
    expect(results[0].fromWho).toBe(Player.JICHA);
  });

  await t.step("should return empty array when ankan is not possible", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
        new Pai("p3"),
        new Pai("p3"),
        new Pai("p3"),
      ]
    });
    user.setPaiTsumo({ pai: new Pai("p4") });

    const results = user.canAnkan();

    expect(results.length).toBe(0);
  });

  await t.step("should handle kakan with tsumo pai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.paiSets.push(
      new PaiSet({
        paiCall: [new Pai(0)],
        paiRest: [new Pai(1), new Pai(2)],
        type: PaiSetType.MINKO,
        fromWho: Player.TOIMEN,
      }),
    );
    user.setPaiTsumo({ pai: new Pai(3) });

    const results = user.canKakan();

    expect(results.length).toBe(1);
    expect(results[0].paiCall.map((p) => p.id)).toEqual([0, 3]);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([1, 2]);
    expect(results[0].type).toBe(PaiSetType.KAKAN);
  });

  await t.step("should return empty array when kakan is not possible", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.paiSets.push(
      new PaiSet({
        paiCall: [new Pai("p3")],
        paiRest: [new Pai("p3"), new Pai("p3")],
        type: PaiSetType.MINKO,
        fromWho: Player.TOIMEN,
      }),
    );
    user.setPaiTsumo({ pai: new Pai("p4") }); // Different pai

    const results = user.canKakan();
    expect(results.length).toBe(0);
  });

  await t.step("should return empty array when no tsumo pai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.paiSets.push(
      new PaiSet({
        paiCall: [new Pai("p3")],
        paiRest: [new Pai("p3"), new Pai("p3")],
        type: PaiSetType.MINKO,
        fromWho: Player.TOIMEN,
      }),
    );

    const results = user.canKakan();
    expect(results.length).toBe(0);
  });

  await t.step("should throw error when dahai without tsumo pai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    expect(() => user.dahai({ pai: new Pai("p1") })).toThrow(
      "invalid pai when dahai called",
    );
  });

  await t.step("should discard tsumo pai when matching", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    const tsumoPai = new Pai("p1");
    user.setPaiTsumo({ pai: tsumoPai });

    user.dahai({ pai: tsumoPai });
    expect(user.paiTsumo).toBeUndefined();
  });

  await t.step("should discard hand pai when not matching tsumo pai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    const handPai = new Pai("p1");
    const tsumoPai = new Pai("p2");
    user.setPaiRest({ pais: [handPai] });
    user.setPaiTsumo({ pai: tsumoPai });

    user.dahai({ pai: handPai });
    expect(user.paiTsumo).toBeUndefined();
    expect(user.paiRest).toEqual([tsumoPai]);
  });
});


Deno.test("should return valid chi combinations", () => {
  const user = new User({
    id: "test-user",
    point: 25000,
    paiJikaze: new Pai("z1"),
  });
  // Set up hand with s3, s4, s8, s1, s5, p3, p4, p5, p8, p6, m7, p4
  user.setPaiRest({
    pais: [
      new Pai("m7"),
      new Pai("p3"),
      new Pai("p4"),
      new Pai("p4"),
      new Pai("p5"),
      new Pai("p6"),
      new Pai("p8"),
      new Pai("s1"),
      new Pai("s3"),
      new Pai("s4"),
      new Pai("s5"),
      new Pai("s8"),
    ],
  });

  // Test chi with m6 (should return [m6, m7])
  const chiPai = new Pai("m6");
  const results = user.canChi({ pai: chiPai });
  expect(results.length).toBe(0);
});


Deno.test("should return valid richi candidates", async (t) => {
  await t.step("should return empty array when no tsumo pai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
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
      ],
    });
    const results = user.canRichi();
    expect(results.length).toBe(0);
  });

  await t.step("should return empty array when hand is not closed", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
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
      ],
    });
    user.setPaiTsumo({ pai: new Pai("m1") });
    user.paiSets.push(new PaiSet({
      paiCall: [new Pai("p1"), new Pai("p1"), new Pai("p1")],
      paiRest: [],
      type: PaiSetType.MINKO,
    }));
    const results = user.canRichi();
    expect(results.length).toBe(0);
  });

  await t.step("should return empty array when point is less than 1000", () => {
    const user = new User({
      id: "test-user",
      point: 500,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
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
      ],
    });
    user.setPaiTsumo({ pai: new Pai("m1") });
    const results = user.canRichi();
    expect(results.length).toBe(0);
  });

  await t.step("should return valid richi candidates when tenpai", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
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
      ],
    });
    user.setPaiTsumo({ pai: new Pai("m1") });
    const results = user.canRichi();
    expect(results.length).toBe(14);
    expect(results[0].fmt).toBe("m1");
  });

  await t.step("should return valid richi candidates when tenpai with 4 pairs", () => {
    const user = new User({
      id: "test-user",
      point: 25000,
      paiJikaze: new Pai("z1"),
    });
    user.setPaiRest({
      pais: [
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
      ],
    });
    user.setPaiTsumo({ pai: new Pai("s3") });
    const results = user.canRichi();
    expect(results.length).toBe(8);
    expect(results[0].fmt).toBe("s9");
  });
});
