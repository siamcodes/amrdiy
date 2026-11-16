"use strict";

const Stripe = require("stripe");
const Order = require("../models/order");
const { required } = require("../config/env");

exports.handleStripeWebhook = async (req, res) => {
  const stripe = new Stripe(required("STRIPE_SECRET"));
  const signature = req.headers["stripe-signature"];
  if (!signature) return res.status(400).send("Missing Stripe signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      required("STRIPE_WEBHOOK_SECRET")
    );
  } catch (error) {
    console.error("STRIPE WEBHOOK SIGNATURE ERROR:", error.message);
    return res.status(400).send("Invalid webhook signature");
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const order = await Order.findOneAndUpdate(
        { "payment.transactionId": intent.id },
        {
          $set: {
            "payment.status": "paid",
            "payment.amount": intent.amount_received || intent.amount,
            "payment.currency": intent.currency,
          },
        },
        { new: true }
      ).select("_id");

      // The browser may still be completing /user/order. Ask Stripe to retry
      // until the order exists; never acknowledge a successful charge that
      // cannot yet be reconciled to a local order.
      if (!order) {
        console.warn("Stripe payment succeeded but local order is not yet present:", intent.id);
        return res.status(500).send("Order not ready for payment reconciliation");
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      await Order.updateOne(
        { "payment.transactionId": intent.id, "payment.status": { $ne: "paid" } },
        { $set: { "payment.status": "failed" } }
      );
    }

    if (event.type === "payment_intent.canceled") {
      const intent = event.data.object;
      await Order.updateOne(
        { "payment.transactionId": intent.id, "payment.status": { $ne: "paid" } },
        { $set: { "payment.status": "failed" } }
      );
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("STRIPE WEBHOOK PROCESSING ERROR:", error);
    return res.status(500).send("Webhook processing failed");
  }
};
