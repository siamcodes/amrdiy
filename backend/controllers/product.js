const Product = require("../models/product");
const User = require("../models/user");
const Category = require("../models/category");
const Sub = require("../models/sub");
const ProductType = require("../models/productType");
const Brand = require("../models/brand");
const Tag = require("../models/tag");
const Attribute = require("../models/attribute");
const {
  destroyAsset,
  removeDeletedEditorImages,
  removeAllEditorImages,
} = require("../services/cloudinary");

const id = (value) => value?._id || value || undefined;
const ids = (values) => [...new Set((values || []).map(id).filter(Boolean).map(String))];
const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const toSlug = (value) => String(value || "")
  .trim()
  .replace(/\s+/g, "-")
  .replace("%", "เปอร์เซนต์")
  .replace(/[^\u0E00-\u0E7F\w-]+/g, "")
  .replace(/--+/g, "-")
  .replace(/^-+|-+$/g, "")
  .toLowerCase();

const normalizeProduct = async (body, { partial = false } = {}) => {
  const product = {};
  const direct = [
    "title", "description", "detail", "content", "shipping", "color",
    "manufacturerPartNumber", "sku",
  ];
  direct.forEach((field) => {
    if (body[field] !== undefined) product[field] =
      typeof body[field] === "string" ? body[field].trim() : body[field];
  });
  if (body.price !== undefined) product.price = number(body.price);
  if (body.quantity !== undefined) product.quantity = Math.max(0, number(body.quantity));
  if (body.images !== undefined) product.images = Array.isArray(body.images) ? body.images : [];
  if (body.shippingProfile !== undefined) {
    product.shippingProfile = {
      weightKg: Math.max(0, number(body.shippingProfile?.weightKg, 0.5)),
      lengthCm: Math.max(0, number(body.shippingProfile?.lengthCm, 10)),
      widthCm: Math.max(0, number(body.shippingProfile?.widthCm, 10)),
      heightCm: Math.max(0, number(body.shippingProfile?.heightCm, 10)),
      shipsSeparately: Boolean(body.shippingProfile?.shipsSeparately),
      fragile: Boolean(body.shippingProfile?.fragile),
    };
  }

  if (body.category !== undefined) product.category = id(body.category);
  if (body.subs !== undefined) product.subs = ids(body.subs);
  if (body.productType !== undefined) product.productType = id(body.productType) || null;
  if (body.brandRef !== undefined) product.brandRef = id(body.brandRef) || null;
  if (body.generations !== undefined) product.generations = ids(body.generations);
  if (body.tags !== undefined) product.tags = ids(body.tags);

  if (body.specifications !== undefined) {
    const seen = new Set();
    product.specifications = (body.specifications || [])
      .map((item) => ({
        attribute: id(item.attribute),
        value: item.value === undefined ? undefined : String(item.value).trim(),
        numericValue: item.numericValue === undefined ? undefined : number(item.numericValue),
        booleanValue: item.booleanValue === undefined ? undefined : Boolean(item.booleanValue),
        optionValues: [...new Set((item.optionValues || []).map(String).map((value) => value.trim()).filter(Boolean))],
      }))
      .filter((item) => item.attribute && !seen.has(String(item.attribute)) && seen.add(String(item.attribute)));
  }

  if (body.options !== undefined) {
    const seen = new Set();
    product.options = (body.options || [])
      .map((item) => ({
        name: String(item.name || "").trim(),
        values: [...new Set((item.values || []).map(String).map((value) => value.trim()).filter(Boolean))],
      }))
      .filter((item) => item.name && item.values.length && !seen.has(item.name.toLowerCase())
        && seen.add(item.name.toLowerCase()));
  }

  if (body.variants !== undefined) {
    const seenSkus = new Set();
    product.variants = (body.variants || [])
      .map((item) => ({
        sku: String(item.sku || "").trim(),
        optionValues: (item.optionValues || []).map((option) => ({
          name: String(option.name || "").trim(),
          value: String(option.value || "").trim(),
        })).filter((option) => option.name && option.value),
        price: Math.max(0, number(item.price, product.price || 0)),
        quantity: Math.max(0, number(item.quantity)),
        images: Array.isArray(item.images) ? item.images : [],
        active: item.active !== false,
      }))
      .filter((item) => item.sku && !seenSkus.has(item.sku.toLowerCase())
        && seenSkus.add(item.sku.toLowerCase()));
  }

  if (!partial || product.title !== undefined) {
    if (!product.title) throw new Error("กรุณากรอกชื่อสินค้า");
    product.slug = toSlug(product.title);
  }
  if (!partial) {
    if (!product.description || product.description === "<p><br></p>") {
      throw new Error("กรุณากรอกรายละเอียดสินค้า");
    }
    if (!Number.isFinite(product.price) || product.price < 0) throw new Error("ราคาสินค้าไม่ถูกต้อง");
    if (!product.category) throw new Error("กรุณาเลือกหมวดหลัก");
  }

  const [category, selectedSubs, productType, brand, tags, attributes] = await Promise.all([
    product.category ? Category.findById(product.category).lean() : null,
    product.subs?.length ? Sub.find({ _id: { $in: product.subs } }).lean() : [],
    product.productType ? ProductType.findById(product.productType).lean() : null,
    product.brandRef ? Brand.findById(product.brandRef).lean() : null,
    product.tags?.length ? Tag.find({ _id: { $in: product.tags }, active: { $ne: false } }).lean() : [],
    product.specifications?.length
      ? Attribute.find({ _id: { $in: product.specifications.map((item) => item.attribute) }, active: true }).lean()
      : [],
  ]);
  if (product.category && !category) throw new Error("ไม่พบหมวดหลักที่เลือก");
  if (product.subs?.length && selectedSubs.length !== product.subs.length) throw new Error("หมวดย่อยไม่ถูกต้อง");
  if (selectedSubs.some((item) => String(item.parent) !== String(product.category))) {
    throw new Error("หมวดย่อยไม่ได้อยู่ภายใต้หมวดหลักที่เลือก");
  }
  if (product.productType && !productType) throw new Error("ไม่พบประเภทสินค้า");
  if (productType && !product.subs?.includes(String(productType.parent))) {
    throw new Error("ประเภทสินค้าไม่ได้อยู่ภายใต้หมวดย่อยที่เลือก");
  }
  if (product.brandRef && !brand) throw new Error("ไม่พบ Brand ที่เลือก");
  if (brand) product.brand = brand.name;
  if ((product.tags?.length || 0) !== tags.length) throw new Error("Tag บางรายการไม่ถูกต้องหรือถูกปิดใช้งาน");
  if ((product.specifications?.length || 0) !== attributes.length) throw new Error("Attribute บางรายการไม่ถูกต้องหรือถูกปิดใช้งาน");
  if (product.specifications?.length) {
    const definitions = new Map(attributes.map((item) => [String(item._id), item]));
    product.specifications.forEach((specification) => {
      const definition = definitions.get(String(specification.attribute));
      if (definition.dataType === "select"
        && !definition.options.includes(specification.value)) {
        throw new Error(`ค่า ${definition.name} ไม่อยู่ในตัวเลือกที่กำหนด`);
      }
      if (definition.dataType === "multiselect"
        && specification.optionValues.some((value) => !definition.options.includes(value))) {
        throw new Error(`ค่า ${definition.name} บางรายการไม่อยู่ในตัวเลือกที่กำหนด`);
      }
    });
  }
  if (product.variants?.length && product.options?.length) {
    const optionMap = new Map(product.options.map((option) => [option.name, new Set(option.values)]));
    product.variants.forEach((variant) => {
      variant.optionValues.forEach((option) => {
        if (!optionMap.get(option.name)?.has(option.value)) {
          throw new Error(`Variant ${variant.sku} มีตัวเลือกไม่ตรงกับ Product Option`);
        }
      });
    });
  }

  return product;
};

exports.create = async (req, res) => {
  try {
    const payload = await normalizeProduct(req.body);
    const newProduct = await Product.create(payload);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.listAll = async (req, res) => {
  let products = await Product.find({})
    .limit(parseInt(req.params.count))
    .populate("category")
    .populate("subs")
    .populate("brandRef")
    .populate("generations")
    .populate("productType")
    .populate("tags")
    .populate("specifications.attribute")
    .sort([["createdAt", "desc"]])
    .exec();
  res.json(products);
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({
      slug: req.params.slug,
    }).exec();
    await Promise.allSettled((deleted?.images || [])
      .map((image) => destroyAsset(image.public_id)));
    await removeAllEditorImages(
      deleted?.description,
      deleted?.content,
      deleted?.detail
    );
    res.json(deleted);
  } catch (err) {
    return res.status(400).send("Product delete failed");
  }
};

exports.read = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate("category")
    .populate("subs")
    .populate("brandRef")
    .populate("generations")
    .populate("productType")
    .populate("tags")
    .populate("specifications.attribute")
    .exec();
  res.json(product);
};

exports.update = async (req, res) => {
  try {
    const existing = await Product.findOne({ slug: req.params.slug })
      .select("images description content detail")
      .lean();
    if (!existing) return res.status(404).json({ err: "ไม่พบสินค้าที่ต้องการแก้ไข" });
    const payload = await normalizeProduct(req.body, { partial: true });
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      payload,
      { new: true, runValidators: true }
    ).exec();
    const nextPublicIds = new Set((updated.images || []).map((image) => image.public_id).filter(Boolean));
    const removedImages = (existing.images || []).filter((image) =>
      image.public_id && !nextPublicIds.has(image.public_id));
    await Promise.allSettled(removedImages.map((image) => destroyAsset(image.public_id)));
    await Promise.all([
      removeDeletedEditorImages(existing.description, updated.description),
      removeDeletedEditorImages(existing.content, updated.content),
      removeDeletedEditorImages(existing.detail, updated.detail),
    ]);
    res.json(updated);
  } catch (err) {
    res.status(400).json({
      err: err.message,
    });
  }
};

// WITH PAGINATION
exports.list = async (req, res) => {
  try {
    // createdAt/updatedAt, desc/asc, 3
    const { sort, order, page } = req.body;
    const currentPage = page || 1;
    const perPage = 12; // 3

    const products = await Product.find({})
      .skip((currentPage - 1) * perPage)
      .populate("category")
      .populate("subs")
      .populate("brandRef")
      .populate("generations")
      .populate("productType")
      .populate("tags")
      .populate("specifications.attribute")
      .sort([[sort, order]])
      .limit(perPage)
      .exec();

    res.json(products);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
};

exports.productsCount = async (req, res) => {
  let total = await Product.find({}).estimatedDocumentCount().exec();
  res.json(total);
};

exports.productStar = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();
  const user = await User.findOne({ email: req.user.email }).exec();
  const { star } = req.body;

  // who is updating?
  // check if currently logged in user have already added rating to this product?
  let existingRatingObject = product.ratings.find(
    (ele) => ele.postedBy.toString() === user._id.toString()
  );

  // if user haven't left rating yet, push it
  if (existingRatingObject === undefined) {
    let ratingAdded = await Product.findByIdAndUpdate(
      product._id,
      {
        $push: { ratings: { star, postedBy: user._id } },
      },
      { new: true }
    ).exec();
    res.json(ratingAdded);
  } else {
    // if user have already left rating, update it
    const ratingUpdated = await Product.updateOne(
      {
        ratings: { $elemMatch: existingRatingObject },
      },
      { $set: { "ratings.$.star": star } },
      { new: true }
    ).exec();
    res.json(ratingUpdated);
  }
};

exports.listRelated = async (req, res) => {
  const product = await Product.findById(req.params.productId).exec();

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
  })
    .limit(3)
    .populate("category")
    .populate("subs")
    .populate("postedBy")
    .exec();

  res.json(related);
};

// SERACH / FILTER

const handleQuery = async (req, res, query) => {
  const products = await Product.find({ $text: { $search: query } })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handlePrice = async (req, res, price) => {
  try {
    let products = await Product.find({
      price: {
        $gte: price[0],
        $lte: price[1],
      },
    })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("postedBy", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
};

const handleCategory = async (req, res, category) => {
  try {
    let products = await Product.find({ category })
      .populate("category", "_id name")
      .populate("subs", "_id name")
      .populate("postedBy", "_id name")
      .exec();

    res.json(products);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
};

const handleStar = (req, res, stars) => {
  Product.aggregate([
    {
      $project: {
        document: "$$ROOT",
        // title: "$title",
        floorAverage: {
          $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
        },
      },
    },
    { $match: { floorAverage: stars } },
  ])
    .limit(12)
    .exec((err, aggregates) => {
      if (err) return res.status(400).json({ err: err.message });
      Product.find({ _id: aggregates })
        .populate("category", "_id name")
        .populate("subs", "_id name")
        .populate("postedBy", "_id name")
        .exec((err, products) => {
          if (err) return res.status(400).json({ err: err.message });
          res.json(products);
        });
    });
};

const handleSub = async (req, res, sub) => {
  const products = await Product.find({ subs: sub })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleShipping = async (req, res, shipping) => {
  const products = await Product.find({ shipping })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleColor = async (req, res, color) => {
  const products = await Product.find({ color })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

const handleBrand = async (req, res, brand) => {
  const products = await Product.find({ brand })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

exports.searchFilters = async (req, res) => {
  const {
    query, price, category, stars, sub, shipping, color, brand,
    brandRef, productType, tags, attributeFilters,
  } = req.body;

  const filter = {};
  if (query?.trim()) filter.$text = { $search: query.trim() };
  if (Array.isArray(price) && (price[0] > 0 || price[1] > 0)) {
    filter.price = { $gte: number(price[0]), $lte: number(price[1]) };
  }
  if (category) {
    const categoryValues = Array.isArray(category) ? category : [category];
    filter.category = { $in: categoryValues.map(id) };
  }
  if (sub) filter.subs = id(sub);
  if (shipping) filter.shipping = shipping;
  if (color) filter.color = color;
  if (brand) filter.brand = brand;
  if (brandRef) filter.brandRef = id(brandRef);
  if (productType) filter.productType = id(productType);
  if (tags?.length) filter.tags = { $all: tags.map(id) };
  if (stars) {
    filter.$expr = {
      $eq: [{ $floor: { $ifNull: [{ $avg: "$ratings.star" }, 0] } }, number(stars)],
    };
  }
  if (attributeFilters?.length) {
    filter.$and = attributeFilters.map(({ attribute, values, min, max, booleanValue }) => {
        const match = { attribute };
        if (values?.length) {
          match.$or = [
            { value: { $in: values } },
            { optionValues: { $in: values } },
          ];
        }
        if (min !== undefined || max !== undefined) {
          match.numericValue = {
            ...(min !== undefined ? { $gte: min } : {}),
            ...(max !== undefined ? { $lte: max } : {}),
          };
        }
        if (booleanValue !== undefined) match.booleanValue = booleanValue;
      return { specifications: { $elemMatch: match } };
    });
  }
  const products = await Product.find(filter)
    .populate("category subs brandRef productType tags specifications.attribute")
    .sort({ createdAt: -1 })
    .exec();
  res.json(products);
};

exports.saveContent = async (req, res) => {
  if (!req.body.content || req.body.content === "<p><br></p>") {
    return res.status(400).json({ err: "กรุณากรอกรายละเอียดคุณสมบัติ" });
  }
  const existing = await Product.findOne({ slug: req.params.slug }).select("content").lean();
  if (!existing) return res.status(404).json({ err: "ไม่พบสินค้า" });
  const content = await Product.findOneAndUpdate(
    { slug: req.params.slug },
    { content: req.body.content },
    { new: true }
  ).exec();

  if (!content) return res.status(404).json({ err: "ไม่พบสินค้า" });
  await removeDeletedEditorImages(existing.content, content.content);
  res.json({ product: content, ok: true });
};

exports.saveDetail = async (req, res) => {
  if (!req.body.detail || req.body.detail === "<p><br></p>") {
    return res.status(400).json({ err: "กรุณากรอกตัวอย่างการใช้งาน" });
  }
  const existing = await Product.findOne({ slug: req.params.slug }).select("detail").lean();
  if (!existing) return res.status(404).json({ err: "ไม่พบสินค้า" });
  const detail = await Product.findOneAndUpdate(
    { slug: req.params.slug },
    { detail: req.body.detail },
    { new: true }
  ).exec();

  if (!detail) return res.status(404).json({ err: "ไม่พบสินค้า" });
  await removeDeletedEditorImages(existing.detail, detail.detail);
  res.json({ product: detail, ok: true });
};
