const Brand = require("../models/brand");
const Tag = require("../models/tag");
const Attribute = require("../models/attribute");
const Product = require("../models/product");
const Generation = require("../models/generation");

const toSlug = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, "-")
  .replace("%", "เปอร์เซนต์")
  .replace(/[^\u0E00-\u0E7F\w-]+/g, "")
  .replace(/--+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLowerCase();

const resources = {
  brand: {
    model: Brand,
    fields: ["name", "code", "description", "website", "logo", "active"],
  },
  tag: {
    model: Tag,
    fields: ["name", "description", "color", "active"],
  },
  attribute: {
    model: Attribute,
    fields: [
      "name", "group", "dataType", "unit", "options", "filterable",
      "comparable", "required", "active", "sortOrder",
    ],
  },
};

const resource = (req) => resources[req.params.resource];
const payload = (body, fields) => Object.fromEntries(
  fields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]])
);

exports.list = async (req, res) => {
  const config = resource(req);
  if (!config) return res.status(404).json({ message: "Unknown catalog resource" });
  const items = await config.model.find({}).sort({ sortOrder: 1, name: 1 }).lean();
  res.json(items);
};

exports.create = async (req, res) => {
  const config = resource(req);
  if (!config) return res.status(404).json({ message: "Unknown catalog resource" });
  try {
    const data = payload(req.body, config.fields);
    data.slug = toSlug(data.name);
    const item = await config.model.create(data);
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ message: error.code === 11000 ? "ชื่อหรือรหัสนี้ถูกใช้งานแล้ว" : error.message });
  }
};

exports.update = async (req, res) => {
  const config = resource(req);
  if (!config) return res.status(404).json({ message: "Unknown catalog resource" });
  try {
    const data = payload(req.body, config.fields);
    if (data.name) data.slug = toSlug(data.name);
    const item = await config.model.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "ไม่พบข้อมูล" });
    res.json(item);
  } catch (error) {
    res.status(400).json({ message: error.code === 11000 ? "ชื่อหรือรหัสนี้ถูกใช้งานแล้ว" : error.message });
  }
};

exports.remove = async (req, res) => {
  const config = resource(req);
  if (!config) return res.status(404).json({ message: "Unknown catalog resource" });
  const inUse = req.params.resource === "brand"
    ? await Product.exists({ brandRef: req.params.id })
      || await Generation.exists({ parent: req.params.id })
    : req.params.resource === "tag"
      ? await Product.exists({ tags: req.params.id })
      : await Product.exists({ "specifications.attribute": req.params.id });
  if (inUse) {
    return res.status(409).json({ message: "ข้อมูลนี้ถูกใช้งานกับสินค้าอยู่ กรุณาปิดการใช้งานแทนการลบ" });
  }
  const item = await config.model.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "ไม่พบข้อมูล" });
  res.json(item);
};

exports.overview = async (req, res) => {
  const [brands, tags, attributes, filters] = await Promise.all([
    Brand.countDocuments({ active: { $ne: false } }),
    Tag.countDocuments({ active: true }),
    Attribute.countDocuments({ active: true }),
    Attribute.countDocuments({ active: true, filterable: true }),
  ]);
  res.json({ brands, tags, attributes, filters });
};
