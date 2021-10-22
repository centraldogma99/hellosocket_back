import express from "express";
import { userModel } from "../database/db";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import bodyParser from "body-parser";
import auth from "../middlewares/auth";

const router = express.Router();

router.get('/', (req, res) => {
  res.send('hi');
})

router.post('/register', bodyParser.json(), async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).send("bad request");

    const oldUser = await userModel.findOne({ email });
    if (oldUser) return res.status(409).send("email already registered");

    const encrypted = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email: email.toLowerCase(),
      password: encrypted
    })

    // //토큰을 만들고 저장하는데 왜하는거임???
    // const token = jwt.sign(
    //   { user_id: user._id, email },
    //   process.env.TOKEN_KEY as jwt.Secret,
    //   {
    //     expiresIn: "2h"
    //   }
    // )
    // user.token = token;
    res.json(user);
  } catch (e) {
    console.error(e);
  }
})

router.post('/login', bodyParser.json(), async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send("bad request")

  const user = await userModel.findOne({ email });
  console.log(user);
  if (!user) return res.status(404).send("no such user, you should register");

  if (!await bcrypt.compare(password, user.password))
    return res.status(401).send("invalid credentials");

  const token = jwt.sign(
    { user_id: user._id, email, name: user.name },
    process.env.TOKEN_KEY as jwt.Secret,
    {
      expiresIn: "1h"
    }
  )
  // user.token = token;

  res.status(200).cookie('credential', token, { maxAge: 3600000 }).json(user);
})

router.get('/logout', (req, res) => {
  console.log("logout")
  return res.status(200).clearCookie("credential", { path: '/' }).send("successful");
})

router.get('/test', auth, (req, res) => {
  console.log((req as any).user);
  res.send("welcome!!")
})

export default router;