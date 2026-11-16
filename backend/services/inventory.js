"use strict";

const Product = require("../models/product");

/**
 * Atomically reserves stock for each distinct product.
 * Returns an idempotent release function for callers to use if order
 * persistence fails. Each product update is conditional, so stock cannot
 * become negative under concurrent checkouts.
 *
 * This is a compensating reservation, not a multi-document transaction:
 * use MongoDB replica-set transactions for strict all-or-nothing semantics.
 */
exports.reserveInventory = async (items = [], session = null) => {
  const quantities = new Map();

  for (const item of items) {
    const productId = item.product?._id || item.product;
    const count = Number(item.count);
    if (!productId || !Number.isSafeInteger(count) || count < 1) {
      throw new Error("ข้อมูลสินค้าในตะกร้าไม่ถูกต้อง");
    }
    const key = String(productId);
    quantities.set(key, (quantities.get(key) || 0) + count);
  }

  const reservations = [...quantities.entries()]
    .sort(([a], [b]) => a.localeCompare(b));
  const reserved = [];

  const release = async () => {
    for (const item of [...reserved].reverse()) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { quantity: item.count, sold: -item.count } },
        session ? { session } : {}
      );
    }
    reserved.length = 0;
  };

  try {
    for (const [productId, count] of reservations) {
      const result = await Product.updateOne(
        { _id: productId, quantity: { $gte: count } },
        { $inc: { quantity: -count, sold: count } },
        session ? { session } : {}
      );

      if (result.modifiedCount !== 1) {
        throw new Error("สินค้าไม่เพียงพอหรือสินค้าถูกปิดใช้งาน กรุณาปรับปรุงตะกร้าสินค้า");
      }
      reserved.push({ productId, count });
    }
  } catch (error) {
    // A transaction will roll back all prior updates automatically.
    if (!session) {
      try {
        await release();
      } catch (rollbackError) {
        console.error("INVENTORY RESERVATION ROLLBACK FAILED", rollbackError);
        error.inventoryRollbackFailed = true;
      }
    }
    throw error;
  }

  let released = false;
  return async () => {
    if (released) return;
    released = true;
    await release();
  };
};
