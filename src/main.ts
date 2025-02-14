import { Server, Socket } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { Room } from "../models/room.ts";
import { randomUUID } from "node:crypto";

export const OnAll = (socket: Socket, rooms: { [key: string]: Room }) => {
  OnJoin(socket, rooms);
  OnLeave(socket, rooms);
  OnDisconnect(socket, rooms);
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
  socket.on("disconnect", () => {});
};

export const OnServerConnection = (
  io: Server,
  rooms: { [key: string]: Room },
) => {
  io.on("connection", (socket: Socket) => {
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
        room = new Room();
        rooms[name.toString()] = room;
      }
      room.join(id);
    }
  });
};

export const OnServerLeaveRoom = (
  io: Server,
  rooms: { [key: string]: Room },
) => {
  io.of("/").adapter.on("leave-room", (name: string | number, id: string) => {
    if (name != id && name in rooms) {
      const oldRoom = rooms[name];
      oldRoom.leave(id);
      if (oldRoom.users.length == 0) {
        delete rooms[name];
      }
    }
  });
};

// const OnAll = (io: Server, rooms: { [key: string]: Room }) => {
//   OnConnection(io, rooms);
//   OnJoinRoom(io, rooms);
//   OnLeaveRoom(io, rooms);
// };

// export const NewServer = async (
//   port: number,
//   io: Server,
//   rooms: { [key: string]: Room },
// ) => {
//   OnAll(io, rooms);
//   await Deno.serve({
//     handler: io.handler(),
//     port: port,
//   });
// };

// const io = new Server({ cors: { origin: "*" } });
// const rooms: { [key: string]: Room } = {};
// await NewServer(8080, io, rooms);
