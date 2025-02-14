import {
    OnServerConnection,
    OnServerJoinRoom,
    OnServerLeaveRoom,
} from "./server.ts";

import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { Room } from "../models/room.ts";

const io = new Server({ cors: { origin: "*" } });
const rooms: { [key: string]: Room } = {};
const portStr = Deno.env.get("PORT") || "8080";
const port = parseInt(portStr, 10);

OnServerConnection(io, rooms);
OnServerJoinRoom(io, rooms);
OnServerLeaveRoom(io, rooms);

await Deno.serve({
    handler: io.handler(),
    port: port,
});
