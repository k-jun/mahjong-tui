import { expect } from "jsr:@std/expect";
import { io as ioc, type Socket as ClientSocket } from "npm:socket.io-client";
import { Room } from "../models/room.ts";
import { OnAll, OnServerJoinRoom, OnServerLeaveRoom } from "./server.ts";
import {
  Server,
  Socket as ServerSocket,
} from "https://deno.land/x/socket_io@0.2.1/mod.ts";
import { afterAll, beforeAll, describe, it } from "jsr:@std/testing/bdd";
import { delay } from "https://deno.land/std@0.161.0/async/mod.ts";

describe("Socket.IO Server", () => {
  let io: Server, serverSocket: ServerSocket, clientSocket: ClientSocket;
  let server: Deno.HttpServer;
  let rooms: { [key: string]: Room };

  beforeAll(async () => {
    rooms = {};
    io = new Server({ cors: { origin: "*" } });

    io.on("connection", (socket: ServerSocket) => {
      serverSocket = socket;
      OnAll(socket, rooms);
    });
    OnServerLeaveRoom(io, rooms);
    OnServerJoinRoom(io, rooms);
    server = await Deno.serve({
      handler: io.handler(),
      port: 3000,
    });

    clientSocket = ioc("http://localhost:3000");
  });

  afterAll(() => {
    server.shutdown();
    clientSocket.disconnect();
    serverSocket.disconnect();
  });

  it("join-room && leave-room", async () => {
    rooms["test-room"] = new Room("test-room", async (mjg) => {
      await io.to("test-room").emit("output", mjg);
    });
    clientSocket.emit("join");
    await delay(1000);
    expect(rooms["test-room"].users[0].id).toEqual(serverSocket.id);

    clientSocket.emit("leave", "test-room");
    await delay(1000);
    expect(rooms).toEqual({});
  });
});
