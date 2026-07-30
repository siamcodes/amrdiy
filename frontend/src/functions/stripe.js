import axios from "axios";

export const createPaymentIntent = (authtoken, coupon, shippingMethodId) =>
    axios.post(
        `${import.meta.env.VITE_API}/create-payment-intent`,
        { couponApplied: coupon, shippingMethodId },
        {
            headers: {
                authtoken,
            },
        }
    );
