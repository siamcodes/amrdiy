import axios from "axios";

export const getCoupons = async () =>
  await axios.get(`${import.meta.env.VITE_API}/coupons`);

export const removeCoupon = async (couponId, authtoken) =>
  await axios.delete(`${import.meta.env.VITE_API}/coupon/${couponId}`, {
    headers: {
      authtoken,
    },
  });

export const createCoupon = async (coupon, authtoken) =>
  await axios.post(
    `${import.meta.env.VITE_API}/coupon`,
    { coupon },
    {
      headers: {
        authtoken,
      },
    }
  );
