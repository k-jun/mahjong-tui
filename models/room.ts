import { User } from "./user.ts";
import { MahjongInputParams, Mahjong, MahjongInput } from "./mahjong.ts";

const defaultRoomSize = 4;

export class Room {
  users: User[];
  mahjong?: Mahjong;
  constructor() {
    this.users = [];
  }

  isOpen(): boolean {
    return this.users.length < defaultRoomSize;
  }

  join(id: string): void {
    this.users.push(new User(id));
  }

  leave(id: string): void {
    this.users = this.users.filter((user) => user.id !== id);
  }

  size(): number {
    return this.users.length;
  }

  start(output: (mjg: Mahjong) => void): void {
    this.mahjong = new Mahjong(this.users.map((user) => user.id), output);
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
