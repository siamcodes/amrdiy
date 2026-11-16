const crypto = require("crypto");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const Order = require("../models/order");
const Contact = require("../models/contact");
const Stripe = require("stripe");
const { required } = require("../config/env");
const { getShippingQuote } = require("../services/shipping");
const { destroyAsset } = require("../services/cloudinary");

exports.userCart = async (req, res) => {
  const cart = req.body?.cart;
  if (!Array.isArray(cart) || cart.length > 100) {
    return res.status(400).json({ err: "รูปแบบตะกร้าสินค้าไม่ถูกต้อง" });
  }

  const user = await User.findById(req.user._id).select("_id").lean();
  if (!user) return res.status(401).json({ err: "ไม่พบบัญชีผู้ใช้" });

  const quantities = new Map();
  for (const item of cart) {
    const productId = String(item?._id || "");
    const count = Number(item?.count);
    if (!mongoose.isValidObjectId(productId) || !Number.isSafeInteger(count) || count < 1 || count > 99) {
      return res.status(400).json({ err: "รหัสสินค้าหรือจำนวนสินค้าไม่ถูกต้อง" });
    }
    quantities.set(productId, (quantities.get(productId) || 0) + count);
  }

  const ids = [...quantities.keys()];
  const catalog = ids.length
    ? await Product.find({ _id: { $in: ids } }).select("_id title price images quantity color").lean()
    : [];
  if (catalog.length !== ids.length) {
    return res.status(400).json({ err: "มีสินค้าบางรายการไม่พร้อมจำหน่าย" });
  }

  const byId = new Map(catalog.map((product) => [String(product._id), product]));
  const products = ids.map((productId) => {
    const product = byId.get(productId);
    const count = quantities.get(productId);
    if (!Number.isFinite(product.price) || product.price < 0) {
      throw new Error("ราคาสินค้าไม่ถูกต้อง");
    }
    if (Number.isFinite(product.quantity) && product.quantity < count) {
      throw new Error(`สินค้าเหลือไม่เพียงพอ (รหัสสินค้า ${productId})`);
    }
    const submitted = cart.find((item) => String(item._id) === productId);
    return {
      product: product._id,
      count,
      color: submitted?.color || product.color || "",
      price: product.price,
      title: product.title,
      image: product.images?.[0]?.url || "",
    };
  });

  const cartTotal = products.reduce((sum, item) => sum + item.price * item.count, 0);
  const savedCart = await Cart.findOneAndUpdate(
    { orderedBy: user._id },
    { $set: { products, cartTotal, totalAfterDiscount: null, couponCode: null } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json({ ok: true, cartId: savedCart._id, cartTotal });
};


exports.getUserAddress = async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("name firstName lastName phone address shippingAddresses billingProfile")
    .lean();

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({ user });
};

exports.getProfile = async (req, res) => {
  const user = await User.findOne({ email: req.user.email })
    .select("-passwordHash -passwordSalt")
    .exec();
  res.json({ user });
}

exports.updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      name,
      phone,
      image,
      picture,
      profileImage,
      shippingAddresses,
      billingProfile,
      preferredPaymentMethod,
    } = req.body;

    const allowedPaymentMethods = ["card", "paypal", "bank_transfer", "qr", "cod"];
    const update = {
      firstName: String(firstName || "").trim(),
      lastName: String(lastName || "").trim(),
      name: String(name || `${firstName || ""} ${lastName || ""}`).trim(),
      phone: String(phone || "").trim(),
      image: String(image || picture || "").trim(),
      picture: String(picture || image || "").trim(),
      shippingAddresses: Array.isArray(shippingAddresses)
        ? shippingAddresses.slice(0, 10)
        : [],
      billingProfile: billingProfile || {},
    };
    if (profileImage !== undefined) update.profileImage = profileImage || {};

    if (allowedPaymentMethods.includes(preferredPaymentMethod)) {
      update.preferredPaymentMethod = preferredPaymentMethod;
    }

    const previousProfilePublicId = req.user.profileImage?.public_id;
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: update },
      { new: true, runValidators: true }
    ).select("-passwordHash -passwordSalt");
    if (previousProfilePublicId
      && previousProfilePublicId !== user.profileImage?.public_id
      && previousProfilePublicId.startsWith("amrdiy/profile/")) {
      await destroyAsset(previousProfilePublicId).catch((error) =>
        console.error("DELETE OLD PROFILE IMAGE ERR", error.message));
    }

    res.json({ ok: true, user });
  } catch (error) {
    res.status(400).json({ err: error.message || "ไม่สามารถบันทึกโปรไฟล์ได้" });
  }
};

exports.getUserCart = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();

  const cart = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "_id title price images quantity")
    .lean()
    .exec();

  if (!cart) return res.json({ products: [], cartTotal: 0, totalAfterDiscount: null });
  res.json({
    products: cart.products || [],
    cartTotal: cart.cartTotal || 0,
    totalAfterDiscount: cart.totalAfterDiscount ?? null,
  });
};

exports.emptyCart = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();

  const cart = await Cart.findOneAndDelete({ orderedBy: user._id }).exec();
  res.json(cart);
};

exports.saveAddress = async (req, res) => {
  const userAddress = await User.findOneAndUpdate(
    { email: req.user.email },
    { address: req.body.address }
  ).exec();
  res.json({ ok: true });
};

exports.applyCouponToUserCart = async (req, res) => {
  const { coupon } = req.body;

  const normalizedCoupon = String(coupon || "").trim().toUpperCase();
  const validCoupon = await Coupon.findOne({ name: normalizedCoupon }).lean().exec();
  if (!validCoupon
    || !validCoupon.expiry
    || new Date(validCoupon.expiry).getTime() <= Date.now()
    || !Number.isFinite(Number(validCoupon.discount))
    || Number(validCoupon.discount) <= 0
    || Number(validCoupon.discount) > 100) {
    return res.status(400).json({ err: "คูปองไม่ถูกต้องหรือหมดอายุ" });
  }

  const user = await User.findById(req.user._id).select("_id").lean();
  const cart = await Cart.findOne({ orderedBy: user._id }).exec();
  if (!cart?.products?.length) {
    return res.status(400).json({ err: "ไม่พบสินค้าในตะกร้า" });
  }

  const totalAfterDiscount = Number(
    (cart.cartTotal - (cart.cartTotal * Number(validCoupon.discount)) / 100).toFixed(2)
  );
  await Cart.updateOne(
    { _id: cart._id, orderedBy: user._id },
    { $set: { totalAfterDiscount, couponCode: normalizedCoupon } }
  );
  res.json(totalAfterDiscount);
};

exports.createOrder = async (req, res) => {
  const stripeResponse = req.body.stripeResponse || {};
  const submittedIntent = stripeResponse.paymentIntent;
  if (!submittedIntent?.id) {
    return res.status(400).json({ err: "ยังไม่ได้รับการยืนยันการชำระเงินจาก Stripe" });
  }
  const stripe = new Stripe(required("STRIPE_SECRET"));
  const paymentIntent = await stripe.paymentIntents.retrieve(submittedIntent.id);
  if (paymentIntent.status !== "succeeded") {
    return res.status(400).json({ err: "Stripe ยังไม่ยืนยันการชำระเงิน" });
  }
  const user = await User.findById(req.user._id).exec();
  if (!user || paymentIntent.metadata?.userId !== String(user._id)) {
    return res.status(403).json({ err: "Payment Intent นี้ไม่ได้เป็นของบัญชีผู้ใช้ปัจจุบัน" });
  }
  const existingOrder = await Order.findOne({ "payment.transactionId": paymentIntent.id })
    .select("_id orderedBy")
    .lean();
  if (existingOrder) {
    if (String(existingOrder.orderedBy) !== String(user._id)) {
      return res.status(403).json({ err: "ไม่สามารถเข้าถึงคำสั่งซื้อนี้ได้" });
    }
    return res.status(200).json({ ok: true, orderId: existingOrder._id, duplicate: true });
  }
  const userCart = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "_id title price images quantity shippingProfile")
    .exec();
  if (!userCart?.products?.length) {
    return res.status(400).json({ err: "ไม่พบสินค้าในตะกร้า" });
  }
  if (paymentIntent.metadata?.cartId !== String(userCart._id)) {
    return res.status(409).json({ err: "ตะกร้าสินค้าเปลี่ยนแปลง กรุณาสร้างรายการชำระเงินใหม่" });
  }
  const submittedShippingMethodId = stripeResponse.shippingMethodId ? String(stripeResponse.shippingMethodId) : "";
  if ((paymentIntent.metadata?.shippingMethodId || "") !== submittedShippingMethodId) {
    return res.status(409).json({ err: "วิธีจัดส่งไม่ตรงกับรายการชำระเงิน กรุณาสร้างรายการใหม่" });
  }
  const hashAddress = (address) => crypto
    .createHash("sha256")
    .update(JSON.stringify(address || {}))
    .digest("hex");
  if (paymentIntent.metadata?.shippingAddressHash !== hashAddress(stripeResponse.shippingAddress)
    || paymentIntent.metadata?.billingAddressHash !== hashAddress(stripeResponse.billingAddress)) {
    return res.status(409).json({ err: "ที่อยู่จัดส่งหรือใบกำกับภาษีเปลี่ยนแปลง กรุณาสร้างรายการชำระเงินใหม่" });
  }
  const { createCartFingerprint } = require("../services/cart-fingerprint");
  if (paymentIntent.metadata?.cartFingerprint !== createCartFingerprint(userCart)) {
    return res.status(409).json({ err: "สินค้า จำนวน หรือราคาของตะกร้าเปลี่ยนแปลง กรุณาสร้างรายการชำระเงินใหม่" });
  }
  const couponCode = String(paymentIntent.metadata?.couponCode || "").trim().toUpperCase();
  if (couponCode && couponCode !== String(userCart.couponCode || "").toUpperCase()) {
    return res.status(409).json({ err: "คูปองของตะกร้าเปลี่ยนแปลง กรุณาสร้างรายการชำระเงินใหม่" });
  }
  let subtotal = Number(userCart.cartTotal || 0);
  if (couponCode) {
    const coupon = await Coupon.findOne({ name: couponCode }).lean().exec();
    if (!coupon || !coupon.expiry
      || new Date(coupon.expiry).getTime() <= Number(paymentIntent.created || 0) * 1000) {
      return res.status(400).json({ err: "คูปองหมดอายุ ไม่สามารถยืนยันคำสั่งซื้อได้" });
    }
    subtotal = Number(userCart.totalAfterDiscount);
    if (!Number.isFinite(subtotal) || subtotal < 0 || subtotal > Number(userCart.cartTotal)) {
      return res.status(400).json({ err: "ยอดส่วนลดในตะกร้าไม่ถูกต้อง" });
    }
  }

  let shipping = null;
  if (stripeResponse.shippingMethodId) {
    shipping = await getShippingQuote({
      methodId: stripeResponse.shippingMethodId,
      cart: userCart,
      subtotal,
    });
  }
  const expectedAmount = Math.round(subtotal * 100)
    + Math.round(Number(shipping?.fee || 0) * 100);
  if (expectedAmount !== paymentIntent.amount
    || Number(paymentIntent.metadata?.amountSatang) !== paymentIntent.amount
    || paymentIntent.currency !== "thb"
    || paymentIntent.amount_received !== paymentIntent.amount) {
    return res.status(400).json({ err: "ยอดชำระไม่ตรงกับคำสั่งซื้อ" });
  }
  const { products } = userCart;
  const orderProducts = products.map((item) => ({
    product: item.product._id,
    count: item.count,
    color: item.color,
    price: Number(item.price),
    title: item.title || item.product.title,
    image: item.image || item.product.images?.[0]?.url || "",
  }));
  const { createOrderWithInventory } = require("../services/create-order");
  try {
    const result = await createOrderWithInventory({
      products,
      orderData: {
        products: orderProducts,
        paymentIntent,
        payment: {
          method: "card",
          status: "paid",
          amount: paymentIntent.amount,
          currency: paymentIntent.currency || "thb",
          provider: "stripe",
          transactionId: paymentIntent.id,
        },
        shippingAddress: stripeResponse.shippingAddress || user.shippingAddresses?.find((item) => item.isDefault) || {},
        billingAddress: stripeResponse.billingAddress || user.billingProfile || {},
        shipping: shipping || {},
        orderedBy: user._id,
      },
    });
    return res.json({
      ok: true,
      orderId: result.order._id,
      transaction: result.transaction ? "committed" : "compensating-stock-update",
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicate = await Order.findOne({ "payment.transactionId": paymentIntent.id })
        .select("_id orderedBy")
        .lean();
      if (duplicate && String(duplicate.orderedBy) === String(user._id)) {
        return res.status(200).json({ ok: true, orderId: duplicate._id, duplicate: true });
      }
    }
    throw error;
  }
};

exports.createManualPaymentOrder = async (req, res) => {
  try {
    const { method, slip, shippingAddress, billingAddress, couponApplied } = req.body;
    if (!["bank_transfer", "qr"].includes(method)) {
      return res.status(400).json({ err: "รองรับเฉพาะการโอนผ่านธนาคารหรือ QR" });
    }
    if (!slip?.url || !slip?.public_id) {
      return res.status(400).json({ err: "กรุณาแนบสลิปการชำระเงิน" });
    }

    const user = await User.findOne({ email: req.user.email }).exec();
    const userCart = await Cart.findOne({ orderedBy: user._id })
      .populate("products.product", "_id title price images quantity shippingProfile")
      .exec();
    if (!userCart?.products?.length) {
      return res.status(400).json({ err: "ไม่พบสินค้าในตะกร้า" });
    }

    const { refreshCartPricing } = require("../services/cart-pricing");
    const pricing = await refreshCartPricing(userCart, { applyCoupon: Boolean(couponApplied) });
    const subtotal = pricing.subtotal;
    const shipping = req.body.shippingMethodId
      ? await getShippingQuote({ methodId: req.body.shippingMethodId, cart: userCart, subtotal })
      : null;
    const amount = subtotal + Number(shipping?.fee || 0);
    const orderProducts = userCart.products.map((item) => ({
      product: item.product._id,
      count: item.count,
      color: item.color,
      price: Number(item.price ?? item.product.price),
      title: item.product.title,
      image: item.product.images?.[0]?.url || "",
    }));
    const { createOrderWithInventory } = require("../services/create-order");
    const result = await createOrderWithInventory({
      products: userCart.products,
      orderData: {
        products: orderProducts,
        paymentIntent: {
          id: new ObjectId(),
          amount: Math.round(amount * 100),
          currency: "thb",
          status: "pending_review",
          payment_method_types: [method],
        },
        payment: {
          method,
          status: "pending_review",
          amount: Math.round(amount * 100),
          currency: "thb",
          provider: "manual",
          slip: { ...slip, uploadedAt: new Date() },
        },
        shippingAddress: shippingAddress || {},
        billingAddress: billingAddress || {},
        shipping: shipping || {},
        orderedBy: user._id,
        orderStatus: "Not Processed",
      },
    });
    return res.json({ ok: true, orderId: result.order._id, transaction: result.transaction ? "committed" : "compensating-stock-update" });
  } catch (error) {
    res.status(400).json({ err: error.message || "ไม่สามารถสร้างคำสั่งซื้อได้" });
  }
};

exports.orders = async (req, res) => {
  let user = await User.findOne({ email: req.user.email }).exec();

  let userOrders = await Order.find({ orderedBy: user._id })
    .populate("products.product")
    .exec();

  res.json(userOrders);
};

// addToWishlist wishlist removeFromWishlist
exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;

  const user = await User.findOneAndUpdate(
    { email: req.user.email },
    { $addToSet: { wishlist: productId } }
  ).exec();

  res.json({ ok: true });
};

exports.wishlist = async (req, res) => {
  const list = await User.findOne({ email: req.user.email })
    .select("wishlist")
    .populate("wishlist")
    .exec();

  res.json(list);
};

exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findOneAndUpdate(
    { email: req.user.email },
    { $pull: { wishlist: productId } }
  ).exec();

  res.json({ ok: true });
};

exports.createCashOrder = async (req, res) => {
  const { COD, couponApplied } = req.body;
  // if COD is true, create order with status of Cash On Delivery
  if (!COD) return res.status(400).send("Create cash order failed");

  const user = await User.findOne({ email: req.user.email }).exec();
  let userCart = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "_id title price images quantity shippingProfile")
    .exec();
  if (!userCart?.products?.length) {
    return res.status(400).json({ err: "ไม่พบสินค้าในตะกร้า" });
  }

  const { refreshCartPricing } = require("../services/cart-pricing");
  const pricing = await refreshCartPricing(userCart, { applyCoupon: Boolean(couponApplied) });
  let finalAmount = Math.round(pricing.subtotal * 100);

  const shipping = req.body.shippingMethodId
    ? await getShippingQuote({
        methodId: req.body.shippingMethodId,
        cart: userCart,
        subtotal: finalAmount / 100,
      })
    : null;
  finalAmount += Math.round(Number(shipping?.fee || 0) * 100);

  const orderProducts = userCart.products.map((item) => ({
    product: item.product._id,
    count: item.count,
    color: item.color,
    price: Number(item.price ?? item.product.price),
    title: item.product.title,
    image: item.product.images?.[0]?.url || "",
  }));
  const { createOrderWithInventory } = require("../services/create-order");
  const result = await createOrderWithInventory({
    products: userCart.products,
    orderData: {
      products: orderProducts,
      paymentIntent: {
        id: new ObjectId(),
        amount: finalAmount,
        currency: "thb",
        status: "Cash On Delivery",
        created: Date.now() / 1000,
        payment_method_types: ["cash"],
      },
      orderedBy: user._id,
      orderStatus: "Cash On Delivery",
      shippingAddress: req.body.shippingAddress || user.shippingAddresses?.find((item) => item.isDefault) || {},
      billingAddress: req.body.billingAddress || user.billingProfile || {},
      shipping: shipping || {},
      payment: {
        method: "cod",
        status: "pending",
        amount: finalAmount,
        currency: "thb",
        provider: "cash",
      },
    },
  });
  return res.json({ ok: true, orderId: result.order._id, transaction: result.transaction ? "committed" : "compensating-stock-update" });
};


exports.saveContact = async (req, res) => {
  const contacts = await User.findOneAndUpdate(
    { email: req.user.email },
    { title: req.body.title },
    { description: req.body.description },

  ).exec();
  res.json({ ok: true });
};
