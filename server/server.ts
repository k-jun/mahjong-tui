import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { Room, User } from "../models/room.ts";
import { randomUUID } from "node:crypto";
import { MahjongInput, MahjongParams } from "../models/mahjong.ts";

export const OnAll = (socket: Socket, rooms: { [key: string]: Room }) => {
  OnJoin(socket, rooms);
  OnLeave(socket, rooms);
  OnDisconnect(socket, rooms);
  OnInput(socket, rooms);
};

const OnInput = (socket: Socket, rooms: { [key: string]: Room }) => {
  socket.on(
    "input",
    (name: string, input: MahjongInput, params: MahjongParams) => {
      // if (params.dahai?.paiId) {
      //   params.dahai.paiId = new Pai(params.dahai.paiId);
      // }

      // console.log(name, input, params);
      const room = rooms[name];
      room.input(socket.id, input, params);
    },
  );
};

const OnPong = (socket: Socket, rooms: { [key: string]: Room }) => {
  socket.on("pong", (name: string, userId: string) => {
    const room = rooms[name];
    room.pong(userId);
  });
};

const OnJoin = (socket: Socket, rooms: { [key: string]: Room }) => {
  socket.on("join", async () => {
    let name = "";
    for (const [key, room] of Object.entries(rooms)) {
      if (room.isOpen()) {
        name = key;
        break;
      }
    }
    if (name == "") {
      name = randomUUID();
    }
    await socket.join(name);
  });
};

const OnLeave = (socket: Socket, _: { [key: string]: Room }) => {
  socket.on("leave", async (name) => {
    await socket.leave(name);
  });
};

const OnDisconnect = (socket: Socket, _: { [key: string]: Room }) => {
  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);
  });
};

export const OnServerConnection = (
  io: Server,
  rooms: { [key: string]: Room },
) => {
  io.on("connection", (socket: Socket) => {
    console.log("connected", socket.id);
    OnAll(socket, rooms);
  });
};

export const OnServerJoinRoom = (
  io: Server,
  rooms: { [key: string]: Room },
) => {
  io.of("/").adapter.on("join-room", (name: string | number, id: string) => {
    if (name != id) {
      let room = rooms[name.toString()];
      if (room == undefined) {
        room = new Room(async (mjg) => {
          await io.to(name.toString()).emit("output", name, mjg);
        });
        rooms[name.toString()] = room;
      }
      room.join(new User(id, false));

      if (room.size() == 4) {
        room.start();
      }
    }
  });
};

export const OnServerLeaveRoom = (
  io: Server,
  rooms: { [key: string]: Room },
) => {
  io.of("/").adapter.on("leave-room", (name: string | number, id: string) => {
    if (name != id && name in rooms) {
      const room = rooms[name];
      room.leave(id);
      delete rooms[name];
      // if (room.size() == 0) {
      //   delete rooms[name];
      // }
    }
  });
};
