// import { CPU } from "./cpu.ts";
import { Mahjong, MahjongInput, MahjongParams } from "./mahjong.ts";
import { ActionDefault } from "./cpu.ts";

const defaultRoomSize = 4;
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
  output: (mjg: Mahjong) => Promise<void>;

  constructor(output: (mjg: Mahjong) => Promise<void>) {
    this.users = [];
    this.output = output;
  }

  isOpen(): boolean {
    return this.users.length < defaultRoomSize;
  }

  join(user: User): void {
    this.users.push(user);
  }

  leave(userId: string): void {
    const user = this.users.find((user) => user.id === userId);
    if (user) {
      user.isCPU = true;
    }
  }

  size(): number {
    return this.users.length;
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
          // await sleep(1 * 1000);
          ActionDefault({ mahjong: mjg, userId: user.id, state });
        });
        if (mjg.isEnded) {
          mjg.gameReset();
          await mjg.gameStart(mjg.generate());
          return;
        }
        this.output(mjg);
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
