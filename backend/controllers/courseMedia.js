const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const { streamCourseVideo, uploadCourseVideo } = require("../services/minio");

const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"]);

exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "กรุณาเลือกไฟล์วิดีโอ" });
  try {
    if (!allowedVideoTypes.has(req.file.mimetype)) return res.status(400).json({ message: "รองรับไฟล์ MP4, WebM, MOV และ M4V" });
    const extension = path.extname(req.file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".mp4";
    const objectName = `courses/${new Date().getUTCFullYear()}/${crypto.randomUUID()}${extension}`;
    const media = await uploadCourseVideo({ path: req.file.path, objectName, size: req.file.size, contentType: req.file.mimetype });
    res.json({ ...media, fileName: req.file.originalname });
  } catch (error) {
    res.status(500).json({ message: error.message || "อัปโหลดวิดีโอไม่สำเร็จ" });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
};

exports.streamIntro = async (req, res) => {
  const course = await Course.findById(req.params.courseId).select("introVideo status").lean();
  if (!course || course.status !== "published" || !course.introVideo?.objectName) return res.sendStatus(404);
  return pipeVideo(course.introVideo, req, res);
};

exports.streamLesson = async (req, res) => {
  const course = await Course.findOne({ _id: req.params.courseId, "sections.lessons._id": req.params.lessonId }).lean();
  if (!course || course.status !== "published") return res.sendStatus(404);
  const lesson = course.sections.flatMap((section) => section.lessons).find((item) => String(item._id) === req.params.lessonId);
  if (!lesson?.video?.objectName) return res.sendStatus(404);
  const enrolled = req.user && await Enrollment.exists({ course: course._id, student: req.user._id, status: { $in: ["active", "completed"] } });
  if (!lesson.preview && !enrolled && req.user?.role !== "admin") return res.sendStatus(403);
  return pipeVideo(lesson.video, req, res);
};

const pipeVideo = async (media, req, res) => {
  try {
    const result = await streamCourseVideo(media.objectName, req.headers.range);
    res.status(result.status);
    res.set({
      "Accept-Ranges": "bytes",
      "Content-Type": media.contentType || result.stat.metaData?.["content-type"] || "video/mp4",
      "Content-Length": result.length || result.stat.size,
      "Cache-Control": "private, max-age=3600",
    });
    if (result.status === 206) res.set("Content-Range", `bytes ${result.start}-${result.end}/${result.stat.size}`);
    result.stream.on("error", () => { if (!res.headersSent) res.sendStatus(500); else res.destroy(); });
    result.stream.pipe(res);
  } catch (_error) { if (!res.headersSent) res.sendStatus(404); }
};
