const { randomBytes, scrypt, timingSafeEqual } = require("crypto");
const { promisify } = require("util");

const scryptAsync = promisify(scrypt);

exports.hashPassword = async (password) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return { passwordHash: derivedKey.toString("hex"), passwordSalt: salt };
};

exports.verifyPassword = async (password, salt, storedHash) => {
  if (!password || !salt || !storedHash) return false;
  const derivedKey = await scryptAsync(password, salt, 64);
  const storedKey = Buffer.from(storedHash, "hex");
  return storedKey.length === derivedKey.length &&
    timingSafeEqual(storedKey, derivedKey);
};
