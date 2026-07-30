const Generation = require("../models/generation");

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
        //res.json(await new Generation({ name, parent, slug: slugify(name) }).save());
        res.json(await new Generation({ name, parent, slug: toSlug(name) }).save());
    } catch (err) {
        console.log("Generation CREATE ERR-->", err);
        res.status(400).send("Create generation failed");
    }
};

exports.list = async (req, res) =>
    res.json(
        await Generation.find({})
            .populate("parent", "name slug")
            .sort({ name: 1, createdAt: -1 })
            .exec()
    );

exports.read = async (req, res) => {
    let generation = await Generation.findOne({ slug: req.params.slug }).exec();
    res.json(generation);
};

exports.update = async (req, res) => {
    const { name, parent } = req.body;
    try {
        const updated = await Generation.findOneAndUpdate(
            { slug: req.params.slug },
           // { name, parent,slug: slugify(name) },
            { name, parent, slug: toSlug(name) },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).send("Generation update failed");
    }
};

exports.remove = async (req, res) => {
    try {
        const deleted = await Generation.findOneAndDelete({ slug: req.params.slug });
        res.json(deleted);
    } catch (err) {
        res.status(400).send("Generation delete failed");
    }
};
