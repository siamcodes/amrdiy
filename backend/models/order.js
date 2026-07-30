const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: ObjectId,
          ref: "Product",
        },
        count: Number,
        color: String,
      },
    ],
    paymentIntent: {},
    payment: {
      method: {
        type: String,
        enum: ["card", "paypal", "bank_transfer", "qr", "cod"],
        default: "card",
      },
      status: {
        type: String,
        enum: ["pending", "pending_review", "paid", "failed", "refunded"],
        default: "pending",
      },
      amount: Number,
      currency: { type: String, default: "thb" },
      provider: String,
      transactionId: String,
      slip: {
        url: String,
        public_id: String,
        uploadedAt: Date,
      },
    },
    shippingAddress: {},
    billingAddress: {},
    shipping: {
      methodId: { type: ObjectId, ref: "ShippingMethod" },
      methodName: String,
      providerId: { type: ObjectId, ref: "ShippingProvider" },
      providerName: String,
      serviceId: { type: ObjectId, ref: "ShippingService" },
      serviceName: String,
      fee: { type: Number, default: 0 },
      weightKg: Number,
      estimatedDelivery: {
        minDays: Number,
        maxDays: Number,
      },
    },
    packages: [
      {
        packageType: { type: ObjectId, ref: "PackageType" },
        name: String,
        weightKg: Number,
        lengthCm: Number,
        widthCm: Number,
        heightCm: Number,
        trackingNumber: String,
        trackingUrl: String,
        status: {
          type: String,
          enum: ["preparing", "ready", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception", "returned"],
          default: "preparing",
        },
        shippedAt: Date,
        deliveredAt: Date,
        events: [
          {
            status: String,
            description: String,
            location: String,
            occurredAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Cash On Delivery",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Completed",
      ],
    },
    orderedBy: { type: ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
