// FIXME scrollLength 인자로 받아야 함

import express from "express";
import { Server } from "socket.io"
import Chat from "./types/Chat"
import mongoose from "mongoose"
import chunkArray from "./modules/chunkArray";
import cors from "cors";

const port = 9000;
const app = express();

let collection: mongoose.Collection;

app.get('/', (_, res) => {
  res.send("Hello, socket.io!")
})

app.use(cors())

interface chatReq {
  roomId: number,
  page: number,
  pageSize?: number
}

interface chatRes {
  data: Chat[],
  page: number,
  totalPage: number,
  totalChats: number
}
// roomId, page를 받아
app.get('/chats', async (req: any, res) => {
  try {
    const room = await collection.findOne({ "_id": req.query.roomId });
    const chats = room?.chats
    if (!room) res.status(404).send("ID not exist");

    const chunkedArray = chunkArray(chats, req.query.pageSize);
    if (chunkedArray.length <= req.query.page) {
      res.status(400).send("Invalid page")
    }
    res.send({
      data: chunkedArray[Number(req.query.page)],
      page: req.query.page,
      totalPage: chunkedArray.length - 1,
      totalChats: chats.length,
    });
  } catch (e) {
    console.error(e);
  }
})

app.get('/chats/length', async (req, res) => {
  try {
    const room = await collection.findOne({ "_id": Number(req.query.roomId) });
    if (!room) {
      res.status(404).send("ID not exist");
      return;
    }

    res.send({
      length: room.chats.length
    })
  } catch (e) {
    console.error(e);
  }
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
  socket.on('join', async (roomId, username) => {
    try {
      let result = await collection.findOne({ "_id": roomId })
      if (!result) {
        const doc = await collection.insertOne({ "_id": roomId, "chats": [] });
        result = await collection.findOne({ "_id": doc.insertedId });
      }
      socket.join(roomId);
      socket.emit("joined", roomId, username);
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
    io.to((<any>socket).activeRoom).emit('chatEvent', chat)
  })
})