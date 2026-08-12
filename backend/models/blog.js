const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    excerpt: { type: String, trim: true, maxlength: 500 },
    content: { type: String, required: true },
    heroImage: {
      url: String,
      public_id: String,
      alt: String,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    featuredProducts: [{ type: ObjectId, ref: "Product" }],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    visibility: {
      type: String,
      enum: ["public", "members"],
      default: "public",
      index: true,
    },
    featured: { type: Boolean, default: false },
    publishedAt: Date,
    author: { type: ObjectId, ref: "User" },
    seoTitle: { type: String, trim: true, maxlength: 150 },
    seoDescription: { type: String, trim: true, maxlength: 250 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

blogSchema.index({ title: "text", excerpt: "text", content: "text", tags: "text" });
module.exports = mongoose.model("Blog", blogSchema);
