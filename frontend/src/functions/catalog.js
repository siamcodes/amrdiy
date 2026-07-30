import axios from "axios";

const base = `${import.meta.env.VITE_API}/admin/catalog`;

export const getCatalogOverview = async () => axios.get(`${base}/overview`);
export const getCatalogItems = async (resource) => axios.get(`${base}/${resource}`);
export const createCatalogItem = async (resource, data) => axios.post(`${base}/${resource}`, data);
export const updateCatalogItem = async (resource, id, data) => axios.put(`${base}/${resource}/${id}`, data);
export const removeCatalogItem = async (resource, id) => axios.delete(`${base}/${resource}/${id}`);
