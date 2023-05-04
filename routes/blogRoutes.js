require("dotenv").config();
const haveCredits = require("../helpers/haveCredits");
const User = require("../models/Users");
const Blog = require("../models/Blog");

module.exports = (app) => {
  app.post("/addblog", async (req, res) => {
    const data = req.body;
    const credit = await haveCredits(data.formData.userID);

    try {
      let user;
      if (data.formData.isFeatured) {
        if (credit) {
          user = await User.findByIdAndUpdate(
            data.formData.userID,
            { $inc: { credit: -1 } },
            { new: true }
          );
        } else {
          throw new Error("Not enough credits");
        }
      }
      const newBlog = new Blog({
        blogName: data.formData.blogName,
        blogContent: data.formData.blogContent,
        blogAuthor: data.formData.blogAuthor,
        createdDate: Date.now(),
        userID: data.formData.userID,
        isFeatured: data.formData.isFeatured,
      });
      await newBlog.save();

      res.status(201).json({ message: "Blog saved", user: user });
    } catch (error) {
      res.status(422).json({ message: "Not Enough credits" });
    }
  });
  app.get("/blogs/", async (req, res) => {
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

    const { blogName, blogContent, blogAuthor, isFeatured, userID } =
      req.body.formData;

    try {
      let user;
      const existingBlog = await Blog.findById(id);
      if (!existingBlog) {
        return res.status(404).json({ message: "Blog not found" });
      }
      user = await User.findById(userID);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (isFeatured && !existingBlog.isFeatured && user.credit < 1) {
        res.status(422).json({ message: "Insufficent credits" });
        return;
      }
      const updatedBlog = await Blog.findByIdAndUpdate(
        id,
        {
          blogName,
          blogContent,
          blogAuthor,
          createdDate: Date.now(),
          isFeatured,
        },
        { new: true }
      );
      if (isFeatured && !existingBlog.isFeatured) {
        user = await User.findByIdAndUpdate(
          userID,
          { $inc: { credit: -1 } },
          { new: true }
        );
      }
      res.status(200).json({ user: user });
    } catch (error) {
      res.status(422).json({ message: "Something went wrong" });
    }
  });
};
