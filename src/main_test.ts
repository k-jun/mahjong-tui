// import { expect } from "jsr:@std/expect";
import { io as Client } from "npm:socket.io-client";
import { Room } from "../models/room.ts";
import { NewServer } from "./main.ts";
import { Server } from "https://deno.land/x/socket_io@0.2.1/mod.ts";

Deno.test("Socket.IO Server", async (t) => {
    let client1: any;

    const rooms: { [key: string]: Room } = {};
    const io = new Server({ cors: { origin: "*" } });
    NewServer(3000, io, rooms);

    await t.step("setup", () => {
        // io.listen(3000);
        client1 = Client("http://localhost:3000");
        // client2 = Client("http://localhost:3000");

        console.log(rooms);
        client1.close();
    });

    io.close();
});
