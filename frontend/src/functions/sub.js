import axios from "axios";

export const getSubs = async () =>
    await axios.get(`${import.meta.env.VITE_API}/subs`);

export const getSub = async (slug) =>
    await axios.get(`${import.meta.env.VITE_API}/sub/${slug}`);

export const removeSub = async (slug, authtoken) =>
    await axios.delete(`${import.meta.env.VITE_API}/sub/${slug}`, {
        headers: {
            authtoken,
        },
    });

export const updateSub = async (slug, sub, authtoken) =>
    await axios.put(`${import.meta.env.VITE_API}/sub/${slug}`, sub, {
        headers: {
            authtoken,
        },
    });

export const createSub = async (sub, authtoken) =>
    await axios.post(`${import.meta.env.VITE_API}/sub`, sub, {
        headers: {
            authtoken,
        },
    });
