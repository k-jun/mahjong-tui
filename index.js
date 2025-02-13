import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";



const socket = io("ws://localhost:8080");

// socket.on("refresh", (payload) => {
//     dispatch(Refresh, payload);
//   });
await socket.emit("join");

  
