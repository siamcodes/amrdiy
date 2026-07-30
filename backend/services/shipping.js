const ShippingMethod = require("../models/shippingMethod");

const calculateCartWeight = (products = []) =>
  products.reduce((total, item) => {
    const weight = Number(item.product?.shippingProfile?.weightKg || 0.5);
    return total + weight * Number(item.count || 0);
  }, 0);

const getShippingQuote = async ({ methodId, cart, subtotal }) => {
  const method = await ShippingMethod.findOne({ _id: methodId, active: true })
    .populate("provider")
    .populate("service")
    .lean();
  if (!method || !method.provider?.active || !method.service?.active) {
    throw new Error("ไม่พบวิธีจัดส่งที่เลือก");
  }
  const weightKg = Math.max(0.1, calculateCartWeight(cart.products));
  if (method.service.maxWeightKg && weightKg > method.service.maxWeightKg) {
    throw new Error("น้ำหนักสินค้าเกินขีดจำกัดของบริการจัดส่ง");
  }
  const fee = method.freeShippingThreshold > 0 && subtotal >= method.freeShippingThreshold
    ? 0
    : Math.max(0, Number(method.baseRate) + Math.max(0, weightKg - 1) * Number(method.perKgRate || 0));
  return {
    methodId: method._id,
    methodName: method.name,
    providerId: method.provider._id,
    providerName: method.provider.name,
    serviceId: method.service._id,
    serviceName: method.service.name,
    fee: Math.round(fee * 100) / 100,
    weightKg: Math.round(weightKg * 1000) / 1000,
    estimatedDelivery: {
      minDays: method.service.minDeliveryDays,
      maxDays: method.service.maxDeliveryDays,
    },
    supportsCod: Boolean(method.service.supportsCod),
  };
};

module.exports = { getShippingQuote };
