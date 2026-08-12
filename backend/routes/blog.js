const express = require("express");
const router = express.Router();
const { authCheck, adminCheck, optionalAuth } = require("../middlewares/auth");
const blog = require("../controllers/blog");

router.get("/blogs", blog.publicList);
router.get("/blogs/:slug", optionalAuth, blog.publicRead);
router.get("/admin/blogs", authCheck, adminCheck, blog.adminList);
router.post("/admin/blogs", authCheck, adminCheck, blog.create);
router.put("/admin/blogs/:id", authCheck, adminCheck, blog.update);
router.delete("/admin/blogs/:id", authCheck, adminCheck, blog.remove);

module.exports = router;
