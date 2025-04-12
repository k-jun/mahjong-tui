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

rooms["debug"] = new Room(async (_) => {});

rooms["debug"].join(new CPU("1"));
rooms["debug"].join(new CPU("2"));
rooms["debug"].join(new CPU("3"));
rooms["debug"].join(new CPU("4"));

rooms["debug"].start();

OnServerConnection(io, rooms);
OnServerJoinRoom(io, rooms);
OnServerLeaveRoom(io, rooms);

Deno.serve({
  handler: io.handler(),
  port: port,
});
