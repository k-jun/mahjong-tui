import { Mahjong } from "./mahjong.ts";
import { expect } from "jsr:@std/expect";

Deno.test("mahjong", () => {
  let called = false;
  const mockOutput = (_: Mahjong) => {
    called = true;
  };
  const userIds = ["user1", "user2", "user3", "user4"];
  const game = new Mahjong(userIds, mockOutput);
  game.start();

  // Check output was called
  expect(called).toBe(true);

  // Check yama (remaining tiles)
  expect(game.yama.length).toBe(69); // 136 total - (13*4 hands) - 14 wanpai = 70 - 1 tsumo = 69

  // Check wanpai (dead wall)
  expect(game.paiWanpai.length).toBe(14);
  expect(game.paiWanpai[5].isOpen).toBe(true); // Dora indicator should be open

  // Check each player's hand
  for (const user of game.users) {
    expect(user.paiHand.length).toBe(13); // Each player should have 13 tiles
  }

  // Verify users were shuffled (by checking they exist but may be in different order)
  const shuffledIds = game.users.map((u) => u.id);
  for (const id of userIds) {
    expect(shuffledIds).toContain(id);
  }
});
