// import { CPU } from "./cpu.ts";
import { Mahjong, MahjongInput, MahjongParams } from "./mahjong.ts";
import { ActionDefault } from "./cpu.ts";
import { createMutex, Mutex } from "@117/mutex";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class User {
  id: string;
  isCPU: boolean;

  constructor(id: string, isCPU: boolean) {
    this.id = id;
    this.isCPU = isCPU;
  }
}

export class Room {
  users: User[];
  mahjong?: Mahjong;
  mutex: Mutex = createMutex();
  defaultRoomSize: number = 4;
  output: (mjg: Mahjong) => Promise<void>;

  constructor(output: (mjg: Mahjong) => Promise<void>) {
    this.users = [];
    this.output = output;
  }

  sizeNonCPU(): number {
    return this.users.filter((user) => !user.isCPU).length;
  }

  size(): number {
    return this.users.length;
  }

  sizeIncludeCPU(): number {
    return this.users.length;
  }

  join(user: User): boolean {
    if (this.users.length === this.defaultRoomSize) {
      return false;
    }
    this.users.push(user);
    if (this.users.length === this.defaultRoomSize) {
      this.start();
    }
    return true;
  }

  leave(userId: string): void {
    const user = this.users.find((user) => user.id === userId);
    if (user) {
      user.isCPU = true;
    }
    this.mutex.release();
  }

  start(): void {
    this.mahjong = new Mahjong(
      this.users.map((user) => user.id),
      async (mjg: Mahjong): Promise<void> => {
        const state = mjg.state;
        this.users.forEach(async (user) => {
          if (user.isCPU) {
            ActionDefault({ mahjong: mjg, userId: user.id, state });
            return;
          }
          await sleep(20 * 1000);
          ActionDefault({ mahjong: mjg, userId: user.id, state });
        });
        this.output(mjg);
        if (mjg.status !== "playing") {
          await sleep(7 * 1000);
          await mjg.gameReset();
          await mjg.gameStart(mjg.generate());
        }
      },
    );
    this.mahjong.gameStart(this.mahjong.generate());
  }

  input(userId: string, input: MahjongInput, params: MahjongParams): void {
    if (!this.mahjong) {
      throw new Error("Mahjong is undefined");
    }
    const user = this.mahjong.users.find((user) => user.id === userId);
    if (!user) {
      throw new Error("User not found");
    }
    this.mahjong.input(input, params);
  }
}
