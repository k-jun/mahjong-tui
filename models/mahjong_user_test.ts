import { MahjongUser } from "./mahjong_user.ts";
import { MahjongPai, MahjongPaiSet } from "./mahjong_pai.ts";
import { expect } from "jsr:@std/expect";

import { PaiSetType, Player } from "@k-jun/mahjong";

Deno.test("MahjongUser", async (t) => {
  await t.step("should initialize with empty arrays", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    expect(user.id).toBe("test-user");
    expect(user.paiHand).toEqual([]);
    expect(user.paiCall).toEqual([]);
    expect(user.paiKawa).toEqual([]);
    expect(user.paiTsumo).toBeUndefined();
  });

  await t.step("should set hand pais correctly", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    const pais = [new MahjongPai(0), new MahjongPai(1)];

    user.setHandPais(pais);
    expect(user.paiHand).toEqual(pais);
  });

  await t.step("should set tsumo pai correctly", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    const tsumoPai = new MahjongPai(0);

    user.setPaiTsumo(tsumoPai);
    expect(user.paiTsumo).toEqual(tsumoPai);
  });

  await t.step("should throw error when setting tsumo pai twice", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    const tsumoPai = new MahjongPai(0);

    user.setPaiTsumo(tsumoPai);
    expect(() => user.setPaiTsumo(tsumoPai)).toThrow("Already tsumoed");
  });

  await t.step("should return empty array for jihai pai in canChi", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    const jihaiPai = new MahjongPai("z1"); // East wind
    expect(user.canChi(jihaiPai)).toEqual([]);
  });

  await t.step("should return valid chi combinations", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    // Set up hand with 3-4 of manzu
    user.setHandPais([
      new MahjongPai("m3"),
      new MahjongPai("m4"),
      new MahjongPai("m6"),
      new MahjongPai("m7"),
    ]);

    // Try to chi a 5 manzu
    const chiPai = new MahjongPai("m5");
    const results = user.canChi(chiPai);

    expect(results.length).toBe(3);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["m3", "m4"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
    expect(results[1].paiRest.map((p) => p.fmt)).toEqual(["m4", "m6"]);
    expect(results[1].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
    expect(results[2].paiRest.map((p) => p.fmt)).toEqual(["m6", "m7"]);
    expect(results[2].paiCall.map((p) => p.fmt)).toEqual(["m5"]);
  });

  await t.step("should handle red five in chi combinations", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    // Set up hand with regular 4 and red 5 of pinzu
    user.setHandPais([
      new MahjongPai("p4"),
      new MahjongPai(53), // normal 5 pin
      new MahjongPai(52), // Red 5 pin
    ]);

    // Try to chi a 6 pinzu
    const chiPai = new MahjongPai("p6");
    const results = user.canChi(chiPai);

    expect(results.length).toBe(2);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([48, 52]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p6"]);
    expect(results[1].paiRest.map((p) => p.id)).toEqual([48, 53]);
    expect(results[1].paiCall.map((p) => p.fmt)).toEqual(["p6"]);
  });

  await t.step("should handle chi combinations with p1", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    // Set up hand with 2-3 of pinzu
    user.setHandPais([
      new MahjongPai("p2"),
      new MahjongPai("p3"),
    ]);

    // Try to chi a p1
    const chiPai = new MahjongPai("p1");
    const results = user.canChi(chiPai);

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["p2", "p3"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p1"]);
  });

  await t.step("should handle basic pon combinations", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p4"),
    ]);

    const ponPai = new MahjongPai("p3");
    const results = user.canPon(ponPai, Player.TOIMEN);

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["p3", "p3"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p3"]);
    expect(results[0].fromWho).toBe(Player.TOIMEN);
  });

  await t.step("should handle pon with red five", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai(52), // Red 5 pin
      new MahjongPai(53), // Normal 5 pin
      new MahjongPai(54), // Normal 5 pin
    ]);

    const ponPai = new MahjongPai("p5");
    const results = user.canPon(ponPai, Player.SHIMOCHA);

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
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p4"),
      new MahjongPai("p5"),
    ]);

    const ponPai = new MahjongPai("p3");
    const results = user.canPon(ponPai, Player.KAMICHA);

    expect(results.length).toBe(0);
  });

  await t.step("should handle basic minkan", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p3"),
    ]);

    const kanPai = new MahjongPai("p3");
    const results = user.canMinkan(kanPai, Player.TOIMEN);

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.fmt)).toEqual(["p3", "p3", "p3"]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p3"]);
    expect(results[0].type).toBe(PaiSetType.MINKAN);
    expect(results[0].fromWho).toBe(Player.TOIMEN);
  });

  await t.step("should handle minkan with red five", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai(52), // Red 5 pin
      new MahjongPai(53), // Normal 5 pin
      new MahjongPai(54), // Normal 5 pin
    ]);

    const kanPai = new MahjongPai("p5");
    const results = user.canMinkan(kanPai, Player.SHIMOCHA);

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([52, 53, 54]);
    expect(results[0].paiCall.map((p) => p.fmt)).toEqual(["p5"]);
    expect(results[0].type).toBe(PaiSetType.MINKAN);
    expect(results[0].fromWho).toBe(Player.SHIMOCHA);
  });

  await t.step("should return empty array when minkan is not possible", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p4"),
    ]);

    const kanPai = new MahjongPai("p3");
    const results = user.canMinkan(kanPai, Player.KAMICHA);

    expect(results.length).toBe(0);
  });

  await t.step("should handle basic ankan", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p3"),
    ]);

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

  await t.step("should handle ankan with tsumo pai", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p3"),
    ]);
    user.setPaiTsumo(new MahjongPai("p3"));

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
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai(52), // Red 5 pin
      new MahjongPai(53), // Normal 5 pin
      new MahjongPai(54), // Normal 5 pin
      new MahjongPai(55), // Normal 5 pin
    ]);

    const results = user.canAnkan();

    expect(results.length).toBe(1);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([52, 53, 54, 55]);
    expect(results[0].type).toBe(PaiSetType.ANKAN);
    expect(results[0].fromWho).toBe(Player.JICHA);
  });

  await t.step("should return empty array when ankan is not possible", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.setHandPais([
      new MahjongPai("p3"),
      new MahjongPai("p3"),
      new MahjongPai("p3"),
    ]);
    user.setPaiTsumo(new MahjongPai("p4"));

    const results = user.canAnkan();

    expect(results.length).toBe(0);
  });

  await t.step("should handle kakan with tsumo pai", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.paiCall.push(
      new MahjongPaiSet({
        paiCall: [new MahjongPai(0)],
        paiRest: [new MahjongPai(1), new MahjongPai(2)],
        type: PaiSetType.MINKO,
        fromWho: Player.TOIMEN,
      }),
    );
    user.setPaiTsumo(new MahjongPai(3));

    const results = user.canKakan();

    expect(results.length).toBe(1);
    expect(results[0].paiCall.map((p) => p.id)).toEqual([0, 3]);
    expect(results[0].paiRest.map((p) => p.id)).toEqual([1, 2]);
    expect(results[0].type).toBe(PaiSetType.KAKAN);
  });

  await t.step("should return empty array when kakan is not possible", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.paiCall.push(
      new MahjongPaiSet({
        paiCall: [new MahjongPai("p3")],
        paiRest: [new MahjongPai("p3"), new MahjongPai("p3")],
        type: PaiSetType.MINKO,
        fromWho: Player.TOIMEN,
      }),
    );
    user.setPaiTsumo(new MahjongPai("p4")); // Different pai

    const results = user.canKakan();
    expect(results.length).toBe(0);
  });

  await t.step("should return empty array when no tsumo pai", () => {
    const user = new MahjongUser({ id: "test-user", paiJikaze: new MahjongPai("z1"), isOya: false });
    user.paiCall.push(
      new MahjongPaiSet({
        paiCall: [new MahjongPai("p3")],
        paiRest: [new MahjongPai("p3"), new MahjongPai("p3")],
        type: PaiSetType.MINKO,
        fromWho: Player.TOIMEN,
      }),
    );

    const results = user.canKakan();
    expect(results.length).toBe(0);
  });
});
