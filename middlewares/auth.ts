import jwt from 'jsonwebtoken'

const auth = (req, res, next) => {
  // const token = req.body?.token || req.query?.token || req.headers['x-access-token'];
  const token = req.cookies?.credential;
  if (!token) return res.status(403).send("token required");

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    req.user = decoded;
  } catch (e) {
    return res.status(401).send('bad toekn');
  }
  return next();
}

export default auth