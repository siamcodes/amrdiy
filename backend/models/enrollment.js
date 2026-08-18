const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const enrollmentSchema = new mongoose.Schema({
  course: { type: ObjectId, ref: "Course", required: true, index: true },
  student: { type: ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: ["active", "completed", "refunded"], default: "active" },
  payment: {
    method: { type: String, enum: ["free", "stripe"], default: "free" },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "thb" },
    transactionId: String,
  },
  completedLessons: [{ type: ObjectId }],
  enrolledAt: { type: Date, default: Date.now },
  completedAt: Date,
}, { timestamps: true });

enrollmentSchema.index({ course: 1, student: 1 }, { unique: true });
module.exports = mongoose.model("Enrollment", enrollmentSchema);
