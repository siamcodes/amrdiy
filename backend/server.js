const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const securityHeaders = require("./middlewares/securityHeaders");
const { authRateLimit, credentialsRateLimit } = require("./middlewares/rateLimit");
const { readdirSync } = require("fs");
require("dotenv").config();
const env = require("./config/env");
const { getAuthHandler } = require("./auth");
const { handleStripeWebhook } = require("./controllers/stripeWebhook");

// app
const app = express();

// middlewares
app.use(morgan("dev"));
app.use(securityHeaders);

// Stripe requires the untouched raw request body to verify webhook signatures.
// Register this endpoint before express.json() changes the request body.
app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    handleStripeWebhook
);

app.use(express.json({ limit: "8mb" }));
// Trust only explicitly configured reverse-proxy hops (for example, Nginx = 1).
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 5) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 5");
}
app.set("trust proxy", trustProxyHops);
app.use(cors({
    // Return the requesting origin explicitly. This is required when Axios
    // sends cookies (`withCredentials: true`); browsers reject `*` in that
    // case even if the request itself is otherwise authorized.
    origin(origin, callback) {
        if (!origin || origin === env.clientOrigin) {
            callback(null, true);
            return;
        }
        callback(null, false);
    },
    credentials: true,
}));

app.get("/api/health", (_req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    const topologyType = mongoose.connection.client?.topology?.description?.type || "unknown";
    const transactionsSupported = ["ReplicaSetWithPrimary", "Sharded"].includes(topologyType);
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? "ok" : "unavailable",
        database: databaseReady ? "connected" : "disconnected",
        mongoTopology: topologyType,
        transactionsSupported,
        uptime: Math.round(process.uptime()),
    });
});

const start = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        app.locals.db = mongoose.connection.db;
        console.log("DB CONNECTED");
        const mongoTopology = mongoose.connection.client?.topology?.description?.type || "unknown";
        if (!["ReplicaSetWithPrimary", "Sharded"].includes(mongoTopology)) {
            console.warn(
                "MONGODB TRANSACTIONS DISABLED: standalone topology detected. " +
                "Order creation currently uses conditional stock updates with compensating rollback. " +
                "Configure a Replica Set to enable atomic Order + inventory transactions."
            );
        } else {
            console.log("MongoDB transaction support enabled:", mongoTopology);
        }

        const authHandler = await getAuthHandler();
        app.use("/api/auth/callback/credentials", credentialsRateLimit);
        app.use("/api/auth", authRateLimit, authHandler);
        readdirSync("./routes").forEach((route) => {
            app.use("/api", require("./routes/" + route));
        });

        app.listen(env.port, () => {
            console.log(`Server is running on port ${env.port}`);
        });
    } catch (error) {
        console.error(
            "DB CONNECTION ERR",
            error.code === 18
                ? "MongoDB authentication failed. Check the database username and password in MONGO_URI."
                : error.message
        );
        process.exit(1);
    }
};

start();
