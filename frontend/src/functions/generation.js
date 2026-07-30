import axios from "axios";

export const getGenerations = async () =>
    await axios.get(`${import.meta.env.VITE_API}/generations`);

export const getGeneration = async (slug) =>
    await axios.get(`${import.meta.env.VITE_API}/generation/${slug}`);

export const removeGeneration = async (slug, authtoken) =>
    await axios.delete(`${import.meta.env.VITE_API}/generation/${slug}`, {
        headers: {
            authtoken,
        },
    });

export const updateGeneration = async (slug, generation, authtoken) =>
    await axios.put(`${import.meta.env.VITE_API}/generation/${slug}`, generation, {
        headers: {
            authtoken,
        },
    });

export const createGeneration = async (generation, authtoken) =>
    await axios.post(`${import.meta.env.VITE_API}/generation`, generation, {
        headers: {
            authtoken,
        },
    });
