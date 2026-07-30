const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const shippingMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true, unique: true },
    provider: { type: ObjectId, ref: "ShippingProvider", required: true },
    service: { type: ObjectId, ref: "ShippingService", required: true },
    baseRate: { type: Number, required: true, min: 0, default: 0 },
    perKgRate: { type: Number, min: 0, default: 0 },
    freeShippingThreshold: { type: Number, min: 0, default: 0 },
    remoteAreaSurcharge: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingMethod", shippingMethodSchema);
