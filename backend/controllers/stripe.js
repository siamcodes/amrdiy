const crypto = require("crypto");
const User = require("../models/user");
const Cart = require("../models/cart");
const Stripe = require("stripe");
const { required } = require("../config/env");
const { getShippingQuote } = require("../services/shipping");
const { refreshCartPricing } = require("../services/cart-pricing");
const { createCartFingerprint } = require("../services/cart-fingerprint");

exports.createPaymentIntent = async (req, res) => {
  const stripe = new Stripe(required("STRIPE_SECRET"));
  const { couponApplied, shippingMethodId, shippingAddress, billingAddress } = req.body;
  const hashAddress = (address) => crypto
    .createHash("sha256")
    .update(JSON.stringify(address || {}))
    .digest("hex");
  const shippingAddressHash = hashAddress(shippingAddress);
  const billingAddressHash = hashAddress(billingAddress);

  // Prices and coupon validity are always recalculated by the server.
  const user = await User.findById(req.user._id).exec();
  if (!user) return res.status(401).json({ message: "ไม่พบบัญชีผู้ใช้" });
  
  // 2 get user cart total
  const userCart = await Cart.findOne({
    orderedBy: user._id,
  }).populate("products.product", "_id title price images quantity shippingProfile").exec();
  if (!userCart?.products?.length) {
    return res.status(400).json({ message: "ไม่พบสินค้าในตะกร้า" });
  }
  let pricing;
  try {
    pricing = await refreshCartPricing(userCart, { applyCoupon: Boolean(couponApplied) });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  const { cartTotal, subtotal, couponCode } = pricing;
  const cartFingerprint = createCartFingerprint(userCart);

  let finalAmount = Math.round(subtotal * 100);
  let shipping = null;
  if (shippingMethodId) {
    shipping = await getShippingQuote({
      methodId: shippingMethodId,
      cart: userCart,
      subtotal: finalAmount / 100,
    });
    finalAmount += Math.round(Number(shipping.fee || 0) * 100);
  }

  if (!Number.isSafeInteger(finalAmount) || finalAmount <= 0) {
    return res.status(400).json({ message: "ยอดชำระเงินไม่ถูกต้อง" });
  }

  // Bind the Payment Intent to the authenticated user and exact cart snapshot.
  // Stripe idempotency avoids creating duplicate intents for an unchanged checkout.
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(finalAmount),
    currency: "thb",
    metadata: {
      userId: String(user._id),
      cartId: String(userCart._id),
      shippingMethodId: shippingMethodId ? String(shippingMethodId) : "",
      amountSatang: String(finalAmount),
      couponCode,
      cartFingerprint,
      shippingAddressHash,
      billingAddressHash,
    },
  }, {
    idempotencyKey: `cart-checkout-${user._id}-${crypto.createHash("sha256").update(JSON.stringify({
      cartId: String(userCart._id),
      cartFingerprint,
      shippingMethodId: shippingMethodId ? String(shippingMethodId) : "",
      couponCode,
      shippingAddressHash,
      billingAddressHash,
      finalAmount,
    })).digest("hex")}`,
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
    cartTotal,
    totalAfterDiscount: couponCode ? subtotal : null,
    payable: finalAmount,
    shipping,
  });
};
