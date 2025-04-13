// import { CPU } from "./cpu.ts";
import { Mahjong, MahjongInput, MahjongInputParams } from "./mahjong.ts";

const defaultRoomSize = 4;

export class Room {
  userIds: string[];
  mahjong?: Mahjong;
  output: (mjg: Mahjong) => Promise<void>;

  constructor(output: (mjg: Mahjong) => Promise<void>) {
    this.userIds = [];
    this.output = output;
  }

  isOpen(): boolean {
    return this.userIds.length < defaultRoomSize;
  }

  join(userId: string): void {
    this.userIds.push(userId);
  }

  leave(userId: string): void {
    this.userIds = this.userIds.filter((id) => id !== userId);
  }

  size(): number {
    return this.userIds.length;
  }

  start(): void {
    this.mahjong = new Mahjong(this.userIds, this.output);
    this.mahjong.gameStart(this.mahjong.generate());
  }

  input(userId: string, input: MahjongInput, params: MahjongInputParams): void {
    if (!this.mahjong) {
      throw new Error("Mahjong is undefined");
    }
    const user = this.mahjong.users.find((user) => user.id === userId);
    if (!user) {
      throw new Error("User not found");
    }
    this.mahjong.input(input, { user, params });
  }
}
