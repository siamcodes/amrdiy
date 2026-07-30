const cloudinary = require("cloudinary").v2;
const { required } = require("../config/env");

const configure = () => cloudinary.config({
  cloud_name: required("CLOUDINARY_CLOUD_NAME"),
  api_key: required("CLOUDINARY_API_KEY"),
  api_secret: required("CLOUDINARY_API_SECRET"),
});

const transformations = {
  product: [{ width: 1600, height: 1600, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
  profile: [{ width: 512, height: 512, crop: "fill", gravity: "auto", quality: "auto:good", fetch_format: "auto" }],
  "blog-hero": [{ width: 1600, height: 900, crop: "fill", gravity: "auto", quality: "auto:good", fetch_format: "auto" }],
  "editor-image": [{ width: 1400, height: 1400, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
  "payment-slip": [{ width: 1800, height: 1800, crop: "limit", quality: "auto:good", fetch_format: "auto" }],
};

const uploadAsset = async (image, purpose) => {
  configure();
  return cloudinary.uploader.upload(image, {
    folder: `amrdiy/${purpose}`,
    resource_type: "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: transformations[purpose] || transformations.product,
  });
};

const destroyAsset = async (publicId) => {
  if (!publicId) return null;
  configure();
  return cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
};

const extractEditorImagePublicIds = (html) => {
  const ids = new Set();
  const source = String(html || "");
  const pattern = /https?:\/\/[^"'()\s]+\/amrdiy\/editor-image\/([^"'()?#\s]+)/gi;
  for (const match of source.matchAll(pattern)) {
    const filename = decodeURIComponent(match[1]).replace(/\.[a-z0-9]+$/i, "");
    if (/^[a-zA-Z0-9_-]+$/.test(filename)) {
      ids.add(`amrdiy/editor-image/${filename}`);
    }
  }
  return ids;
};

const isEditorImageReferenced = async (publicId) => {
  const Blog = require("../models/blog");
  const Product = require("../models/product");
  const marker = `/${publicId}`;
  const [blogReference, productReference] = await Promise.all([
    Blog.exists({ content: { $regex: marker } }),
    Product.exists({
      $or: [
        { description: { $regex: marker } },
        { content: { $regex: marker } },
        { detail: { $regex: marker } },
      ],
    }),
  ]);
  return Boolean(blogReference || productReference);
};

const destroyUnreferencedEditorImage = async (publicId) => {
  if (await isEditorImageReferenced(publicId)) {
    return { result: "still_referenced", public_id: publicId };
  }
  return destroyAsset(publicId);
};

const removeDeletedEditorImages = async (previousHtml, nextHtml) => {
  const previous = extractEditorImagePublicIds(previousHtml);
  const next = extractEditorImagePublicIds(nextHtml);
  const removed = [...previous].filter((publicId) => !next.has(publicId));
  if (!removed.length) return [];
  return Promise.allSettled(removed.map((publicId) =>
    destroyUnreferencedEditorImage(publicId)));
};

const removeAllEditorImages = async (...htmlValues) => {
  const publicIds = new Set();
  htmlValues.forEach((html) =>
    extractEditorImagePublicIds(html).forEach((publicId) => publicIds.add(publicId)));
  return Promise.allSettled([...publicIds].map((publicId) =>
    destroyUnreferencedEditorImage(publicId)));
};

module.exports = {
  uploadAsset,
  destroyAsset,
  extractEditorImagePublicIds,
  removeDeletedEditorImages,
  removeAllEditorImages,
};
