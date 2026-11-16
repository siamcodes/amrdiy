"use strict";

const Coupon = require("../models/coupon");

/**
 * Re-price a populated cart using current catalog prices, never client values
 * or stale prices stored in the cart. Also validates inventory availability.
 */
exports.refreshCartPricing = async (cart, { applyCoupon = false } = {}) => {
  if (!cart?.products?.length) throw new Error("ไม่พบสินค้าในตะกร้า");

  let cartTotal = 0;
  for (const item of cart.products) {
    const product = item.product;
    const count = Number(item.count);
    const price = Number(product?.price);

    if (!product?._id || !Number.isSafeInteger(count) || count < 1
      || !Number.isFinite(price) || price < 0) {
      throw new Error("ข้อมูลสินค้าในตะกร้าไม่ถูกต้อง");
    }
    if (!Number.isFinite(Number(product.quantity)) || Number(product.quantity) < count) {
      throw new Error("สินค้าเหลือไม่เพียงพอ กรุณากลับไปปรับปรุงตะกร้า");
    }

    item.price = price;
    item.title = product.title || item.title || "";
    item.image = product.images?.[0]?.url || item.image || "";
    cartTotal += price * count;
  }

  cart.cartTotal = Number(cartTotal.toFixed(2));
  let subtotal = cart.cartTotal;
  let couponCode = "";

  if (applyCoupon) {
    couponCode = String(cart.couponCode || "").trim().toUpperCase();
    const coupon = couponCode
      ? await Coupon.findOne({ name: couponCode }).lean().exec()
      : null;
    if (!coupon || !coupon.expiry
      || new Date(coupon.expiry).getTime() <= Date.now()
      || !Number.isFinite(Number(coupon.discount))
      || Number(coupon.discount) <= 0
      || Number(coupon.discount) > 100) {
      throw new Error("คูปองไม่ถูกต้องหรือหมดอายุ");
    }
    subtotal = Number((cart.cartTotal * (1 - Number(coupon.discount) / 100)).toFixed(2));
    cart.totalAfterDiscount = subtotal;
  } else {
    cart.totalAfterDiscount = undefined;
  }

  if (cart.isModified()) {
    await cart.save();
  }
  return { cartTotal: cart.cartTotal, subtotal, couponCode };
};
