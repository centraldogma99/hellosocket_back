import mongoose from "mongoose";
import Chat from "../types/Chat";

interface ChatRoomSchema {
  _id: number,
  chats: Chat[],
  isSecret: boolean
}

interface UserSchema {
  name: string,
  email: string,
  password: string
}

const chatRoomSchema = new mongoose.Schema<ChatRoomSchema>({
  _id: Number,
  chats: [{
    author: String,
    text: String,
    time: Date
  }],
  isSecret: { type: Boolean, default: false }
})

const userSchema = new mongoose.Schema<UserSchema>({
  name: String,
  email: String,
  password: String
})

mongoose.connect("mongodb://localhost:27017/chat");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.on("open", () => {
  console.log("데이터베이스 연결 성공");
});
db.on("disconnected", () => {
  console.log("데이터베이스와 연결 끊어짐");
  // setTimeout(this.connectDB, 5000);
});

export const chatRoomModel = mongoose.model("chatRooms", chatRoomSchema);
export const userModel = mongoose.model("users", userSchema)

// class Mongo {
//   constructor() {
//     this.connectDB();
//   }

//   chatRoomModel: mongoose.Model<ChatRoomSchema>;

//   connectDB = () => {

//   };
// }