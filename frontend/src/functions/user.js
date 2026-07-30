import axios from "axios";

export const userCart = async (cart, authtoken) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/cart`,
    { cart },
    {
      headers: {
        authtoken,
      },
    }
  );

export const getUserCart = async (authtoken) =>
  await axios.get(`${import.meta.env.VITE_API}/user/cart`, {
    headers: {
      authtoken,
    },
  });

export const emptyUserCart = async (authtoken) =>
  await axios.delete(`${import.meta.env.VITE_API}/user/cart`, {
    headers: {
      authtoken,
    },
  });

export const saveUserAddress = async (authtoken, address) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/address`,
    { address },
    {
      headers: {
        authtoken,
      },
    }
  );


export const getUserAddress = async (authtoken) =>
  await axios.get(
    `${import.meta.env.VITE_API}/user/my-address`,
    {
      headers: {
        authtoken,
      },
    }
  );

export const getProfile = async (authtoken) =>
  await axios.get(
    `${import.meta.env.VITE_API}/user/profile`,
    {
      headers: {
        authtoken,
      },
    }
  );

export const updateProfile = async (profile, authtoken) =>
  await axios.put(`${import.meta.env.VITE_API}/user/profile`, profile, {
    headers: { authtoken },
  });

export const uploadUserImage = async (image, purpose, authtoken, previousPublicId) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/upload-image`,
    { image, purpose, previousPublicId },
    { headers: { authtoken } }
  );

export const getShippingOptions = async (authtoken) =>
  await axios.get(`${import.meta.env.VITE_API}/shipping/options`, {
    headers: { authtoken },
  });

export const applyCoupon = async (authtoken, coupon) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/cart/coupon`,
    { coupon },
    {
      headers: {
        authtoken,
      },
    }
  );

export const createOrder = async (stripeResponse, authtoken) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/order`,
    { stripeResponse },
    {
      headers: {
        authtoken,
      },
    }
  );

export const getUserOrders = async (authtoken) =>
  await axios.get(`${import.meta.env.VITE_API}/user/orders`, {
    headers: {
      authtoken,
    },
  });

export const getWishlist = async (authtoken) =>
  await axios.get(`${import.meta.env.VITE_API}/user/wishlist`, {
    headers: {
      authtoken,
    },
  });

export const removeWishlist = async (productId, authtoken) =>
  await axios.put(
    `${import.meta.env.VITE_API}/user/wishlist/${productId}`,
    {},
    {
      headers: {
        authtoken,
      },
    }
  );

export const addToWishlist = async (productId, authtoken) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/wishlist`,
    { productId },
    {
      headers: {
        authtoken,
      },
    }
  );

export const createCashOrderForUser = async (authtoken, COD, couponTrueOrFalse, checkout = {}) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/cash-order`,
    { couponApplied: couponTrueOrFalse, COD, ...checkout },
    {
      headers: {
        authtoken,
      },
    }
  );

export const createManualPaymentOrder = async (payload, authtoken) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/manual-payment-order`,
    payload,
    { headers: { authtoken } }
  );


  export const saveContact = async (title, description, authtoken) =>
  await axios.post(
    `${import.meta.env.VITE_API}/user/contact`,
    {  title, description },
    {
      headers: {
        authtoken,
      },
    }
  );
  
