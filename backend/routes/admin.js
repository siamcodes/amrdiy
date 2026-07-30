const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

const { orders, orderStatus, paymentStatus, users, stats } = require("../controllers/admin");

// routes
router.get("/admin/orders", authCheck, adminCheck, orders);
router.get("/admin/users", authCheck, adminCheck, users);
router.get("/admin/stats", authCheck, adminCheck, stats);
router.put("/admin/order-status", authCheck, adminCheck, orderStatus);
router.put("/admin/payment-status", authCheck, adminCheck, paymentStatus);

module.exports = router;
