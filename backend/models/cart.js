const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const cartSchema = new mongoose.Schema(
    {
        products: [
            {
                product: {
                    type: ObjectId,
                    ref: "Product",
                },
                count: Number,
                color: String,
                price: Number,
                title: String,
                image: String,
            },
        ],
        cartTotal: Number,
        totalAfterDiscount: Number,
        couponCode: { type: String, trim: true, uppercase: true },
        orderedBy: { type: ObjectId, ref: "User" },
    },
    { timestamps: true }
);

// One active cart per account. Apply the matching unique index with the migration
// script after checking and resolving any existing duplicate carts.
cartSchema.index(
    { orderedBy: 1 },
    {
        unique: true,
        name: "uniq_cart_ordered_by",
        partialFilterExpression: { orderedBy: { $type: "objectId" } },
    }
);

module.exports = mongoose.model("Cart", cartSchema);
