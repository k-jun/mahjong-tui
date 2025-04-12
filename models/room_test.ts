import { expect } from "jsr:@std/expect";
import { Room } from "./room.ts";
import { CPU } from "./user.ts";
Deno.test("Room", async (t) => {
  await t.step("constructor initializes with empty users", () => {
    const room = new Room(async (_) => {});
    expect(room.users.length).toBe(0);
  });

  await t.step("isOpen returns true when room is not full", () => {
    const room = new Room(async (_) => {});
    expect(room.isOpen()).toBe(true);
  });

  await t.step("isOpen returns false when room is full", () => {
    const room = new Room(async (_) => {});
    // Add 4 users to fill the room
    room.join(new CPU("user1"));
    room.join(new CPU("user2"));
    room.join(new CPU("user3"));
    room.join(new CPU("user4"));
    expect(room.isOpen()).toBe(false);
  });

  await t.step("join adds a user to the room", () => {
    const room = new Room(async (_) => {});
    room.join(new CPU("test-user"));
    expect(room.users.length).toBe(1);
    expect(room.users[0].id).toBe("test-user");
  });

  await t.step("leave removes a user from the room", () => {
    const room = new Room(async (_) => {});
    room.join(new CPU("user1"));
    room.join(new CPU("user2"));
    expect(room.users.length).toBe(2);

    room.leave("user1");
    expect(room.users.length).toBe(1);
    expect(room.users[0].id).toBe("user2");
  });

  await t.step("size returns the number of users in the room", () => {
    const room = new Room(async (_) => {});
    room.join(new CPU("user1"));
    room.join(new CPU("user2"));
    expect(room.size()).toBe(2);
  });
});
