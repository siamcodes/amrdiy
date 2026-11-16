const express = require("express");

const router = express.Router();

//middlewares
const {authCheck, adminCheck} = require("../middlewares/auth")
const { registrationRateLimit } = require("../middlewares/rateLimit");

// controllers
const { currentUser, register, verifyEmail } = require("../controllers/auth");

router.post("/register", registrationRateLimit, register);
router.post("/verify-email", registrationRateLimit, verifyEmail);
router.get("/current-user", authCheck, currentUser);
router.get("/current-admin", authCheck, adminCheck, currentUser);

module.exports = router;
