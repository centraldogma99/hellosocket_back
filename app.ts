// FIXME scrollLength 인자로 받아야 함

import express from "express";
import cors from "cors";
import chatsRouter from "./routes/chats"
import usersRouter from "./routes/users"
import { Server } from "socket.io"
import { chatRoomModel } from "./database/db"
import Chat from "./types/Chat";
import cookieParser from 'cookie-parser';
require("dotenv").config();

const port = 9000;
const app = express();

app.use(cors());
app.use(cookieParser());
app.use('/chats', chatsRouter);
app.use('/users', usersRouter);

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
  socket.on('join', async (roomId, username) => {
    try {
      let result = await chatRoomModel.findOne({ "_id": roomId })
      if (!result) {
        result = await chatRoomModel.create({ "_id": roomId, "chats": [], "isSecret": false });
      }
      socket.join(roomId);
      (<any>socket).username = username;
      socket.emit("joined", roomId, username);
      (<any>socket).activeRoom = roomId;
    } catch (e) {
      console.error(e);
    }
  })
  socket.on('chatEvent', (chat: Chat) => {
    console.log('chatEvent');
    chatRoomModel.updateOne({ "_id": (<any>socket).activeRoom }, {
      $push: {
        "chats": chat
      }
    }).exec();
    io.to((<any>socket).activeRoom).emit('chatEvent', chat)
  })
  socket.on('disconnect', async (reason) => {
    console.log('exit');
    try {
      let result = await chatRoomModel.findOne({ "_id": (<any>socket).activeRoom })
      if (!result) {
        throw Error("No result matching the id")
      }
      const chat = { author: (<any>socket).username, text: "님이 퇴장했습니다.", time: new Date() }
      chatRoomModel.updateOne({ "_id": (<any>socket).activeRoom }, {
        $push: {
          "chats": chat
        }
      })
      io.to((<any>socket).activeRoom).emit('chatEvent', chat)
    } catch (e) {
      console.error(e);
    }
  })
})