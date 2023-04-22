const mongoose = require("mongoose");
const { Schema } = mongoose;

const blogSchema = new Schema({
  blogName: String,
  blogContent: String,
  blogAuthor: String,
  createdDate: Date,
  userID: String,
});

const Blog = mongoose.model("blog", blogSchema);

module.exports = Blog;
