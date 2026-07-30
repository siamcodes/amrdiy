const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/auth");
const {
  listConfig,
  saveConfig,
  deleteConfig,
  shippingOptions,
  updateTracking,
} = require("../controllers/shipping");

router.get("/shipping/options", authCheck, shippingOptions);
router.get("/admin/shipping", authCheck, adminCheck, listConfig);
router.post("/admin/shipping/:resource", authCheck, adminCheck, saveConfig);
router.delete("/admin/shipping/:resource/:id", authCheck, adminCheck, deleteConfig);
router.put("/admin/orders/:orderId/tracking", authCheck, adminCheck, updateTracking);

module.exports = router;
