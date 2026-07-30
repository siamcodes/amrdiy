const mongoose = require("mongoose");

const shippingProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    code: { type: String, required: true, trim: true, lowercase: true, unique: true },
    logo: String,
    website: String,
    trackingUrlTemplate: String,
    contactPhone: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingProvider", shippingProviderSchema);
