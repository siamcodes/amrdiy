const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const addressSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true, default: "ที่อยู่หลัก" },
        recipientName: { type: String, trim: true },
        phone: { type: String, trim: true },
        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        subdistrict: { type: String, trim: true },
        district: { type: String, trim: true },
        province: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true, default: "ประเทศไทย" },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true }
);

const billingSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ["individual", "company"], default: "individual" },
        name: { type: String, trim: true },
        taxId: { type: String, trim: true },
        branch: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        subdistrict: { type: String, trim: true },
        district: { type: String, trim: true },
        province: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true, default: "ประเทศไทย" },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: String,
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        username: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: String,
        passwordSalt: String,
        image: String,
        picture: String,
        profileImage: {
            url: String,
            public_id: String,
            width: Number,
            height: Number,
        },
        emailVerified: Date,
        email: {
            type: String,
            required: true,
            index: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            default: "subscriber",
        },
        cart: {
            type: Array,
            default: [],
        },
        address: String,
        phone: { type: String, trim: true },
        shippingAddresses: { type: [addressSchema], default: [] },
        billingProfile: { type: billingSchema, default: () => ({}) },
        preferredPaymentMethod: {
            type: String,
            enum: ["card", "paypal", "bank_transfer", "qr", "cod"],
            default: "card",
        },
        wishlist: [{ type: ObjectId, ref: "Product" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
