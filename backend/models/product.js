const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
      text: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500000,
      text: true,
    },
    detail: {
      type: {},
      min: 10,
      max: 500000
    },
    content: {
      type: {},
      min: 10,
      max: 5000000
    },
    price: {
      type: Number,
      required: true,
      trim: true,
      maxlength: 32,
    },
    category: {
      type: ObjectId,
      ref: "Category",
    },
    subs: [
      {
        type: ObjectId,
        ref: "Sub",
      },
    ],
    quantity: Number,
    sold: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
    },
    shipping: {
      type: String,
      enum: ["Yes", "No"],
    },
    shippingProfile: {
      weightKg: { type: Number, min: 0, default: 0.5 },
      lengthCm: { type: Number, min: 0, default: 10 },
      widthCm: { type: Number, min: 0, default: 10 },
      heightCm: { type: Number, min: 0, default: 10 },
      shipsSeparately: { type: Boolean, default: false },
      fragile: { type: Boolean, default: false },
    },
    color: {
      type: String,
      enum: [
        "Black", "White", "Gray", "Silver", "Brown", "Red", "Orange", "Yellow",
        "Green", "Blue", "Navy", "Teal", "Purple", "Pink", "Gold", "Beige",
        "Clear", "Multicolor",
      ],
    },
    brand: { type: String, trim: true },
    brandRef: {
      type: ObjectId,
      ref: "Brand",
    },
    manufacturerPartNumber: { type: String, trim: true, index: true },
    sku: { type: String, trim: true, sparse: true, index: true },
    productType: { type: ObjectId, ref: "ProductType", index: true },
    tags: [{ type: ObjectId, ref: "Tag" }],
    specifications: [
      {
        attribute: { type: ObjectId, ref: "Attribute", required: true },
        value: String,
        numericValue: Number,
        booleanValue: Boolean,
        optionValues: [String],
      },
    ],
    options: [
      {
        name: { type: String, required: true, trim: true },
        values: [{ type: String, trim: true }],
      },
    ],
    variants: [
      {
        sku: { type: String, trim: true },
        optionValues: [
          {
            name: String,
            value: String,
          },
        ],
        price: Number,
        quantity: { type: Number, default: 0 },
        images: { type: Array, default: [] },
        active: { type: Boolean, default: true },
      },
    ],
    generations: [
      {
        type: ObjectId,
        ref: "Generation",
      },
    ],
    ratings: [
      {
        star: Number,
        postedBy: { type: ObjectId, ref: "User" },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
