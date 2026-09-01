const { getAuthSession } = require("../auth");
const User = require("../models/user");

exports.optionalAuth = async (req, _res, next) => {
    try {
        const session = await getAuthSession(req);
        req.user = session?.user?.email
            ? await User.findOne({ email: session.user.email }).exec()
            : null;
    } catch (_error) {
        req.user = null;
    }
    next();
};

exports.authCheck = async (req, res, next) => {
    try {
        const session = await getAuthSession(req);
        if (!session?.user?.email) {
            return res.status(401).json({ err: "Authentication required" });
        }

        const user = await User.findOne({ email: session.user.email }).exec();
        if (!user) {
            return res.status(401).json({ err: "User account not found" });
        }

        req.user = user;
        res.locals.session = session;
        next();
    } catch (err) {
        res.status(401).json({
            err: "Invalid or expired token",
        });
    }
}

exports.adminCheck = async (req, res, next) => {
    if (req.user.role !== "admin") {
        res.status(403).json({
            err: "Admin resource. Access denied.",
        });
    } else {
        next();
    }
};
