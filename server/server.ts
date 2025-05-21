import { Server, Socket } from "npm:socket.io";
import { Room, User } from "../models/room.ts";
import { randomUUID } from "node:crypto";
import { MahjongInput, MahjongParams } from "../models/mahjong.ts";

let matchingTimeout: number = 20 * 1000;
if (Deno.env.get("MATCHING_TIMEOUT")) {
  matchingTimeout = parseInt(Deno.env.get("MATCHING_TIMEOUT")!) * 1000;
}

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
      const room = rooms[name];
      params.usrId = socket.id;
      room.input(socket.id, input, params);
    },
  );
};

const OnJoin = (socket: Socket, rooms: { [key: string]: Room }) => {
  socket.on("join", async () => {
    let found = false;
    for (const [key, room] of Object.entries(rooms)) {
      await room.mutex.acquire();
      if (room.size() < room.defaultRoomSize) {
        await socket.join(key);
        found = true;
      }
      await room.mutex.release();
      if (found) {
        break;
      }
    }
    if (!found) {
      await socket.join(randomUUID());
    }
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
        room = new Room(name.toString(), async (mjg) => {
          io.to(name.toString()).emit("output", name, mjg);
        });
        rooms[name.toString()] = room;
      }
      if (!room.join(new User(id, false))) {
        console.log(`failed to join, room: ${name}, id: ${id}`);
        return;
      }
      setTimeout(async () => {
        await JoinCPU(rooms, room);
      }, matchingTimeout);
    }
  });
};

const JoinCPU = async (rooms: { [key: string]: Room }, room: Room) => {
  await room.mutex.acquire();
  if (rooms[room.name] == undefined) {
    room.mutex.release();
    return;
  }
  const sizeNonCPU = room.sizeNonCPU();
  if (sizeNonCPU === 0) {
    room.mutex.release();
    return;
  }
  let cnt = 1;
  while (true) {
    if (!room.join(new User(`cpu-${cnt}`, true))) {
      break;
    }
    cnt++;
  }
  room.mutex.release();
};

export const OnServerLeaveRoom = (
  io: Server,
  rooms: { [key: string]: Room },
) => {
  io.of("/").adapter.on("leave-room", (name: string | number, id: string) => {
    if (name != id && name in rooms) {
      const room = rooms[name];
      room.leave(id);
      if (room.sizeNonCPU() == 0) {
        delete rooms[name];
      }
    }
  });
};
