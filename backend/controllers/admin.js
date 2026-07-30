const Order = require("../models/order");
const User = require("../models/user");
const Product = require("../models/product");

//orders, orderStatus

exports.orders = async (req, res) => {
  let allOrders = await Order.find({})
    .sort("-createdAt")
    .populate("products.product")
    .populate("orderedBy", "name firstName lastName username email image picture address createdAt")
    .exec();

  res.json(allOrders);
};

exports.users = async (req, res) => {
  const users = await User.find({})
    .select("name firstName lastName username email emailVerified role image picture address createdAt updatedAt")
    .sort("-createdAt")
    .lean();
  res.json(users);
};

exports.stats = async (req, res) => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 11, 1);
  twelveMonthsAgo.setUTCHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalOrders,
    totalProducts,
    revenueResult,
    statusBreakdown,
    monthlySales,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: "admin" } }),
    Order.countDocuments({}),
    Product.countDocuments({}),
    Order.aggregate([
      { $match: { orderStatus: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$paymentIntent.amount", 0] } } } },
    ]),
    Order.aggregate([
      { $group: { _id: "$orderStatus", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
    ]),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$paymentIntent.amount", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Product.find({})
      .select("title sold quantity")
      .sort({ sold: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    Order.find({})
      .select("orderedBy paymentIntent orderStatus createdAt")
      .populate("orderedBy", "name firstName lastName username email")
      .sort("-createdAt")
      .limit(10)
      .lean(),
  ]);

  res.json({
    summary: {
      users: totalUsers,
      orders: totalOrders,
      products: totalProducts,
      revenue: (revenueResult[0]?.total || 0) / 100,
    },
    orderStatuses: statusBreakdown.map((item) => ({
      label: item._id || "Unknown",
      value: item.value,
    })),
    monthlySales: monthlySales.map((item) => ({
      month: item._id,
      orders: item.orders,
      revenue: item.revenue / 100,
    })),
    topProducts: topProducts.map((item) => ({
      label: item.title,
      value: item.sold || 0,
      stock: item.quantity || 0,
    })),
    recentOrders: recentOrders.map((order) => ({
      _id: order._id,
      customer: order.orderedBy
        ? {
            name: order.orderedBy.name
              || [order.orderedBy.firstName, order.orderedBy.lastName].filter(Boolean).join(" "),
            username: order.orderedBy.username,
            email: order.orderedBy.email,
          }
        : null,
      amount: (order.paymentIntent?.amount || 0) / 100,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
    })),
  });
};

exports.orderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;

  const allowedStatuses = [
    "Not Processed",
    "Cash On Delivery",
    "Processing",
    "Dispatched",
    "Cancelled",
    "Completed",
  ];
  if (!allowedStatuses.includes(orderStatus)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  let updated = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus },
    { new: true, runValidators: true })
    .exec();

  res.json(updated);
};

exports.paymentStatus = async (req, res) => {
  const { orderId, paymentStatus } = req.body;
  const allowed = ["pending", "pending_review", "paid", "failed", "refunded"];
  if (!allowed.includes(paymentStatus)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }
  const update = {
    "payment.status": paymentStatus,
    "paymentIntent.status": paymentStatus,
  };
  if (paymentStatus === "paid") update.orderStatus = "Processing";
  const order = await Order.findByIdAndUpdate(orderId, { $set: update }, { new: true });
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(order);
};
