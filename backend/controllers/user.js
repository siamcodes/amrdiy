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
  // console.log(req.body); // {cart: []}
  const { cart } = req.body;

  let products = [];

  const user = await User.findOne({ email: req.user.email }).exec();

  // check if cart with logged in user id already exist
  let cartExistByThisUser = await Cart.findOne({ orderedBy: user._id }).exec();

  if (cartExistByThisUser) {
    await cartExistByThisUser.deleteOne();
    console.log("removed old cart");
  }

  for (let i = 0; i < cart.length; i++) {
    let object = {};

    object.product = cart[i]._id;
    object.count = cart[i].count;
    object.color = cart[i].color;
    // get price for creating total
    //let { price } = await Product.findById(cart[i]._id).select("price").exec();
    //object.price = price;

    let productFromDb = await Product.findById(cart[i]._id)
      .select("price")
      .exec();
    object.price = productFromDb.price;

    products.push(object);
  }

  // console.log('products', products)

  let cartTotal = 0;
  for (let i = 0; i < products.length; i++) {
    cartTotal = cartTotal + products[i].price * products[i].count;
  }

  // console.log("cartTotal", cartTotal);

  let newCart = await new Cart({
    products,
    cartTotal,
    orderedBy: user._id,
  }).save();

  console.log("new cart---->", newCart);
  res.json({ ok: true });
};


exports.getUserAddress = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  res.json({ user });
}

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

  let cart = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "_id title price totalAfterDiscount")
    .exec();

  const { products, cartTotal, totalAfterDiscount } = cart;
  res.json({ products, cartTotal, totalAfterDiscount });
};

exports.emptyCart = async (req, res) => {
  console.log("empty cart");
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
  console.log("COUPON", coupon);

  const validCoupon = await Coupon.findOne({ name: coupon }).exec();
  if (validCoupon === null) {
    return res.json({
      err: "Invalid coupon",
    });
  }
  console.log("VALID COUPON", validCoupon);

  const user = await User.findOne({ email: req.user.email }).exec();

  let { products, cartTotal } = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "_id title price")
    .exec();

  console.log("cartTotal", cartTotal, "discount%", validCoupon.discount);

  // calculate the total after discount
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2); // 99.99

  console.log("------> ", totalAfterDiscount);

  Cart.findOneAndUpdate(
    { orderedBy: user._id },
    { totalAfterDiscount },
    { new: true }
  ).exec();

  res.json(totalAfterDiscount);
};

exports.createOrder = async (req, res) => {
  // console.log(req.body);
  // return;
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
  const user = await User.findOne({ email: req.user.email }).exec();
  const userCart = await Cart.findOne({ orderedBy: user._id })
    .populate("products.product", "shippingProfile")
    .exec();
  if (!userCart?.products?.length) {
    return res.status(400).json({ err: "ไม่พบสินค้าในตะกร้า" });
  }
  let shipping = null;
  if (stripeResponse.shippingMethodId) {
    shipping = await getShippingQuote({
      methodId: stripeResponse.shippingMethodId,
      cart: userCart,
      subtotal: Number(userCart.totalAfterDiscount || userCart.cartTotal),
    });
  }
  const shippingSatang = Math.round(Number(shipping?.fee || 0) * 100);
  const validAmounts = [
    Math.round(Number(userCart.cartTotal) * 100),
    userCart.totalAfterDiscount
      ? Math.round(Number(userCart.totalAfterDiscount) * 100)
      : null,
  ].filter((amount) => amount !== null).map((amount) => amount + shippingSatang);
  if (!validAmounts.includes(paymentIntent.amount) || paymentIntent.currency !== "thb") {
    return res.status(400).json({ err: "ยอดชำระไม่ตรงกับคำสั่งซื้อ" });
  }
  const { products } = userCart;

  let newOrder = await new Order({
    products,
    paymentIntent,
    payment: {
      method: "card",
      status: paymentIntent?.status === "succeeded" ? "paid" : "pending",
      amount: paymentIntent?.amount,
      currency: paymentIntent?.currency || "thb",
      provider: "stripe",
      transactionId: paymentIntent?.id,
    },
    shippingAddress: stripeResponse.shippingAddress || user.shippingAddresses?.find((item) => item.isDefault) || {},
    billingAddress: stripeResponse.billingAddress || user.billingProfile || {},
    shipping: shipping || {},
    orderedBy: user._id,
  }).save();

  // decrement quantity, increment sold
  let bulkOption = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id }, // IMPORTANT item.product
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, {});
  console.log("PRODUCT QUANTITY-- AND SOLD++", updated);

  console.log("NEW ORDER SAVED", newOrder);
  res.json({ ok: true });
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
      .populate("products.product", "shippingProfile")
      .exec();
    if (!userCart?.products?.length) {
      return res.status(400).json({ err: "ไม่พบสินค้าในตะกร้า" });
    }

    const subtotal = Number(
      couponApplied && userCart.totalAfterDiscount
        ? userCart.totalAfterDiscount
        : userCart.cartTotal
    );
    const shipping = req.body.shippingMethodId
      ? await getShippingQuote({ methodId: req.body.shippingMethodId, cart: userCart, subtotal })
      : null;
    const amount = subtotal + Number(shipping?.fee || 0);
    const order = await new Order({
      products: userCart.products,
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
    }).save();

    await Product.bulkWrite(
      userCart.products.map((item) => ({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { quantity: -item.count, sold: item.count } },
        },
      }))
    );
    res.json({ ok: true, orderId: order._id });
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
    .populate("products.product", "shippingProfile")
    .exec();

  let finalAmount = 0;
  if (couponApplied && userCart.totalAfterDiscount) {
    finalAmount = userCart.totalAfterDiscount * 100;
  } else {
    finalAmount = userCart.cartTotal * 100;
  }

  const shipping = req.body.shippingMethodId
    ? await getShippingQuote({
        methodId: req.body.shippingMethodId,
        cart: userCart,
        subtotal: finalAmount / 100,
      })
    : null;
  finalAmount += Math.round(Number(shipping?.fee || 0) * 100);

  let newOrder = await new Order({
    products: userCart.products,
    paymentIntent: {
      // id: uniqueid(),
      id: new ObjectId(),
      amount: finalAmount,
      currency: "thb",
      status: "Cash On Delivery",
      created: Date.now()/1000,
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
  }).save();

  // decrement quantity, increment sold
  let bulkOption = userCart.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id }, // IMPORTANT item.product
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, {});
  console.log("PRODUCT QUANTITY-- AND SOLD++", updated);

  console.log("NEW ORDER SAVED", newOrder);
  res.json({ ok: true });
};


exports.saveContact = async (req, res) => {
   console.log('Hi ',req.body);
  // return;
  const contacts = await User.findOneAndUpdate(
    { email: req.user.email },
    { title: req.body.title },
    { description: req.body.description },

  ).exec();
  res.json({ ok: true });

 /*  try {
    const { name, expiry, discount } = req.body.coupon;
    res.json(await new Coupon({ name, expiry, discount }).save());
  } catch (err) {
    console.log(err);
  } */

};
