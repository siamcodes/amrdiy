const Blog = require("../models/blog");
const Product = require("../models/product");
const {
  destroyAsset,
  removeDeletedEditorImages,
  removeAllEditorImages,
} = require("../services/cloudinary");

const toSlug = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/[^\u0E00-\u0E7F\w-]+/g, "")
  .replace(/--+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalize = async (body, current = null) => {
  const title = String(body.title || "").trim();
  const content = String(body.content || "").trim();
  if (!title) throw new Error("กรุณากรอกหัวข้อบทความ");
  if (!content || content === "<p><br></p>") throw new Error("กรุณากรอกเนื้อหาบทความ");
  const productIds = [...new Set((body.featuredProducts || []).map((item) => String(item?._id || item)))];
  if (productIds.length) {
    const count = await Product.countDocuments({ _id: { $in: productIds } });
    if (count !== productIds.length) throw new Error("ไม่พบสินค้าบางรายการที่เลือก");
  }
  const status = body.status === "published" ? "published" : "draft";
  return {
    title,
    slug: toSlug(body.slug || title),
    excerpt: String(body.excerpt || "").trim(),
    content,
    heroImage: body.heroImage || {},
    tags: [...new Set((body.tags || []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))],
    featuredProducts: productIds,
    status,
    visibility: body.visibility === "members" ? "members" : "public",
    featured: Boolean(body.featured),
    publishedAt: status === "published" ? (current?.publishedAt || new Date()) : null,
    seoTitle: String(body.seoTitle || "").trim(),
    seoDescription: String(body.seoDescription || "").trim(),
  };
};

const populate = (query) => query
  .populate("author", "name firstName lastName picture image")
  .populate("featuredProducts", "title slug price images brand quantity");

exports.publicList = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 9));
  const sort = req.query.sort === "oldest"
    ? { createdAt: 1, _id: 1 }
    : { createdAt: -1, _id: -1 };
  const query = { status: "published" };
  if (req.query.tag) query.tags = String(req.query.tag).toLowerCase();
  const search = String(req.query.search || "").trim().slice(0, 100);
  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    query.$or = [
      { title: pattern },
      { excerpt: pattern },
      { content: pattern },
      { tags: pattern },
    ];
  }
  const [items, total] = await Promise.all([
    populate(Blog.find(query).select("-content")).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Blog.countDocuments(query),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
};

exports.publicRead = async (req, res) => {
  const existing = await Blog.findOne({ slug: req.params.slug, status: "published" })
    .select("visibility")
    .lean();
  if (!existing) return res.status(404).json({ message: "ไม่พบบทความ" });
  if (existing.visibility === "members" && !req.user) {
    return res.status(401).json({
      code: "MEMBERS_ONLY",
      message: "บทความนี้สำหรับสมาชิกเท่านั้น กรุณาเข้าสู่ระบบ",
    });
  }

  const blog = await populate(Blog.findOneAndUpdate(
    { _id: existing._id },
    { $inc: { views: 1 } },
    { new: true }
  )).lean();
  if (!blog) return res.status(404).json({ message: "ไม่พบบทความ" });
  res.json(blog);
};

exports.adminList = async (req, res) => {
  res.json(await populate(Blog.find()).sort({ createdAt: -1, _id: -1 }).lean());
};

exports.create = async (req, res) => {
  try {
    const payload = await normalize(req.body);
    const blog = await Blog.create({ ...payload, author: req.user._id });
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.code === 11000 ? "Slug นี้ถูกใช้งานแล้ว" : error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const current = await Blog.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "ไม่พบบทความ" });
    const previousHeroPublicId = current.heroImage?.public_id;
    const previousContent = current.content;
    const payload = await normalize(req.body, current);
    Object.assign(current, payload);
    await current.save();
    await removeDeletedEditorImages(previousContent, current.content);
    if (previousHeroPublicId
      && previousHeroPublicId !== current.heroImage?.public_id
      && previousHeroPublicId.startsWith("amrdiy/blog-hero/")) {
      await destroyAsset(previousHeroPublicId).catch((error) =>
        console.error("DELETE OLD BLOG HERO ERR", error.message));
    }
    res.json(current);
  } catch (error) {
    res.status(400).json({ message: error.code === 11000 ? "Slug นี้ถูกใช้งานแล้ว" : error.message });
  }
};

exports.remove = async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) return res.status(404).json({ message: "ไม่พบบทความ" });
  if (blog.heroImage?.public_id?.startsWith("amrdiy/blog-hero/")) {
    await destroyAsset(blog.heroImage.public_id).catch((error) =>
      console.error("DELETE BLOG HERO ERR", error.message));
  }
  await removeAllEditorImages(blog.content);
  res.json({ ok: true });
};
