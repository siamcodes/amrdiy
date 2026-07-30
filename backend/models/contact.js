const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const contactSchema = new mongoose.Schema(
  {
    title: {
        type: String,
        trim: true,
        required: true,
        maxlength: 200,
        text: true,
      },
      description: {
        type: String,
        required: true,
        maxlength: 500000,
        text: true,
      },
      postedBy: {
        type: ObjectId,
        ref: 'User'
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);