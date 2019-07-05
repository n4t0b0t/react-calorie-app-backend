const mongoose = require("mongoose");

const mongoURI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGODB_URI
    : global.__MONGO_URI__ || "mongodb://localhost:27017/calorietracker";

mongoose.connect(mongoURI, { useNewUrlParser: true });
mongoose.set("useFindAndModify", false);

const db = mongoose.connection;

// ERROR HANDLER
db.on("error", error => {
  console.error("An error occurred!", error);
});

db.once("open", () => {
  console.log("connected to mongodb");
});
