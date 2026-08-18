const Stripe = require("stripe");
const Course = require("../models/course");
const Enrollment = require("../models/enrollment");
const { required } = require("../config/env");
const { destroyAsset, removeAllEditorImages, removeDeletedEditorImages } = require("../services/cloudinary");
const { removeCourseVideo } = require("../services/minio");

const slugify = (value) => String(value || "").trim().toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^\u0E00-\u0E7Fa-z0-9_-]+/gi, "")
  .replace(/-+/g, "-").replace(/^-|-$/g, "");

const cleanList = (items) => [...new Set((items || []).map((item) => String(item).trim()).filter(Boolean))];
const normalize = (body) => ({
  title: String(body.title || "").trim(),
  slug: slugify(body.slug || body.title),
  subtitle: String(body.subtitle || "").trim(),
  description: String(body.description || "").trim(),
  thumbnail: {
    url: String(body.thumbnail?.url || "").trim(),
    public_id: String(body.thumbnail?.public_id || "").trim(),
    alt: String(body.thumbnail?.alt || body.title || "").trim(),
    width: Number(body.thumbnail?.width) || undefined,
    height: Number(body.thumbnail?.height) || undefined,
  },
  introVideo: body.introVideo || {},
  price: Math.max(0, Number(body.price) || 0),
  status: body.status === "published" ? "published" : "draft",
  level: ["beginner", "intermediate", "advanced", "all"].includes(body.level) ? body.level : "all",
  category: String(body.category || "").trim(),
  learningOutcomes: cleanList(body.learningOutcomes),
  requirements: cleanList(body.requirements),
  sections: (body.sections || []).map((section, sectionIndex) => ({
    ...(section._id ? { _id: section._id } : {}),
    title: String(section.title || "").trim(),
    description: String(section.description || "").trim(),
    order: sectionIndex,
    lessons: (section.lessons || []).map((lesson, lessonIndex) => ({
      ...(lesson._id ? { _id: lesson._id } : {}),
      title: String(lesson.title || "").trim(),
      description: String(lesson.description || "").trim(),
      video: lesson.video || {},
      content: String(lesson.content || ""),
      durationMinutes: Math.max(0, Number(lesson.durationMinutes) || 0),
      preview: Boolean(lesson.preview),
      order: lessonIndex,
    })).filter((lesson) => lesson.title),
  })).filter((section) => section.title),
});

const courseSummary = "title slug subtitle thumbnail price level category enrollmentCount sections createdAt";

exports.list = async (req, res) => {
  const query = { status: "published" };
  if (req.query.category) query.category = String(req.query.category);
  if (req.query.search) query.$text = { $search: String(req.query.search).slice(0, 100) };
  const courses = await Course.find(query).select(courseSummary).sort({ createdAt: -1 }).lean();
  res.json(courses.map((course) => ({
    ...course,
    lessonCount: course.sections.reduce((total, section) => total + section.lessons.length, 0),
    durationMinutes: course.sections.reduce((total, section) => total
      + section.lessons.reduce((sum, lesson) => sum + lesson.durationMinutes, 0), 0),
    sections: undefined,
  })));
};

exports.read = async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, status: "published" })
    .populate("instructor", "name firstName lastName picture image").lean();
  if (!course) return res.status(404).json({ message: "ไม่พบคอร์ส" });
  const enrollment = req.user
    ? await Enrollment.findOne({ course: course._id, student: req.user._id, status: { $in: ["active", "completed"] } }).lean()
    : null;
  const canLearn = Boolean(enrollment || req.user?.role === "admin");
  course.introVideo = course.introVideo?.objectName
    ? { ...course.introVideo, playbackUrl: `/api/course-media/${course._id}/intro` }
    : {};
  course.sections = course.sections.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) => canLearn || lesson.preview
      ? { ...lesson, video: lesson.video?.objectName ? { ...lesson.video, playbackUrl: `/api/course-media/${course._id}/lessons/${lesson._id}` } : {} }
      : { ...lesson, video: {}, content: "" }),
  }));
  res.json({ course, enrolled: Boolean(enrollment), enrollment });
};

exports.myCourses = async (req, res) => {
  const items = await Enrollment.find({ student: req.user._id, status: { $ne: "refunded" } })
    .populate("course", "title slug subtitle thumbnail sections").sort({ enrolledAt: -1 }).lean();
  res.json(items.map((item) => {
    const lessons = item.course?.sections?.flatMap((section) => section.lessons) || [];
    return { ...item, progress: lessons.length ? Math.round((item.completedLessons.length / lessons.length) * 100) : 0 };
  }));
};

exports.enrollFree = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || course.status !== "published") return res.status(404).json({ message: "ไม่พบคอร์ส" });
  if (course.price > 0) return res.status(400).json({ message: "คอร์สนี้ต้องชำระเงิน" });
  const enrollment = await Enrollment.findOneAndUpdate(
    { course: course._id, student: req.user._id },
    { $setOnInsert: { payment: { method: "free", amount: 0 }, enrolledAt: new Date() }, $set: { status: "active" } },
    { upsert: true, new: true }
  );
  await Course.updateOne({ _id: course._id }, { $set: { enrollmentCount: await Enrollment.countDocuments({ course: course._id, status: { $ne: "refunded" } }) } });
  res.json(enrollment);
};

exports.createPaymentIntent = async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course || course.status !== "published") return res.status(404).json({ message: "ไม่พบคอร์ส" });
  if (course.price <= 0) return res.status(400).json({ message: "คอร์สนี้ลงทะเบียนได้ฟรี" });
  const stripe = new Stripe(required("STRIPE_SECRET"));
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(course.price * 100), currency: "thb",
    metadata: { courseId: String(course._id), studentId: String(req.user._id) },
  });
  res.json({ clientSecret: intent.client_secret, amount: intent.amount });
};

exports.confirmPayment = async (req, res) => {
  const stripe = new Stripe(required("STRIPE_SECRET"));
  const intent = await stripe.paymentIntents.retrieve(String(req.body.paymentIntentId || ""));
  if (intent.status !== "succeeded" || intent.metadata.courseId !== req.params.id
    || intent.metadata.studentId !== String(req.user._id)) {
    return res.status(400).json({ message: "ข้อมูลการชำระเงินไม่ถูกต้อง" });
  }
  const course = await Course.findById(req.params.id);
  if (!course || intent.amount !== Math.round(course.price * 100) || intent.currency !== "thb") {
    return res.status(400).json({ message: "ยอดชำระไม่ตรงกับราคาคอร์ส" });
  }
  const enrollment = await Enrollment.findOneAndUpdate(
    { course: course._id, student: req.user._id },
    { $set: { status: "active", payment: { method: "stripe", amount: intent.amount, currency: intent.currency, transactionId: intent.id }, enrolledAt: new Date() } },
    { upsert: true, new: true }
  );
  await Course.updateOne({ _id: course._id }, { $set: { enrollmentCount: await Enrollment.countDocuments({ course: course._id, status: { $ne: "refunded" } }) } });
  res.json(enrollment);
};

exports.updateProgress = async (req, res) => {
  const enrollment = await Enrollment.findOne({ course: req.params.id, student: req.user._id, status: { $in: ["active", "completed"] } });
  if (!enrollment) return res.status(403).json({ message: "ยังไม่ได้ลงทะเบียนคอร์สนี้" });
  const lessonId = String(req.body.lessonId || "");
  const course = await Course.findOne({ _id: req.params.id, "sections.lessons._id": lessonId }).lean();
  if (!course) return res.status(404).json({ message: "ไม่พบบทเรียน" });
  if (!enrollment.completedLessons.some((id) => String(id) === lessonId)) enrollment.completedLessons.push(lessonId);
  const lessonCount = course.sections.reduce((total, section) => total + section.lessons.length, 0);
  if (lessonCount && enrollment.completedLessons.length >= lessonCount) {
    enrollment.status = "completed";
    enrollment.completedAt = new Date();
  }
  await enrollment.save();
  res.json(enrollment);
};

exports.adminList = async (_req, res) => res.json(await Course.find().populate("instructor", "name email").sort({ createdAt: -1 }).lean());
exports.create = async (req, res) => {
  try {
    const payload = normalize(req.body);
    if (!payload.title || !payload.description || !payload.slug) throw new Error("กรุณากรอกชื่อและรายละเอียดคอร์ส");
    res.status(201).json(await Course.create({ ...payload, instructor: req.user._id }));
  } catch (error) { res.status(400).json({ message: error.code === 11000 ? "Slug นี้ถูกใช้งานแล้ว" : error.message }); }
};
exports.update = async (req, res) => {
  try {
    const current = await Course.findById(req.params.id).lean();
    if (!current) return res.status(404).json({ message: "ไม่พบคอร์ส" });
    const payload = normalize(req.body);
    const course = await Course.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: "ไม่พบคอร์ส" });
    const previousMedia = [current.introVideo?.objectName, ...current.sections.flatMap((section) => section.lessons.map((lesson) => lesson.video?.objectName))].filter(Boolean);
    const nextMedia = new Set([payload.introVideo?.objectName, ...payload.sections.flatMap((section) => section.lessons.map((lesson) => lesson.video?.objectName))].filter(Boolean));
    await Promise.allSettled(previousMedia.filter((objectName) => !nextMedia.has(objectName)).map(removeCourseVideo));
    if (current.thumbnail?.public_id && current.thumbnail.public_id !== payload.thumbnail.public_id
      && current.thumbnail.public_id.startsWith("amrdiy/course-cover/")) await destroyAsset(current.thumbnail.public_id);
    const previousContent = current.sections.flatMap((section) => section.lessons.map((lesson) => lesson.content || "")).join("\n");
    const nextContent = payload.sections.flatMap((section) => section.lessons.map((lesson) => lesson.content || "")).join("\n");
    await removeDeletedEditorImages(previousContent, nextContent);
    res.json(course);
  } catch (error) { res.status(400).json({ message: error.code === 11000 ? "Slug นี้ถูกใช้งานแล้ว" : error.message }); }
};
exports.remove = async (req, res) => {
  const enrollmentCount = await Enrollment.countDocuments({ course: req.params.id });
  if (enrollmentCount) return res.status(409).json({ message: "ไม่สามารถลบคอร์สที่มีผู้เรียนแล้ว ให้เปลี่ยนเป็นฉบับร่างแทน" });
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ message: "ไม่พบคอร์ส" });
  const media = [course.introVideo?.objectName, ...course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.video?.objectName))].filter(Boolean);
  await Promise.allSettled(media.map(removeCourseVideo));
  if (course.thumbnail?.public_id?.startsWith("amrdiy/course-cover/")) await destroyAsset(course.thumbnail.public_id);
  await removeAllEditorImages(...course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.content || "")));
  res.json({ ok: true });
};
