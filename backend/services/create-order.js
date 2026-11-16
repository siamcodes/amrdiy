"use strict";

const mongoose = require("mongoose");
const Order = require("../models/order");
const { reserveInventory } = require("./inventory");

/**
 * Create an order and decrement inventory.
 *
 * Replica set / sharded MongoDB: use a real multi-document transaction.
 * Standalone MongoDB: retain conditional stock updates with compensation so
 * the existing VPS keeps working until it is converted to a single-node
 * replica set. The fallback is deliberately not described as atomic.
 */
exports.createOrderWithInventory = async ({ products, orderData }) => {
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  const supportsTransactions = ["ReplicaSetWithPrimary", "Sharded"].includes(topologyType);

  if (supportsTransactions) {
    const session = await mongoose.startSession();
    try {
      let createdOrder;
      await session.withTransaction(async () => {
        await reserveInventory(products, session);
        createdOrder = await new Order(orderData).save({ session });
      }, {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      });
      return { order: createdOrder, transaction: true };
    } finally {
      await session.endSession();
    }
  }

  const releaseInventory = await reserveInventory(products);
  try {
    const order = await new Order(orderData).save();
    return { order, transaction: false };
  } catch (error) {
    await releaseInventory();
    throw error;
  }
};
