const required = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const port = Number(process.env.PORT || 8000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const clientUrl = required("CLIENT_URL");

// Credentialed browser requests may never use a wildcard CORS origin. Fail
// early instead of returning an invalid `Access-Control-Allow-Origin: *`.
if (clientUrl === "*") {
  throw new Error("CLIENT_URL must be an explicit origin when cookies are enabled");
}

let clientOrigin;
try {
  clientOrigin = new URL(clientUrl).origin;
} catch {
  throw new Error("CLIENT_URL must be a valid absolute URL");
}

module.exports = {
  clientUrl,
  clientOrigin,
  mongoUri: required("MONGO_URI"),
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  required,
};
