require("dotenv").config();

const mongoose = require("mongoose");
const env = require("../config/env");
const Order = require("../models/order");
const Cart = require("../models/cart");

const run = async () => {
  try {
    await mongoose.connect(env.mongoUri);

    const duplicates = await Order.aggregate([
      { $match: { "payment.transactionId": { $type: "string" } } },
      {
        $group: {
          _id: "$payment.transactionId",
          count: { $sum: 1 },
          orderIds: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 50 },
    ]);

    if (duplicates.length) {
      console.error("พบ Payment Transaction ID ซ้ำ กรุณาตรวจสอบก่อนสร้าง Unique Index:");
      console.error(JSON.stringify(duplicates, null, 2));
      process.exitCode = 1;
      return;
    }

    const duplicateCarts = await Cart.aggregate([
      { $match: { orderedBy: { $type: "objectId" } } },
      {
        $group: {
          _id: "$orderedBy",
          count: { $sum: 1 },
          cartIds: { $push: "$_id" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 50 },
    ]);

    if (duplicateCarts.length) {
      console.error("พบ Cart ซ้ำต่อ User กรุณารวม/ลบ Cart ที่ซ้ำก่อนสร้าง Unique Index:");
      console.error(JSON.stringify(duplicateCarts, null, 2));
      process.exitCode = 1;
      return;
    }

    await Cart.collection.createIndex(
      { orderedBy: 1 },
      {
        unique: true,
        name: "uniq_cart_ordered_by",
        partialFilterExpression: { orderedBy: { $type: "objectId" } },
      }
    );

    console.log("สร้าง Unique Index สำหรับ Cart ต่อ User สำเร็จ");

    await Order.collection.createIndex(
      { "payment.transactionId": 1 },
      {
        unique: true,
        name: "uniq_payment_transaction_id",
        partialFilterExpression: {
          "payment.transactionId": { $type: "string" },
        },
      }
    );

    console.log("สร้าง Unique Index สำหรับ payment.transactionId สำเร็จ");
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error("Payment index migration failed:", error.message);
  process.exitCode = 1;
});
