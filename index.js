const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieSession = require("cookie-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/Users");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const biilingRoutes = require("./routes/billingRoutes");

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.originalUrl === "/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.cookieKey],
    maxAge: 24 * 60 * 60 * 1000,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.mongoURI);

app.get("/", (req, res) => {
  res.send("Hellooo");
});

passport.use(
  new LocalStrategy(
    { usernameField: "email", passReqToCallback: true },
    async (req, email, password, done) => {
      const user = await User.findOne({ email });

      if (!user) {
        return done(null, false, { message: "Incorrect email" });
      }

      bcrypt.compare(password, user.password, (err, isValid) => {
        if (err) {
          return done(err);
        }
        if (!isValid) {
          return done(null, false, { message: "Incorrect password" });
        }
        const userObj = {
          id: user.id,
          email: user.email,
          name: user.username,
          phonenumber: user.phonenumber,
          // add other details of the user here
        };
        req.session.user = userObj;

        return done(null, user);
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
authRoutes(app);
blogRoutes(app);
biilingRoutes(app);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server on port 5000");
});
