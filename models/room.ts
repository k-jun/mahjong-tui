import { CPU, User } from "./user.ts";
import { Mahjong, MahjongInput, MahjongInputParams } from "./mahjong.ts";

const defaultRoomSize = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const autoAction = async (
  mahjong: Mahjong,
  cpu: CPU,
): Promise<void> => {
  await sleep(100);
  if (mahjong.turnRest() === 0) {
    console.log("done", cpu.id);
    return;
  }
  const user = mahjong.users.find((e) => e.id === cpu.id);
  if (!user) {
    throw new Error("User not found");
  }

  const liveActions = mahjong.actions.filter((e) => e.enable === undefined);
  const userActions = liveActions.filter((e) => e.user.id === user.id);
  if (liveActions.length !== 0) {
    if (userActions.length !== 0) {
      mahjong.input(MahjongInput.SKIP, { user, params: {} });
    }
    return;
  }

  const turnUser = mahjong.turnUser();
  if (turnUser.id === user.id) {
    if (turnUser.paiTsumo === undefined) {
      mahjong.input(MahjongInput.TSUMO, { user, params: {} });
    } else {
      mahjong.input(MahjongInput.DAHAI, {
        user,
        params: { dahai: { paiDahai: turnUser.paiTsumo } },
      });
    }
  }
};

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
    if (user instanceof CPU) {
      const output = this.output;
      this.output = async (mjg): Promise<void> => {
        autoAction(mjg, user);
        output(mjg);
      };
    }
    this.users.push(user);
  }

  leave(id: string): void {
    this.users = this.users.filter((user) => user.id !== id);
  }

  size(): number {
    return this.users.length;
  }

  start(): void {
    this.mahjong = new Mahjong(this.users.map((user) => user.id), this.output);
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
