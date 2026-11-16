const createRateLimiter = ({
  windowMs,
  max,
  message = "คำขอมีจำนวนมากเกินไป กรุณาลองใหม่ภายหลัง",
} = {}) => {
  const windows = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = String(req.ip || req.socket?.remoteAddress || "unknown");
    let entry = windows.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      windows.set(key, entry);
    }

    entry.count += 1;
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.set("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    // Opportunistic cleanup keeps expired client entries from accumulating.
    if (windows.size > 10000) {
      for (const [client, value] of windows) {
        if (now >= value.resetAt) windows.delete(client);
      }
    }

    if (entry.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
      return res.status(429).json({ message });
    }

    return next();
  };
};

// Broad protection for Auth.js endpoints (credentials and OAuth callbacks).
exports.authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "มีคำขอเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง",
});

// Stricter limit for credentials sign-in attempts.
exports.credentialsRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "เข้าสู่ระบบไม่สำเร็จหลายครั้ง กรุณารอ 15 นาทีก่อนลองอีกครั้ง",
});

// Stricter limit for account creation and email-token verification.
exports.registrationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "ทำรายการบ่อยเกินไป กรุณารอ 15 นาทีก่อนลองอีกครั้ง",
});
