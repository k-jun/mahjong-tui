import { MahjongPai } from "./mahjong_pai.ts";
import { expect } from "jsr:@std/expect";

Deno.test("Pai should initialize with correct properties", () => {
  const pai = new MahjongPai(0);
  
  // Check inheritance from MahjongPai
  expect(pai.id).toBe(0);
  
  // Check additional properties
  expect(pai.isOpen).toBe(false);
  expect(pai.isSide).toBe(false);
});

Deno.test("Pai should work with different IDs", () => {
  const pai1 = new MahjongPai(16); // m5 red
  const pai2 = new MahjongPai(52); // p5 red
  
  expect(pai1.id).toBe(16);
  expect(pai2.id).toBe(52);
  expect(pai1.isOpen).toBe(false);
  expect(pai2.isSide).toBe(false);
});

Deno.test("Pai should set open correctly", () => {
  const pai = new MahjongPai(0);
  
  pai.setOpen(true);
  expect(pai.isOpen).toBe(true);
  
  pai.setOpen(false);
  expect(pai.isOpen).toBe(false);
});

Deno.test("Pai should set side correctly", () => {
  const pai = new MahjongPai(0);
  
  pai.setSide(true);
  expect(pai.isSide).toBe(true);
  
  pai.setSide(false);
  expect(pai.isSide).toBe(false);
});