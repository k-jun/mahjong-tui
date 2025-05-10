import { expect } from "jsr:@std/expect";
import { Room, User } from "./room.ts";

Deno.test("Room", async (t) => {
  await t.step("constructor initializes with empty users", () => {
    const room = new Room("test-room", async (_) => {});
    expect(room.users.length).toBe(0);
  });

  await t.step("isOpen returns true when room is not full", () => {
    const room = new Room("test-room", async (_) => {});
    expect(room.isOpen()).toBe(true);
  });

  await t.step("isOpen returns false when room is full", () => {
    const room = new Room("test-room", async (_) => {});
    // Add 4 users to fill the room
    room.join(new User("user1", false));
    room.join(new User("user2", false));
    room.join(new User("user3", false));
    room.join(new User("user4", false));
    expect(room.isOpen()).toBe(false);
  });

  await t.step("join adds a user to the room", () => {
    const room = new Room("test-room", async (_) => {});
    room.join(new User("test-user", false));
    expect(room.users.length).toBe(1);
    expect(room.users[0].id).toBe("test-user");
  });

  await t.step("leave removes a user from the room", () => {
    const room = new Room("test-room", async (_) => {});
    room.join(new User("user1", false));
    room.join(new User("user2", false));
    expect(room.users.length).toBe(2);

    room.leave("user1");
    expect(room.users.length).toBe(1);
    expect(room.users[0].id).toBe("user2");
  });

  await t.step("size returns the number of users in the room", () => {
    const room = new Room("test-room", async (_) => {});
    room.join(new User("user1", false));
    room.join(new User("user2", false));
    expect(room.size()).toBe(2);
  });
});
