const mongoose = require("mongoose");

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    group: { type: String, trim: true, default: "General", index: true },
    dataType: {
      type: String,
      enum: ["text", "number", "boolean", "select", "multiselect"],
      default: "text",
    },
    unit: { type: String, trim: true, maxlength: 24 },
    options: [{ type: String, trim: true }],
    filterable: { type: Boolean, default: true, index: true },
    comparable: { type: Boolean, default: true },
    required: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attribute", attributeSchema);
