const { uploadAsset, destroyAsset } = require("../services/cloudinary");

// req.files.file.path
exports.upload = async (req, res) => {
    try {
        const result = await uploadAsset(req.body.image, "product");
        res.json({ public_id: result.public_id, url: result.secure_url, width: result.width, height: result.height });
    } catch (error) {
        res.status(400).json({ err: error.message || "อัปโหลดรูปไม่สำเร็จ" });
    }
};

exports.uploadUserAsset = async (req, res) => {
    const purpose = ["profile", "payment-slip", "blog-hero", "editor-image"].includes(req.body.purpose)
        ? req.body.purpose
        : "profile";
    if (purpose === "blog-hero" && req.user.role !== "admin") {
        return res.status(403).json({ err: "Admin resource. Access denied." });
    }
    try {
        const result = await uploadAsset(req.body.image, purpose);
        if (purpose === "payment-slip"
            && req.body.previousPublicId?.startsWith("amrdiy/payment-slip/")) {
            await destroyAsset(req.body.previousPublicId);
        }
        res.json({ public_id: result.public_id, url: result.secure_url, width: result.width, height: result.height });
    } catch (error) {
        res.status(400).json({ err: error.message || "อัปโหลดรูปไม่สำเร็จ" });
    }
};

exports.remove = async (req, res) => {
    try {
        res.json(await destroyAsset(req.body.public_id));
    } catch (error) {
        res.status(400).json({ success: false, err: error.message });
    }
};
