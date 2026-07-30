const { createHash, randomBytes } = require("crypto");
const User = require("../models/user");
const { hashPassword } = require("../auth/password");
const { sendVerificationEmail } = require("../services/brevo");

const normalize = (value) => String(value || "").trim();
const tokenHash = (token) => createHash("sha256").update(token).digest("hex");

exports.register = async (req, res) => {
  const firstName = normalize(req.body.firstName);
  const lastName = normalize(req.body.lastName);
  const username = normalize(req.body.username).toLowerCase();
  const email = normalize(req.body.email).toLowerCase();
  const password = String(req.body.password || "");

  if (!firstName || !lastName) {
    return res.status(400).json({ message: "กรุณากรอกชื่อและนามสกุล" });
  }
  if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
    return res.status(400).json({ message: "Username ต้องมี 3-30 ตัว และใช้ a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
  }

  const duplicates = await User.find({
    $or: [{ email }, { username }],
  }).select("_id email username emailVerified").lean();
  if (duplicates.length) {
    const verifiedDuplicate = duplicates.find((item) => item.emailVerified);
    if (verifiedDuplicate) {
      return res.status(409).json({
        message: verifiedDuplicate.email === email
          ? "อีเมลนี้ถูกใช้งานแล้ว"
          : "Username นี้ถูกใช้งานแล้ว",
      });
    }

    const tokens = req.app.locals.db.collection("email_verification_tokens");
    const duplicateIds = duplicates.map((item) => item._id);
    const activeToken = await tokens.findOne({
      userId: { $in: duplicateIds },
      expires: { $gt: new Date() },
    });
    if (activeToken) {
      return res.status(409).json({
        message: "บัญชีนี้รอการยืนยันอีเมล ลิงก์เดิมยังใช้งานได้ภายใน 7 วัน",
      });
    }

    await Promise.all([
      tokens.deleteMany({ userId: { $in: duplicateIds } }),
      User.deleteMany({ _id: { $in: duplicateIds }, emailVerified: null }),
    ]);
  }

  const { passwordHash, passwordSalt } = await hashPassword(password);
  const user = await User.create({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`,
    username,
    email,
    passwordHash,
    passwordSalt,
    emailVerified: null,
  });

  const rawToken = randomBytes(32).toString("hex");
  const tokens = req.app.locals.db.collection("email_verification_tokens");
  await tokens.insertOne({
    userId: user._id,
    email,
    token: tokenHash(rawToken),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  try {
    const verificationUrl = new URL("/verify-email", process.env.CLIENT_URL);
    verificationUrl.searchParams.set("token", rawToken);
    verificationUrl.searchParams.set("email", email);
    await sendVerificationEmail({
      email,
      firstName,
      verificationUrl: verificationUrl.toString(),
    });
  } catch (error) {
    await Promise.all([
      tokens.deleteMany({ userId: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);
    console.error("BREVO VERIFICATION EMAIL ERR", error.message);
    return res.status(502).json({
      message: "ส่งอีเมลยืนยันไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Brevo",
    });
  }

  return res.status(201).json({
    message: "สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี",
  });
};

exports.verifyEmail = async (req, res) => {
  const email = normalize(req.body.email).toLowerCase();
  const token = normalize(req.body.token);
  if (!email || !token) {
    return res.status(400).json({ message: "ข้อมูลยืนยันอีเมลไม่ครบถ้วน" });
  }

  const record = await req.app.locals.db
    .collection("email_verification_tokens")
    .findOneAndDelete({
      email,
      token: tokenHash(token),
      expires: { $gt: new Date() },
    });

  if (!record) {
    return res.status(400).json({ message: "ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุแล้ว" });
  }

  await User.updateOne(
    { _id: record.userId, email },
    { $set: { emailVerified: new Date() } }
  );
  return res.json({ message: "ยืนยันอีเมลสำเร็จ สามารถเข้าสู่ระบบได้แล้ว" });
};

exports.currentUser = async (req, res) => {
  const user = await User.findOne({ email: req.user.email })
    .select("-passwordHash -passwordSalt")
    .exec();
  res.json(user);
};
