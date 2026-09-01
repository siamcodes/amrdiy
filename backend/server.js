const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const { readdirSync } = require("fs");
require("dotenv").config();
const env = require("./config/env");
const { getAuthHandler } = require("./auth");

// app
const app = express();

// middlewares
app.use(morgan("dev"));
app.use(express.json({ limit: "8mb" }));
app.set("trust proxy", true);
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
    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? "ok" : "unavailable",
        database: databaseReady ? "connected" : "disconnected",
        uptime: Math.round(process.uptime()),
    });
});

const start = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        app.locals.db = mongoose.connection.db;
        console.log("DB CONNECTED");

        const authHandler = await getAuthHandler();
        app.use("/api/auth", authHandler);
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
