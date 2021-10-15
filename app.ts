import express from "express";
import { Server } from "socket.io"
import Chat from "./types/Chat"
import mongoose from "mongoose"

const port = 9000;

const app = express();
let roomIdMap: { roomId: number, socketId: string }[] = [];

let collection: mongoose.Collection;

app.get('/', (_, res) => {
  res.send("Hello, socket.io!")
})


const server = app.listen(port, () => {
  console.log(`App listening at ${port} port`)
  mongoose.connect("mongodb://localhost:27017/chat");
  const db = mongoose.connection;
  collection = db.collection("chats")
})

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log("a user connected!");
  // roomIdMap = roomIdMap.concat({
  //   roomId: Number(socket.handshake.query.roomId),
  //   socketId: socket.id
  // })
  socket.on('join', async (roomId) => {
    try {
      let result = await collection.findOne({ "_id": roomId })
      if (!result) {
        const doc = await collection.insertOne({ "_id": roomId, "chats": [] });
        result = await collection.findOne({ "_id": doc.insertedId });
      }
      socket.join(roomId);
      console.log(result);
      socket.emit("joined", roomId, result?.chats);
      (<any>socket).activeRoom = roomId;
    } catch (e) {
      console.error(e);
    }
  })
  socket.on('chatEvent', (chat: Chat) => {
    collection.updateOne({ "_id": (<any>socket).activeRoom }, {
      $push: {
        "chats": chat
      }
    })
    // const roomId = roomIdMap.filter(roomIdObj => roomIdObj.socketId == socket.id)[0].roomId;
    // const socketIds = roomIdMap.filter(roomIdObj => roomIdObj.roomId == roomId).map(roomIdObj => roomIdObj.socketId);
    io.to((<any>socket).activeRoom).emit('chatEvent', chat)
  })
})