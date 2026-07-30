const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const { create, read, update, remove, list } = require("../controllers/generation");

// routes
router.post("/generation", authCheck, adminCheck, create);
router.get("/generations", list);
router.get("/generation/:slug", read);
router.put("/generation/:slug", authCheck, adminCheck, update);
router.delete("/generation/:slug", authCheck, adminCheck, remove);

module.exports = router;