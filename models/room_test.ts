import { expect } from "jsr:@std/expect";
import { Room } from "./room.ts";

Deno.test("Room", async (t) => {
  await t.step("constructor initializes with empty users", () => {
    const room = new Room(async (_) => {});
    expect(room.userIds.length).toBe(0);
  });

  await t.step("isOpen returns true when room is not full", () => {
    const room = new Room(async (_) => {});
    expect(room.isOpen()).toBe(true);
  });

  await t.step("isOpen returns false when room is full", () => {
    const room = new Room(async (_) => {});
    // Add 4 users to fill the room
    room.join("user1");
    room.join("user2");
    room.join("user3");
    room.join("user4");
    expect(room.isOpen()).toBe(false);
  });

  await t.step("join adds a user to the room", () => {
    const room = new Room(async (_) => {});
    room.join("test-user");
    expect(room.userIds.length).toBe(1);
    expect(room.userIds[0]).toBe("test-user");
  });

  await t.step("leave removes a user from the room", () => {
    const room = new Room(async (_) => {});
    room.join("user1");
    room.join("user2");
    expect(room.userIds.length).toBe(2);

    room.leave("user1");
    expect(room.userIds.length).toBe(1);
    expect(room.userIds[0]).toBe("user2");
  });

  await t.step("size returns the number of users in the room", () => {
    const room = new Room(async (_) => {});
    room.join("user1");
    room.join("user2");
    expect(room.size()).toBe(2);
  });
});
