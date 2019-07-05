const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  foodLog: [
    {
      date: { type: Number },
      meals: [{ meal: String, item: String, calories: Number }]
    }
  ]
});

mongoose.model("User", userSchema);
