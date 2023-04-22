const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require("../models/Users");
const Blog = require("../models/Blog");
const cookieSession = require("cookie-session");
const cookieParser = require("cookie-parser");

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
    };
    res.send(userData);
  });
  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Please log in to access this resource" });
  };
  app.post("/addblog", async (req, ensureAuthenticated, res) => {
    const data = req.body;

    const newBlog = new Blog({
      blogName: data.formData.blogName,
      blogContent: data.formData.blogContent,
      blogAuthor: data.formData.blogAuthor,
      createdDate: Date.now(),
      userID: data.userID,
    });

    await newBlog.save();
  });
  app.get("/blogs", async (req, res) => {
    try {
      const blogs = await Blog.find();
      res.send(blogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching blogs" });
    }
  });
  app.get("/blog/:id", async (req, res) => {
    const blogId = req.params.id;
    try {
      const blogs = await Blog.findById(blogId);
      res.send(blogs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching blogs" });
    }
  });
  app.delete("/blogs/:id", async (req, res) => {
    const blogId = req.params.id;
    try {
      await Blog.findByIdAndDelete(blogId);
      res.status(200).send({ message: "Blog deleted successfully" });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  app.put("/updateblog/:id", async (req, res) => {
    const { id } = req.params;
    const { blogName, blogContent, blogAuthor } = req.body;
    try {
      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        { blogName, blogContent, blogAuthor, createdDate: Date.now() },
        { new: true }
      );
      res.status(200).json(updatedBlog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  });
};
