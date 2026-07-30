import axios from "axios";

export const getBlogs = async (params = {}) =>
  await axios.get(`${import.meta.env.VITE_API}/blogs`, { params });

export const getBlog = async (slug) =>
  await axios.get(`${import.meta.env.VITE_API}/blogs/${slug}`);

export const getAdminBlogs = async (authtoken) =>
  await axios.get(`${import.meta.env.VITE_API}/admin/blogs`, {
    headers: { authtoken },
  });

export const createBlog = async (payload, authtoken) =>
  await axios.post(`${import.meta.env.VITE_API}/admin/blogs`, payload, {
    headers: { authtoken },
  });

export const updateBlog = async (id, payload, authtoken) =>
  await axios.put(`${import.meta.env.VITE_API}/admin/blogs/${id}`, payload, {
    headers: { authtoken },
  });

export const deleteBlog = async (id, authtoken) =>
  await axios.delete(`${import.meta.env.VITE_API}/admin/blogs/${id}`, {
    headers: { authtoken },
  });
