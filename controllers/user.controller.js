const mongoose = require("mongoose");
require("../db");
require("../models/user.model");

const UserModel = mongoose.model("User");

const findUser = async username => {
  return await UserModel.findOne({ username });
};

const getAllUsers = async () => {
  return await UserModel.find({});
};

const deleteUser = async username => {
  return await UserModel.findOneAndDelete({ username });
};

const updateUser = async (username, body) => {
  return await UserModel.findOneAndUpdate({ username }, body, { new: true });
};

const updateMealLog = async user => {
  return await user.save();
};

module.exports = {
  findUser,
  getAllUsers,
  deleteUser,
  updateUser,
  updateMealLog
};
