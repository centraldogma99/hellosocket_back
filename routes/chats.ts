import express from "express";
import { chatRoomModel } from "../database/db"
import authenticate from "../modules/authenticate";
import chunkArray from "../modules/chunkArray";
import Chat from "../types/Chat";

const router = express.Router();

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

const validateRoomId = (roomId: any) => {
  if (isNaN(roomId)) {
    return false;
  }
  const id = Number(roomId);
  if (!Number.isInteger(id)) {
    return false;
  }
  if (id <= 0) return false;
  return true;
}

router.get('/:roomId', async (req: any, res) => {
  try {
    if (!validateRoomId(req.params.roomId)) {
      return res.status(400).send("wrong room id");
    }
    const room = await chatRoomModel.findOne({ "_id": req.params.roomId });
    const chats = room?.chats;
    if (!room) {
      return res.status(404).send("ID not exist");
    }
    // if (room.isSecret && !authenticate(req.query.token)) res.status(401).send("Invalid token");
    if (!chats || chats.length === 0) return res.send({
      data: [],
      page: 0,
      totalPage: 0,
      totalChats: 0
    });

    const chunkedArray = chunkArray(chats, req.query.pageSize);
    if (chunkedArray.length <= req.query.page) {
      return res.status(400).send("Invalid page")
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

router.get('/:roomId/toggleSecret', async (req, res) => {
  if (!validateRoomId(req.params.roomId)) {
    res.status(400).send("wrong room id");
  }
  const room = await chatRoomModel.findOne({ "_id": Number(req.params.roomId) });
  if (!room) {
    res.status(404).send("ID not exist");
    return;
  }
  if (!room.isSecret) {
    room.isSecret = true;
  } else {
    if (authenticate(req.query.token)) {
      room.isSecret = false;
    } else {
      res.status(401).send("toggleSecret: Invalid token")
    }
  }
  res.send(req.params.roomId + " toggled as " + room.isSecret);
})

export default router;