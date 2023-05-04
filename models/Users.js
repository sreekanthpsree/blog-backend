const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  username: String,
  password: String,
  email: String,
  phonenumber: String,
  credit: Number,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
