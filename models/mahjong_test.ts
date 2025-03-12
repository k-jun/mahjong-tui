import { Mahjong, MahjongCommand } from "./mahjong.ts";
import { MahjongPai } from "./mahjong_pai.ts";
import { expect } from "jsr:@std/expect";

Deno.test("mahjong start", () => {
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

Deno.test("mahjong dahai", () => {
  let called = false;
  const mockOutput = (_: Mahjong) => {
    called = true;
  };
  const userIds = ["user1", "user2", "user3", "user4"];
  const game = new Mahjong(userIds, mockOutput);
  game.start();

  // Get initial state
  const firstUser = game.turnUser();
  const initialHandSize = firstUser.paiHand.length;
  const initialTsumo = firstUser.paiTsumo;

  // Discard the tsumo tile
  if (initialTsumo) {
    game.input(MahjongCommand.DAHAI, {
      userId: firstUser.id,
      pai: initialTsumo,
    });
  }

  // Verify state after discard
  expect(firstUser.paiHand.length).toBe(initialHandSize); // Hand size stays same
  expect(firstUser.paiTsumo).toBe(undefined); // Tsumo tile was discarded
  expect(called).toBe(true); // Output was called

  // Verify turn moved to next player
  expect(game.turnUser().id).not.toBe(firstUser.id);

  // Verify next player got a tsumo
  expect(game.turnUser().paiTsumo).toBeDefined();
});

Deno.test("mahjong dahai 70 times", () => {
  const mockOutput = (_: Mahjong) => {};
  const userIds = ["user1", "user2", "user3", "user4"];
  const game = new Mahjong(userIds, mockOutput);
  game.start();

  // Discard 70 times (nearly emptying the wall)
  for (let i = 0; i < 70; i++) {
    const user = game.turnUser();
    const tsumo = user.paiHand[Math.floor(Math.random() * user.paiHand.length)];
    if (tsumo) {
      game.input(MahjongCommand.DAHAI, {
        userId: user.id,
        pai: tsumo,
      });
    }
  }

  // Verify game state after many discards
  expect(game.paiRemain()).toBe(0); // Wall should be empty
  expect(game.yama.length).toBe(0); // No more tiles in wall
  expect(game.paiWanpai.length).toBe(12); // Dead wall remains untouched

  // Each player should still have correct hand size
  for (const user of game.users) {
    expect(user.paiHand.length).toBe(13);
  }
});

Deno.test("mahjong tusmoAgari", () => {
  const mockOutput = (_: Mahjong) => {};
  const userIds = ["user1", "user2", "user3", "user4"];
  const game = new Mahjong(userIds, mockOutput);
  game.start();

  // Get first user and verify initial state
  const firstUser = game.users[0];
  const initialHandSize = firstUser.paiHand.length;

  // Set up winning hand
  firstUser.paiHand = [
    new MahjongPai("p1"), new MahjongPai("p1"), new MahjongPai("p1"),
    new MahjongPai("p1"), new MahjongPai("p2"), new MahjongPai("p3"), 
    new MahjongPai("p3"), new MahjongPai("p3"), new MahjongPai("p3"),
    new MahjongPai("p4"), new MahjongPai("p4"), new MahjongPai("p4"),
    new MahjongPai("z1"),
  ];
  // firstUser.setPaiTsumo(new MahjongPai("p1")); // Winning tile
  firstUser.paiTsumo = new MahjongPai("z1");

  // Execute tsumo agari
  game.tsumoAgari({ user: firstUser });

  // Verify state after tsumo agari
  expect(firstUser.paiTsumo).toBeDefined(); // Tsumo tile still exists
  expect(firstUser.paiHand.length).toBe(initialHandSize); // Hand size unchanged
});

Deno.test("mahjong ron", () => {
  const mockOutput = (_: Mahjong) => {};
  const userIds = ["user1", "user2", "user3", "user4"];
  const game = new Mahjong(userIds, mockOutput);
  game.start();

  // Get first and second users
  const secondUser = game.users[1]; 

  // Set up winning hand for second user
  secondUser.paiHand = [
    new MahjongPai("p1"), new MahjongPai("p1"), new MahjongPai("p1"),
    new MahjongPai("p2"), new MahjongPai("p2"), new MahjongPai("p2"),
    new MahjongPai("p3"), new MahjongPai("p3"), new MahjongPai("p3"),
    new MahjongPai("p4"), new MahjongPai("p4"), new MahjongPai("p4"),
    new MahjongPai("z1"),
  ];

  // First user discards winning tile
  const winningTile = new MahjongPai("z1");
  // Execute ron
  game.ron({ user: secondUser, pai: winningTile });

  // Verify state after ron
  expect(secondUser.paiTsumo).toBeUndefined(); // No tsumo tile for ron
  expect(secondUser.paiHand.length).toBe(13); // Hand size should be 12 before winning tile
})