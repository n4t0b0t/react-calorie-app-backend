const mongoose = require("mongoose");
require("../db");
require("../models/user.model");
const bcrypt = require("bcrypt");

const UserModel = mongoose.model("User");

const loginUser = async input => {
  const foundUser = await UserModel.findOne({
    username: input.username
  });
  if (foundUser) {
    const hashDbPassword = foundUser.password;
    const checkPassword = await bcrypt.compare(input.password, hashDbPassword);
    if (checkPassword) {
      return { _id: foundUser._id, username: foundUser.username };
    }
  }
};

const secureUser = async input => {
  return await UserModel.findById(input);
};

// need to add validation for sign-up
const signUpUser = async input => {
  const hash = await bcryptHash(input.password);
  const newUser = new UserModel({
    username: input.username,
    password: hash,
    email: input.email,
    foodLog: []
  }); // creates blank foodlog for new user by default
  return await newUser.save();
};

const bcryptHash = async input => {
  const saltround = 10;
  const hash = await bcrypt.hash(input, saltround);
  return hash;
};

module.exports = { loginUser, secureUser, signUpUser };
