const express = require("express");
const router = express.Router();
const { authCheck, adminCheck } = require("../middlewares/auth");
const { list, create, update, remove, overview } = require("../controllers/catalog");

router.get("/admin/catalog/overview", authCheck, adminCheck, overview);
router.get("/admin/catalog/:resource", authCheck, adminCheck, list);
router.post("/admin/catalog/:resource", authCheck, adminCheck, create);
router.put("/admin/catalog/:resource/:id", authCheck, adminCheck, update);
router.delete("/admin/catalog/:resource/:id", authCheck, adminCheck, remove);

module.exports = router;
