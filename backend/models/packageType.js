const mongoose = require("mongoose");

const packageTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true, unique: true },
    lengthCm: { type: Number, required: true, min: 0 },
    widthCm: { type: Number, required: true, min: 0 },
    heightCm: { type: Number, required: true, min: 0 },
    maxWeightKg: { type: Number, required: true, min: 0 },
    packagingWeightKg: { type: Number, min: 0, default: 0 },
    extraFee: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PackageType", packageTypeSchema);
