const express = require("express");
// const cors = require("cors");
// const db = require("./db");
const { loginUser, signUpUser } = require("./controllers/account.controller");
const { signToken, checkUserToken } = require("./controllers/jwt.controller");

const app = express();

const userRouter = require("./routes/users");

app.use(express.json());

app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send(200);
});

app.post("/login", async (req, res, next) => {
  //   const { username, password } = req.body; // currently passing in username and pw as obj - will need to deconstruct later
  try {
    const user = await loginUser(req.body);
    if (user) {
      const token = signToken(user._id, user.username);

      return res.status(200).json({ username: user.username, jwt: token });
    } else {
      res.sendStatus(401);
    }
  } catch (err) {
    next(err);
  }
});

app.get("/secure", async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth) {
    try {
      const authCheck = await checkUserToken(auth);
      return res.json(authCheck);
    } catch (err) {
      err.statusCode = 401;
      next(err);
    }
  } else {
    const err = new Error("user is not authorised");
    err.statusCode = 401;
    next(err);
  }
});

app.post("/logout", async (req, res, next) => {});

app.post("/signup", async (req, res, next) => {
  try {
    const output = await signUpUser(req.body);
    res.status(201).json(`account ${output.username} has been created`);
  } catch (err) {
    next(err);
  }
});

// ERROR HANDLER:
app.use((err, req, res, next) => {
  console.log("error", err);
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  res.status(err.statusCode).json({ message: err.message });
});

module.exports = app;
