const router = require("express").Router();
const course = require("../controllers/course");
const { adminCheck, authCheck, optionalAuth } = require("../middlewares/auth");
const multer = require("multer");
const os = require("os");
const courseMedia = require("../controllers/courseMedia");
const videoUpload = multer({ dest: os.tmpdir(), limits: { fileSize: 2 * 1024 * 1024 * 1024, files: 1 } });

router.get("/courses", course.list);
router.get("/courses/:slug", optionalAuth, course.read);
router.get("/course-media/:courseId/intro", courseMedia.streamIntro);
router.get("/course-media/:courseId/lessons/:lessonId", optionalAuth, courseMedia.streamLesson);
router.get("/user/courses", authCheck, course.myCourses);
router.post("/courses/:id/enroll", authCheck, course.enrollFree);
router.post("/courses/:id/payment-intent", authCheck, course.createPaymentIntent);
router.post("/courses/:id/confirm-payment", authCheck, course.confirmPayment);
router.put("/courses/:id/progress", authCheck, course.updateProgress);
router.get("/admin/courses", authCheck, adminCheck, course.adminList);
router.get("/admin/courses/:id", authCheck, adminCheck, course.adminRead);
router.post("/admin/course-media", authCheck, adminCheck, videoUpload.single("video"), courseMedia.upload);
router.post("/admin/courses", authCheck, adminCheck, course.create);
router.put("/admin/courses/:id", authCheck, adminCheck, course.update);
router.delete("/admin/courses/:id", authCheck, adminCheck, course.remove);

module.exports = router;
