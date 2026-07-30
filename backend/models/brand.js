const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: "Name is required",
            minlength: [2, "Too short"],
            maxlength: [32, "Too long"],
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            index: true,
        },
        code: { type: String, trim: true, uppercase: true, sparse: true },
        description: { type: String, trim: true, maxlength: 2000 },
        website: { type: String, trim: true },
        logo: { type: String, trim: true },
        active: { type: Boolean, default: true, index: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
