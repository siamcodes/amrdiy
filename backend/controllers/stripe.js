const User = require("../models/user");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Coupon = require("../models/coupon");
const Stripe = require("stripe");
const { required } = require("../config/env");
const { getShippingQuote } = require("../services/shipping");

exports.createPaymentIntent = async (req, res) => {
  const stripe = new Stripe(required("STRIPE_SECRET"));
  const { couponApplied, shippingMethodId } = req.body;

  // later apply coupon
  // later calculate price

  // 1 find user
  const user = await User.findOne({ email: req.user.email }).exec();
  
  // 2 get user cart total
  const userCart = await Cart.findOne({
    orderedBy: user._id,
  }).populate("products.product", "shippingProfile").exec();
  const { cartTotal, totalAfterDiscount } = userCart;

  let finalAmount = 0;
  
  if (couponApplied && totalAfterDiscount) {
    finalAmount = totalAfterDiscount * 100;
  } else {
    finalAmount = cartTotal * 100;
  }
  let shipping = null;
  if (shippingMethodId) {
    shipping = await getShippingQuote({
      methodId: shippingMethodId,
      cart: userCart,
      subtotal: finalAmount / 100,
    });
    finalAmount += Math.round(shipping.fee * 100);
  }

  // create payment intent with order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalAmount,
    currency: "thb",
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
    cartTotal,
    totalAfterDiscount,
    payable: finalAmount,
    shipping,
  });
};
