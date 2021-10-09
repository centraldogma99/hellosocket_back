import express from "express";
import { Server } from "socket.io"

const port = 9000;

const app = express();
let roomIdMap: { roomId: number, socketId: string }[] = [];

interface Chat {
  author: string,
  text: string,
  time: Date
}

app.get('/', (_, res) => {
  res.send("Hello, socket.io!")
})

const server = app.listen(port, () => {
  console.log(`App listening at ${port} port`)
})

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log("a user connected!");
  roomIdMap = roomIdMap.concat({
    roomId: Number(socket.handshake.query.roomId),
    socketId: socket.id
  })
  socket.on('chatEvent', (chat: Chat) => {
    const roomId = roomIdMap.filter(roomIdObj => roomIdObj.socketId == socket.id)[0].roomId;
    const socketIds = roomIdMap.filter(roomIdObj => roomIdObj.roomId == roomId).map(roomIdObj => roomIdObj.socketId);
    io.to(socketIds).emit('chatEvent', chat)
  })
})