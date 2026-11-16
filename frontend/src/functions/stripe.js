import axios from "axios";

export const createPaymentIntent = (authtoken, coupon, shippingMethodId, checkout = {}) =>
    axios.post(
        `${import.meta.env.VITE_API}/create-payment-intent`,
        {
            couponApplied: coupon,
            shippingMethodId,
            shippingAddress: checkout.shippingAddress,
            billingAddress: checkout.billingAddress,
        },
        {
            headers: {
                authtoken,
            },
        }
    );
