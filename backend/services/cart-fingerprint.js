"use strict";

const crypto = require("crypto");

exports.createCartFingerprint = (cart) => {
  const lines = (cart?.products || []).map((item) => {
    const productId = item.product?._id || item.product;
    return [
      String(productId || ""),
      Number(item.count),
      String(item.color || ""),
      Number(item.price),
    ];
  }).sort((a, b) => a[0].localeCompare(b[0]));

  return crypto.createHash("sha256").update(JSON.stringify(lines)).digest("hex");
};
