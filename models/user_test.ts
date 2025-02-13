import { User } from "./user.ts";
import { expect } from "jsr:@std/expect";

Deno.test("User constructor with id", () => {
    const testId = "50424";
    const user = new User(testId);
    expect(user.id).toBe(testId);
});

Deno.test("User constructor without id", () => {
    const user = new User();
    expect(user.id).toBe("");
});