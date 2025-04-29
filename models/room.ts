// import { CPU } from "./cpu.ts";
import { Mahjong, MahjongInput, MahjongParams } from "./mahjong.ts";
import { ActionDefault } from "./cpu.ts";

const defaultRoomSize = 4;

export class User {
  id: string;
  isCPU: boolean;
  state: Map<string, boolean>;

  constructor(id: string, isCPU: boolean) {
    this.id = id;
    this.isCPU = isCPU;
    this.state = new Map();
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    this.users = this.users.filter((user) => user.id !== userId);
  }

  size(): number {
    return this.users.length;
  }

  start(): void {
    this.mahjong = new Mahjong(
      this.users.map((user) => user.id),
      async (mjg: Mahjong): Promise<void> => {
        this.users.forEach((user) => ActionDefault(mjg, user.id));
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
