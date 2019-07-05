const express = require("express");
const router = express.Router();
const {
  findUser,
  getAllUsers,
  deleteUser,
  updateUser,
  updateMealLog
} = require("../controllers/user.controller");
const { checkUserToken } = require("../controllers/jwt.controller");

// CHECK THAT USER IS AUTHORISED FROM JWT LOGIN
router.use("/", async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth) {
    try {
      const authCheck = await checkUserToken(auth);
      req.auth = authCheck; // returns object of username: username
      next();
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

// CHECK THAT USERNAME EXISTS, ELSE GIVE ERROR
router.param("username", async (req, res, next, username) => {
  try {
    const foundUser = await findUser(username);
    if (foundUser) {
      req.user = foundUser;
      if (req.user.username === req.auth.username) {
        next();
      } else {
        const err = new Error(
          `${req.auth.username} is not authorised to view username: ${username}`
        );
        err.statusCode = 401;
        next(err);
      }
    } else {
      const err = new Error(`cannot find user with username: ${username}`);
      err.statusCode = 400;
      next(err);
    }
  } catch (err) {
    next(err);
  }
});

// FORMAT DATE AS SECONDS
// WILL BE UPDATED TO INCLUDE VALIDATION
router.param("date", (req, res, next, date) => {
  req.date = new Date(date).getTime();
  next();
});

// FINDS SPECIFIC ITEM BY ID IN DATE FOOD LOG
// WILL BE UPDATED TO INCLUDE VALIDATION
router.param("id", async (req, res, next, id) => {
  const foundItem = req.user.foodLog
    .find(log => log.date === req.date)
    .meals.findIndex(el => (el._id ? el._id.toString() === id : false));
  if (typeof foundItem == "number") {
    req.itemIndex = foundItem;
    next();
  } else {
    const err = new Error(`cannot find food item with id: ${id}`);
    err.statusCode = 400;
    next(err);
  }
});

// CHECK THAT FOODLOG EXISTS (should be created by default in createNewUser()), ELSE GIVE ERROR
router.use("/:username/foodlog", (req, res, next) => {
  if (req.user.foodLog) {
    next();
  } else {
    const err = new Error(
      `cannot find food log for user: ${req.user.username}`
    );
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const output = await getAllUsers();
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
});

router.get("/:username", async (req, res, next) => {
  res.status(200).json(req.user);
});

router.put("/:username", async (req, res, next) => {
  try {
    // NEED TO ADD VALIDATION FOR UPDATE FIELDS
    const output = await updateUser(req.params.username, req.body);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
});

router.delete("/:username", async (req, res, next) => {
  try {
    const output = await deleteUser(req.params.username);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
});

router.get("/:username/foodlog", (req, res, next) => {
  res.status(200).json(req.user.foodLog);
});

router.get("/:username/foodlog/:date", (req, res, next) => {
  const foundDate = req.user.foodLog.find(log => log.date === req.date);
  if (foundDate) {
    const output = foundDate.meals
      .filter(obj => (req.query.meal ? obj.meal === req.query.meal : true))
      .filter(obj => (req.query.item ? obj.item === req.query.item : true));
    res.status(200).json(output);
  } else {
    const err = new Error(`no meal log for date: ${req.params.date}`);
    err.statusCode = 400;
    next(err);
  }
});

router.post("/:username/foodlog/:date", async (req, res, next) => {
  const foundDate = req.user.foodLog.find(log => log.date === req.date);
  if (!foundDate) {
    const newDateLog = {
      date: req.date,
      meals: [req.body]
    };
    req.user.foodLog.push(newDateLog);
    try {
      const output = await updateMealLog(req.user);
      res.status(201).json(output);
    } catch (err) {
      next(err);
    }
  } else {
    req.user.foodLog.find(log => log.date === req.date).meals.push(req.body);
    try {
      const output = await updateMealLog(req.user);
      res.status(201).json(output);
    } catch (err) {
      next(err);
    }
  }
});

router.put("/:username/foodlog/:date/:id", async (req, res, next) => {
  const updatedItem = {
    _id: req.user.foodLog.find(log => log.date === req.date).meals[
      req.itemIndex
    ]._id,
    meal: req.body.meal ? req.body.meal : false, // update to leave original fields if not included?
    item: req.body.item,
    calories: req.body.calories
  };
  req.user.foodLog
    .find(log => log.date === req.date)
    .meals.splice(req.itemIndex, 1, updatedItem);
  try {
    const output = await updateMealLog(req.user);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
});

router.delete("/:username/foodlog/:date/:id", async (req, res, next) => {
  req.user.foodLog
    .find(log => log.date === req.date)
    .meals.splice(req.itemIndex, 1);
  try {
    const output = await updateMealLog(req.user);
    res.status(200).json(output);
  } catch (err) {
    next(err);
  }
});

// ERROR HANDLER:
router.use((err, req, res, next) => {
  console.log("error", err);
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  res.status(err.statusCode).json({ message: err.message });
});

module.exports = router;
