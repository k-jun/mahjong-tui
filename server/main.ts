import {
  OnServerConnection,
  OnServerJoinRoom,
  OnServerLeaveRoom,
} from "./server.ts";

import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { Room } from "../models/room.ts";
import { CPU } from "../models/user.ts";

const io = new Server({ cors: { origin: "*" } });
const rooms: { [key: string]: Room } = {};
const portStr = Deno.env.get("PORT") || "8080";
const port = parseInt(portStr, 10);

rooms["debug"] = new Room(async (mjg) => {
  await io.emit("output", mjg);
});

rooms["debug"].join(new CPU("1"));
rooms["debug"].join(new CPU("2"));
rooms["debug"].join(new CPU("3"));

OnServerConnection(io, rooms);
OnServerJoinRoom(io, rooms);
OnServerLeaveRoom(io, rooms);

Deno.serve({
  handler: io.handler(),
  port: port,
});
