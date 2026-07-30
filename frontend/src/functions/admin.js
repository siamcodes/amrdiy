import axios from "axios";

export const getOrders = async (authtoken) =>
    await axios.get(`${import.meta.env.VITE_API}/admin/orders`, {
        headers: {
            authtoken,
        },
    });

export const getUsers = async (authtoken) =>
    await axios.get(`${import.meta.env.VITE_API}/admin/users`, {
        headers: {
            authtoken,
        },
    });

export const getAdminStats = async (authtoken) =>
    await axios.get(`${import.meta.env.VITE_API}/admin/stats`, {
        headers: {
            authtoken,
        },
    });

export const changeStatus = async (orderId, orderStatus, authtoken) =>
    await axios.put(
        `${import.meta.env.VITE_API}/admin/order-status`,
        { orderId, orderStatus },
        {
            headers: {
                authtoken,
            },
        }
    );

export const changePaymentStatus = async (orderId, paymentStatus, authtoken) =>
    await axios.put(
        `${import.meta.env.VITE_API}/admin/payment-status`,
        { orderId, paymentStatus },
        { headers: { authtoken } }
    );

export const getShippingConfig = async (authtoken) =>
    await axios.get(`${import.meta.env.VITE_API}/admin/shipping`, {
        headers: { authtoken },
    });

export const saveShippingConfig = async (resource, payload, authtoken) =>
    await axios.post(`${import.meta.env.VITE_API}/admin/shipping/${resource}`, payload, {
        headers: { authtoken },
    });

export const deleteShippingConfig = async (resource, id, authtoken) =>
    await axios.delete(`${import.meta.env.VITE_API}/admin/shipping/${resource}/${id}`, {
        headers: { authtoken },
    });

export const updateOrderTracking = async (orderId, payload, authtoken) =>
    await axios.put(`${import.meta.env.VITE_API}/admin/orders/${orderId}/tracking`, payload, {
        headers: { authtoken },
    });
