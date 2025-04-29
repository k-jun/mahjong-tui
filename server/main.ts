import {
  OnServerConnection,
  OnServerJoinRoom,
  OnServerLeaveRoom,
} from "./server.ts";

import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { Room, User } from "../models/room.ts";

const io = new Server({ cors: { origin: "*" } });
const rooms: { [key: string]: Room } = {};
const portStr = Deno.env.get("PORT") || "8080";
const port = parseInt(portStr, 10);

rooms["debug"] = new Room(async (mjg) => {
  await io.to("debug").emit("output", "debug", mjg);
});

rooms["debug"].join(new User("1", true));
rooms["debug"].join(new User("2", true));
// rooms["debug"].join(new User("3", true));

OnServerConnection(io, rooms);
OnServerJoinRoom(io, rooms);
OnServerLeaveRoom(io, rooms);

Deno.serve({
  handler: io.handler(),
  port: port,
});
