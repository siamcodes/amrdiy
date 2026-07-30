const express = require("express");

const router = express.Router();

//middlewares
const {authCheck, adminCheck} = require("../middlewares/auth")

// controllers
const { currentUser, register, verifyEmail } = require("../controllers/auth");

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.get("/current-user", authCheck, currentUser);
router.get("/current-admin", authCheck, adminCheck, currentUser);

module.exports = router;
