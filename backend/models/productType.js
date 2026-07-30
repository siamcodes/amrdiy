const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Name is required",
      minlength: [2, "Too short"],
      maxlength: [50, "Too long"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    parent: {
      type: ObjectId,
      ref: "Sub",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductType", productTypeSchema);
