const express = require("express");
const router = express.Router();

// middlewares
const { authCheck, adminCheck } = require("../middlewares/auth");

// controller
const { create, read, update, remove, list,  getGenerations } = require("../controllers/brand");

// routes
router.post("/brand", authCheck, adminCheck, create);
router.get("/brands", list);
router.get("/brand/:slug", read);
router.put("/brand/:slug", authCheck, adminCheck, update);
router.delete("/brand/:slug", authCheck, adminCheck, remove);
router.get("/brand/generations/:_id", getGenerations);

module.exports = router;