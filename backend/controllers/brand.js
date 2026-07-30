const Brand = require("../models/brand");
const Generation = require("../models/generation");
const slugify = require("slugify");

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        // const Generation = await new Generation({ name, slug: slugify(name) }).save();
        // res.json(generation);
        //res.json(await new Generation({ name, slug: slugify(name) }).save());

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

        res.json(await new Brand({ name, slug: req.body.slug }).save());
    } catch (err) {
        // console.log(err);
        res.status(400).send("Create brand failed");
    }
};

exports.list = async (req, res) =>
    res.json(await Brand.find({}).sort({ name: +1, createdAt: -1 }).exec());

exports.read = async (req, res) => {
    let brand = await Brand.findOne({ slug: req.params.slug }).exec();
    res.json(brand);
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

        const updated = await Brand.findOneAndUpdate(
            { slug: req.params.slug },
            //{ name, slug: slugify(name) },
            { name, slug: req.body.slug },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).send("Brand update failed");
    }
};

exports.remove = async (req, res) => {
    try {
        const brand = await Brand.findOne({ slug: req.params.slug });
        if (!brand) return res.status(404).send("Brand not found");
        const hasGenerations = await Generation.exists({ parent: brand._id });
        if (hasGenerations) {
            return res.status(409).send("กรุณาลบรุ่นสินค้าภายในก่อน");
        }
        const deleted = await Brand.findOneAndDelete({ slug: req.params.slug });
        res.json(deleted);
    } catch (err) {
        res.status(400).send("Brand delete failed");
    }
};

exports.getGenerations = async (req, res) => {
    const generations = await Generation.find({ parent: req.params._id })
        .sort({ name: 1 })
        .exec();
    res.json(generations);
};
