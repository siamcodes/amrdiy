import axios from "axios";

const api = import.meta.env.VITE_API;

export const getProductTypes = async () => axios.get(`${api}/product-types`);
export const getSubProductTypes = async (_id) => axios.get(`${api}/sub/product-types/${_id}`);
export const createProductType = async (data, authtoken) =>
    axios.post(`${api}/product-type`, data, { headers: { authtoken } });
export const updateProductType = async (slug, data, authtoken) =>
    axios.put(`${api}/product-type/${slug}`, data, { headers: { authtoken } });
export const removeProductType = async (slug, authtoken) =>
    axios.delete(`${api}/product-type/${slug}`, { headers: { authtoken } });
