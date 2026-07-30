const ShippingProvider = require("../models/shippingProvider");
const ShippingService = require("../models/shippingService");
const ShippingMethod = require("../models/shippingMethod");
const PackageType = require("../models/packageType");
const Cart = require("../models/cart");
const User = require("../models/user");
const Order = require("../models/order");
const { getShippingQuote } = require("../services/shipping");

const models = {
  providers: ShippingProvider,
  services: ShippingService,
  methods: ShippingMethod,
  packages: PackageType,
};

exports.listConfig = async (req, res) => {
  const [providers, services, methods, packages] = await Promise.all([
    ShippingProvider.find().sort("name").lean(),
    ShippingService.find().populate("provider", "name code").sort("name").lean(),
    ShippingMethod.find().populate("provider", "name code").populate("service", "name code").sort("sortOrder name").lean(),
    PackageType.find().sort("name").lean(),
  ]);
  res.json({ providers, services, methods, packages });
};

exports.saveConfig = async (req, res) => {
  try {
    const Model = models[req.params.resource];
    if (!Model) return res.status(404).json({ message: "Unknown shipping resource" });
    const item = req.body._id
      ? await Model.findByIdAndUpdate(req.body._id, req.body, { new: true, runValidators: true })
      : await Model.create(req.body);
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteConfig = async (req, res) => {
  const Model = models[req.params.resource];
  if (!Model) return res.status(404).json({ message: "Unknown shipping resource" });
  await Model.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
};

exports.shippingOptions = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    const cart = await Cart.findOne({ orderedBy: user._id })
      .populate("products.product", "shippingProfile");
    if (!cart) return res.json([]);
    const methods = await ShippingMethod.find({ active: true })
      .populate({ path: "provider", match: { active: true } })
      .populate({ path: "service", match: { active: true } })
      .sort("sortOrder name")
      .lean();
    const subtotal = Number(cart.totalAfterDiscount || cart.cartTotal || 0);
    const options = await Promise.all(methods.filter((m) => m.provider && m.service).map(async (method) => {
      try {
        return await getShippingQuote({ methodId: method._id, cart, subtotal });
      } catch {
        return null;
      }
    }));
    res.json(options.filter(Boolean));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTracking = async (req, res) => {
  try {
    const { packageId, package: packageData } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const provider = order.shipping?.providerId
      ? await ShippingProvider.findById(order.shipping.providerId).lean()
      : null;
    const trackingUrl = packageData.trackingNumber && provider?.trackingUrlTemplate
      ? provider.trackingUrlTemplate.replace("{trackingNumber}", encodeURIComponent(packageData.trackingNumber))
      : packageData.trackingUrl;

    if (packageId) {
      const current = order.packages.id(packageId);
      if (!current) return res.status(404).json({ message: "Package not found" });
      Object.assign(current, packageData, { trackingUrl });
      current.events.push({
        status: packageData.status || current.status,
        description: packageData.eventDescription || "อัปเดตสถานะพัสดุ",
        location: packageData.location,
        occurredAt: new Date(),
      });
    } else {
      order.packages.push({
        ...packageData,
        trackingUrl,
        events: [{
          status: packageData.status || "preparing",
          description: packageData.eventDescription || "สร้างรายการพัสดุ",
          location: packageData.location,
          occurredAt: new Date(),
        }],
      });
    }
    if (packageData.status === "picked_up" || packageData.status === "in_transit") {
      order.orderStatus = "Dispatched";
    }
    if (order.packages.length && order.packages.every((item) => item.status === "delivered")) {
      order.orderStatus = "Completed";
    }
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
