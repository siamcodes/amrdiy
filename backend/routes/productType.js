const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/auth");
const { create, list, read, update, remove, bySub } = require("../controllers/productType");

router.post("/product-type", authCheck, adminCheck, create);
router.get("/product-types", list);
router.get("/product-type/:slug", read);
router.put("/product-type/:slug", authCheck, adminCheck, update);
router.delete("/product-type/:slug", authCheck, adminCheck, remove);
router.get("/sub/product-types/:_id", bySub);

module.exports = router;
