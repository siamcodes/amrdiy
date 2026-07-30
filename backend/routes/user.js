const express = require("express");
const router = express.Router();

// middlewares
const { authCheck } = require("../middlewares/auth");

// controllers
const { 
    userCart, 
    getUserCart, 
    emptyCart, 
    saveAddress, 
    applyCouponToUserCart, 
    createOrder, 
    orders,
    addToWishlist,
    wishlist,
    removeFromWishlist,
    createCashOrder,
    getUserAddress,
    getProfile,
    updateProfile,
    createManualPaymentOrder,
    saveContact
} = require("../controllers/user");

router.post("/user/cart", authCheck, userCart); // save cart
router.get("/user/cart", authCheck, getUserCart); // get cart
router.delete("/user/cart", authCheck, emptyCart); // empty cart
router.post("/user/address", authCheck, saveAddress); //save address
router.get("/user/my-address", authCheck, getUserAddress) //get address 
router.get("/user/profile", authCheck, getProfile) //get profile
router.put("/user/profile", authCheck, updateProfile);
router.post("/user/contact", authCheck, saveContact); // save contact


router.post("/user/order", authCheck, createOrder); //stripe
router.post("/user/cash-order", authCheck, createCashOrder); // cod
router.post("/user/manual-payment-order", authCheck, createManualPaymentOrder);
router.get("/user/orders", authCheck, orders);

// coupon
router.post("/user/cart/coupon", authCheck, applyCouponToUserCart);

// wishlist
router.post("/user/wishlist", authCheck, addToWishlist);
router.get("/user/wishlist", authCheck, wishlist);
router.put("/user/wishlist/:productId", authCheck, removeFromWishlist);


// router.get("/user", (req, res) => {
//   res.json({
//     data: "hey you hit user API endpoint",
//   });
// });

module.exports = router;
