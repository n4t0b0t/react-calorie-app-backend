const { secureUser } = require("./account.controller");
const jwt = require("jsonwebtoken");

const jwtSecret =
  process.env.NODE_ENV === "production" ? process.env.JWT_KEY : "secretKey";

const signToken = (id, username) => {
  const token = jwt.sign(
    { sub: id, iat: new Date().getTime(), username },
    jwtSecret,
    { expiresIn: 1000 * 60 * 60 }
  );
  return token;
};

const checkUserToken = async auth => {
  const token = auth.split(" ")[1] || "asdf";
  console.log("headerToken", token);
  const decoded = jwt.verify(token, jwtSecret, {
    clockTimestamp: new Date().getTime()
  });
  console.log("decoded", decoded);
  console.log("currentTime", new Date().getTime());
  try {
    const foundUser = await secureUser(decoded.sub);
    if (foundUser) {
      return { username: foundUser.username };
    }
  } catch (err) {
    return err;
  }
};

module.exports = { signToken, checkUserToken };
