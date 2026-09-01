const Category = require("../models/category");
const Sub = require("../models/sub");
const Product = require("../models/product");
const slugify = require("slugify");

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        // const category = await new Category({ name, slug: slugify(name) }).save();
        // res.json(category);
        //res.json(await new Category({ name, slug: slugify(name) }).save());

        let strToThaiSlug = function (str) {
            return str.replace(/\s+/g, '-')     // Replace spaces with -
                .replace('%', 'เปอร์เซนต์')         // Translate some charactor
                .replace(/[^\u0E00-\u0E7F\w-]+/g, '') // Remove all non-word chars
                .replace(/--+/g, '-')         // Replace multiple - with single -
                .replace(/^-+/, '')           // Trim - from start of text
                .toLowerCase()
                .replace(/-+$/, '');
        }
        req.body.slug = strToThaiSlug(name);

        res.json(await new Category({ name, slug: req.body.slug }).save());
    } catch (err) {
        res.status(400).send("Create category failed");
    }
};

exports.list = async (req, res) =>
    res.json(await Category.find({}).sort({ name: +1, createdAt: -1 }).exec());

exports.read = async (req, res) => {
    let category = await Category.findOne({ slug: req.params.slug }).exec();
    //res.json(category);
    const products = await Product.find({ category }).populate("category").exec();
    res.json({
        category,
        products,
    });
};

exports.update = async (req, res) => {
    const { name } = req.body;
    try {

        let strToThaiSlug = function (str) {
            return str.replace(/\s+/g, '-')     // Replace spaces with -
                .replace('%', 'เปอร์เซนต์')         // Translate some charactor
                .replace(/[^\u0E00-\u0E7F\w-]+/g, '') // Remove all non-word chars
                .replace(/--+/g, '-')         // Replace multiple - with single -
                .replace(/^-+/, '')           // Trim - from start of text
                .toLowerCase()
                .replace(/-+$/, '');
        }
        req.body.slug = strToThaiSlug(name);

        const updated = await Category.findOneAndUpdate(
            { slug: req.params.slug },
            // { name, slug: slugify(name) },
            { name, slug: req.body.slug }, 
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).send("Category update failed");
    }
};

exports.remove = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });
        if (!category) return res.status(404).send("Category not found");
        const hasChildren = await Sub.exists({ parent: category._id });
        if (hasChildren) {
            return res.status(409).send("กรุณาลบประเภทย่อยภายในก่อน");
        }
        const deleted = await Category.findOneAndDelete({ slug: req.params.slug });
        res.json(deleted);
    } catch (err) {
        res.status(400).send("Category delete failed");
    }
};

exports.getSubs = async (req, res) => {
    const subs = await Sub.find({ parent: req.params._id })
        .sort({ name: 1 })
        .exec();
    res.json(subs);
};
