const ProductType = require("../models/productType");

const toSlug = (value) => value
  .trim()
  .replace(/\s+/g, "-")
  .replace("%", "เปอร์เซนต์")
  .replace(/[^\u0E00-\u0E7F\w-]+/g, "")
  .replace(/--+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLowerCase();

exports.create = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const productType = await ProductType.create({
      name,
      parent,
      slug: toSlug(name),
    });
    res.json(productType);
  } catch (error) {
    res.status(400).send("Create product type failed");
  }
};

exports.list = async (req, res) => {
  const items = await ProductType.find({})
    .populate("parent", "name slug parent")
    .sort({ name: 1 })
    .exec();
  res.json(items);
};

exports.read = async (req, res) => {
  const item = await ProductType.findOne({ slug: req.params.slug })
    .populate("parent", "name slug parent")
    .exec();
  if (!item) return res.status(404).send("Product type not found");
  res.json(item);
};

exports.update = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const updated = await ProductType.findOneAndUpdate(
      { slug: req.params.slug },
      { name, parent, slug: toSlug(name) },
      { new: true, runValidators: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(400).send("Product type update failed");
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await ProductType.findOneAndDelete({ slug: req.params.slug });
    if (!deleted) return res.status(404).send("Product type not found");
    res.json(deleted);
  } catch (error) {
    res.status(400).send("Product type delete failed");
  }
};

exports.bySub = async (req, res) => {
  const items = await ProductType.find({ parent: req.params._id })
    .sort({ name: 1 })
    .exec();
  res.json(items);
};
