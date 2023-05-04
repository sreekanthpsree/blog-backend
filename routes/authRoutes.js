require("dotenv").config();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("../models/Users");
const cookieSession = require("cookie-session");

module.exports = (app) => {
  app.use(
    cookieSession({
      name: "session",
      keys: ["key1", "key2"],
      maxAge: 24 * 60 * 60 * 1000,
    })
  );

  app.post("/signup", async (req, res) => {
    const { username, phonenumber, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { phonenumber }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email or phone number already in use" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      password: hashPassword,
      phonenumber,
      username,
      credit: 0,
    });
    await newUser.save();
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.username,
      phonenumber: newUser.phonenumber,
    };
    res
      .status(200)
      .json({ message: "User created successfully", user: newUser });
  });

  app.post("/login", passport.authenticate("local"), async (req, res) => {
    const user = req.user;

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      phonenumber: user.phonenumber,
      credit: user.credit,
    };
    res.send(userData);
  });
  app.get("/getUser/:id", async (req, res) => {
    const id = req.params.id;
    const user = await User.findById(id);
    res.json({ username: user.username, credit: user.credit });
  });
};
