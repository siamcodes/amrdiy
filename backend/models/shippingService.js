const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const shippingServiceSchema = new mongoose.Schema(
  {
    provider: { type: ObjectId, ref: "ShippingProvider", required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, lowercase: true },
    description: String,
    minDeliveryDays: { type: Number, default: 1, min: 0 },
    maxDeliveryDays: { type: Number, default: 3, min: 0 },
    maxWeightKg: { type: Number, default: 30, min: 0 },
    supportsCod: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

shippingServiceSchema.index({ provider: 1, code: 1 }, { unique: true });
module.exports = mongoose.model("ShippingService", shippingServiceSchema);
