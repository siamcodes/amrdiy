import axios from "axios";

export const createProduct = async (product, authtoken) =>
  await axios.post(`${import.meta.env.VITE_API}/product`, product, {
    headers: {
      authtoken,
    },
  });

export const getProductsByCount = async (count) =>
  await axios.get(`${import.meta.env.VITE_API}/products/${count}`);

export const removeProduct = async (slug, authtoken) =>
  await axios.delete(`${import.meta.env.VITE_API}/product/${slug}`, {
    headers: {
      authtoken,
    },
  });

export const getProduct = async (slug) =>
  await axios.get(`${import.meta.env.VITE_API}/product/${slug}`);

export const updateProduct = async (slug, product, authtoken) =>
  await axios.put(`${import.meta.env.VITE_API}/product/${slug}`, product, {
    headers: {
      authtoken,
    },
  });


export const getProducts = async (sort, order, page) =>
  await axios.post(`${import.meta.env.VITE_API}/products`, {
    sort,
    order,
    page,
  });

export const getProductsCount = async () =>
  await axios.get(`${import.meta.env.VITE_API}/products/total`);

export const productStar = async (productId, star, authtoken) =>
  await axios.put(
    `${import.meta.env.VITE_API}/product/star/${productId}`,
    { star },
    {
      headers: {
        authtoken,
      },
    }
  );

export const getRelated = async (productId) =>
  await axios.get(`${import.meta.env.VITE_API}/product/related/${productId}`);

export const fetchProductsByFilter = async (arg) =>
  await axios.post(`${import.meta.env.VITE_API}/search/filters`, arg);


export const saveContent = async (slug, content, authtoken) =>
  await axios.put(
    `${import.meta.env.VITE_API}/product/${slug}/content`,
    { content },
    {
      headers: {
        authtoken,
      },
    }
  );

export const saveDetail = async (slug, detail, authtoken) =>
  await axios.put(
    `${import.meta.env.VITE_API}/product/${slug}/detail`,
    { detail },
    {
      headers: {
        authtoken,
      },
    }
  );
