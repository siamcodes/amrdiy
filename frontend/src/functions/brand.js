import axios from "axios";

export const getBrands = async () =>
    await axios.get(`${import.meta.env.VITE_API}/brands`);

export const getBrand = async (slug) =>
    await axios.get(`${import.meta.env.VITE_API}/brand/${slug}`);

export const removeBrand = async (slug, authtoken) =>
    await axios.delete(`${import.meta.env.VITE_API}/brand/${slug}`, {
        headers: {
            authtoken,
        },
    });

export const updateBrand = async (slug, brand, authtoken) =>
    await axios.put(`${import.meta.env.VITE_API}/brand/${slug}`, brand, {
        headers: {
            authtoken,
        },
    });

export const createBrand = async (brand, authtoken) =>
    await axios.post(`${import.meta.env.VITE_API}/brand`, brand, {
        headers: {
            authtoken,
        },
    });

export const getBrandGenerations = async (_id) =>
    await axios.get(`${import.meta.env.VITE_API}/brand/generations/${_id}`);
