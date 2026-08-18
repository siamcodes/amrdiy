const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  videoUrl: { type: String, trim: true },
  durationMinutes: { type: Number, default: 0, min: 0 },
  preview: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: true });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
  lessons: { type: [lessonSchema], default: [] },
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 240 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  subtitle: { type: String, trim: true, maxlength: 300 },
  description: { type: String, required: true },
  thumbnail: { url: String, alt: String },
  price: { type: Number, required: true, default: 0, min: 0 },
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced", "all"], default: "all" },
  category: { type: String, trim: true, index: true },
  learningOutcomes: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  sections: { type: [sectionSchema], default: [] },
  instructor: { type: ObjectId, ref: "User", required: true },
  enrollmentCount: { type: Number, default: 0 },
}, { timestamps: true });

courseSchema.index({ title: "text", subtitle: "text", description: "text", category: "text" });
module.exports = mongoose.model("Course", courseSchema);
