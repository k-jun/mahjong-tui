import { MahjongPai, MahjongPaiSet } from "./mahjong_pai.ts";
import { MahjongUser } from "./mahjong_user.ts";
import { AllPais } from "./constants.ts";
import { Player, Tokuten } from "@k-jun/mahjong";

export enum MahjongCommand {
  TSUMO = "tsumo",
  DAHAI = "dahai",
  RICHI = "richi",
  AGARI = "agari",
  CHI = "chi",
  PON = "pon",
  KAN = "kan",
  RON = "ron",
}

export type MahjongAction = {
  player: Player;
  command: MahjongCommand;
  enable: boolean;
};

type Params = {
  paiRest: MahjongPai[];
  paiLast: MahjongPai;
  paiSets: MahjongPaiSet[];
  paiBakaze: MahjongPai;
  paiJikaze: MahjongPai;
  paiDora: MahjongPai[];
  paiDoraUra: MahjongPai[];
  options: {
    isTsumo: boolean;
    isOya: boolean;
    isRichi: boolean;
    isDabururichi: boolean;
    isIppatsu: boolean;
    isHaitei: boolean;
    isHoutei: boolean;
    isChankan: boolean;
    isRinshankaiho: boolean;
    isChiho: boolean;
    isTenho: boolean;
  };
};

export class Mahjong {
  yama: MahjongPai[];
  paiWanpai: MahjongPai[];
  paiBakaze: MahjongPai;
  paiDora: MahjongPai[];
  paiDoraUra: MahjongPai[];
  users: MahjongUser[];
  turnUserIdx: number;
  actions: MahjongAction[];

  kazes = [
    new MahjongPai("z1"), // 108 東
    new MahjongPai("z2"), // 112 南
    new MahjongPai("z3"), // 116 西
    new MahjongPai("z4"), // 120 北
  ];
  players = [
    Player.JICHA,
    Player.SHIMOCHA,
    Player.TOIMEN,
    Player.KAMICHA,
  ];

  output: (mjg: Mahjong) => void;

  constructor(userIds: string[], output: (mjg: Mahjong) => void) {
    this.yama = [];
    this.paiWanpai = [];
    this.paiDora = [];
    this.paiDoraUra = [];
    this.paiBakaze = this.kazes[0];
    this.output = output;

    const users: MahjongUser[] = [];
    userIds.forEach((id, idx) => {
      const paiJikaze = this.kazes[idx];
      users.push(new MahjongUser({ id, paiJikaze, isOya: idx == 0 }));
    });
    this.users = users;
    this.actions = [];
    this.turnUserIdx = 0;
  }

  shuffle<T>(pais: T[]) {
    for (let i = pais.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pais[i], pais[j]] = [pais[j], pais[i]];
    }
  }

  paiRemain() {
    return this.yama.length + (this.paiWanpai.length / 3) - 4;
  }

  turnNext({ user }: { user: MahjongUser }) {
    const currentIdx = this.users.findIndex((u) => u.id === user.id);
    this.turnUserIdx = (currentIdx + 1) % 4;

    this.input(MahjongCommand.TSUMO, { userId: this.turnUser().id });
    return;
  }

  turnUser() {
    return this.users[this.turnUserIdx];
  }

  start() {
    const paiAll = [...AllPais];
    this.shuffle(paiAll);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        this.users[j].setHandPais(paiAll.splice(0, 4));
      }
    }
    for (let j = 0; j < 4; j++) {
      this.users[j].setHandPais(paiAll.splice(0, 1));
    }
    this.paiWanpai.push(...paiAll.splice(-14));

    const [omote, ura] = this.paiWanpai.splice(5, 2);
    this.paiDora.push(omote);
    this.paiDoraUra.push(ura);

    this.yama.push(...paiAll);

    this.output(this);
    this.input(MahjongCommand.TSUMO, {
      userId: this.users[this.turnUserIdx].id,
    });
  }

  end() {
    console.log("Game End!");
    this.output(this);
  }

  callFrom(myIdx: number, yourIdx: number): Player {
    return this.players[(yourIdx - myIdx + 4) % 4];
  }

  tsumo({ user }: { user: MahjongUser }) {
    user.setPaiTsumo(this.yama.splice(0, 1)[0]);
    this.output(this);
  }

  dahai({ user, pai }: { user: MahjongUser; pai: MahjongPai }) {
    if (user.id !== this.turnUser().id) {
      throw new Error("when dahai called, not your turn");
    }
    if (user.paiTsumo === undefined) {
      throw new Error("when dahai called, paiTsumo is undefined");
    }
    user.dahai({ pai });
    this.output(this);
    if (this.paiRemain() === 0) {
      return;
    }
    this.turnNext({ user });
    this.output(this);
  }

  ron({ user, pai }: { user: MahjongUser; pai: MahjongPai }) {
    if (user.id === this.turnUser().id) {
      throw new Error("when ron called, it's your turn");
    }
    if (user.paiTsumo !== undefined) {
      throw new Error("when ron called, paiTsumo is not undefined");
    }

    const params: Params = {
      paiRest: user.paiHand,
      paiLast: pai,
      paiSets: user.paiCall,
      paiBakaze: this.paiBakaze,
      paiJikaze: user.paiJikaze,
      paiDora: this.paiDora,
      paiDoraUra: this.paiDoraUra,
      options: {
        isTsumo: false,
        isOya: user.isOya,
        isRichi: user.isRichi,
        isDabururichi: user.isDabururichi,
        isIppatsu: user.isIppatsu,
        isHaitei: false,
        isHoutei: this.paiRemain() === 0,
        isChankan: false,
        isRinshankaiho: false,
        isChiho: false,
        isTenho: false,
      },
    };

    const x = new Tokuten({ ...params }).count();
    console.log(x);
  }

  tsumoAgari({ user }: { user: MahjongUser }) {
    if (user.id !== this.turnUser().id) {
      throw new Error("when tsumoAgari called, not your turn");
    }
    if (user.paiTsumo === undefined) {
      throw new Error("when tsumoAgari called, paiTsumo is undefined");
    }
    const allMenzen = this.users.every((u) => u.paiCall.length === 0);
    const params: Params = {
      paiRest: user.paiHand,
      paiLast: user.paiTsumo,
      paiSets: user.paiCall,
      paiBakaze: this.paiBakaze,
      paiJikaze: user.paiJikaze,
      paiDora: this.paiDora,
      paiDoraUra: this.paiDoraUra,
      options: {
        isTsumo: true,
        isOya: user.isOya,
        isRichi: user.isRichi,
        isDabururichi: user.isDabururichi,
        isIppatsu: user.isIppatsu,
        isHaitei: this.paiRemain() === 0,
        isHoutei: false,
        isChankan: false,
        isRinshankaiho: false,
        isChiho: [68, 67, 66].includes(this.paiRemain()) && allMenzen,
        isTenho: this.paiRemain() === 69,
      },
    };
    const x = new Tokuten({ ...params }).count();
    console.log(x);
  }

  richi({ user, pai }: { user: MahjongUser; pai: MahjongPai }) {
    if (user.id !== this.turnUser().id) {
      throw new Error("when richi called, not your turn");
    }
    if (user.isRichi) {
      throw new Error("when richi called, already richi");
    }
    if (user.paiTsumo === undefined) {
      throw new Error("when richi called, paiTsumo is undefined");
    }

    user.isRichi = true;
    user.dahai({ pai });
  }

  input(
    action: MahjongCommand,
    { userId, pai }: {
      userId: string;
      pai?: MahjongPai;
    },
  ) {
    const user = this.users.find((e) => e.id == userId);
    if (user === undefined) {
      throw new Error("user not found");
    }

    switch (action) {
      case MahjongCommand.TSUMO:
        this.tsumo({ user });
        break;
      case MahjongCommand.DAHAI:
        if (pai === undefined) {
          return;
        }
        this.dahai({ user, pai });
        break;
      case MahjongCommand.AGARI:
        this.tsumoAgari({ user });
        break;
      case MahjongCommand.RON:
        if (pai === undefined) {
          return;
        }
        this.ron({ user, pai });
        break;
      case MahjongCommand.RICHI:
        if (pai === undefined) {
          return;
        }
        this.richi({ user, pai });
        break;
      case MahjongCommand.PON:
      case MahjongCommand.KAN:
    }
  }
}
