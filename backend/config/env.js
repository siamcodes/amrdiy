const required = (name) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const port = Number(process.env.PORT || 8009);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

module.exports = {
  clientUrl: required("CLIENT_URL"),
  mongoUri: required("MONGO_URI"),
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  required,
};
