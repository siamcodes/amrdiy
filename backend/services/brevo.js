const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

exports.sendVerificationEmail = async ({ email, firstName, verificationUrl }) => {
  const { BrevoClient } = await import("@getbrevo/brevo");
  const brevo = new BrevoClient({
    apiKey: required("BREVO_API_KEY"),
    timeoutInSeconds: 30,
    maxRetries: 2,
  });

  await brevo.transactionalEmails.sendTransacEmail({
    sender: {
      name: process.env.BREVO_SENDER_NAME?.trim() || "AMR DIY",
      email: required("BREVO_SENDER_EMAIL"),
    },
    to: [{ email, name: firstName }],
    subject: "ยืนยันอีเมลสำหรับบัญชี AMR DIY",
    textContent: `ยืนยันอีเมลของคุณภายใน 7 วัน: ${verificationUrl}`,
    htmlContent: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#172033">
        <h1 style="font-size:24px">ยืนยันอีเมลของคุณ</h1>
        <p>สวัสดี ${firstName}</p>
        <p>กดปุ่มด้านล่างเพื่อเปิดใช้งานบัญชี AMR DIY ลิงก์นี้หมดอายุใน 7 วัน</p>
        <p style="margin:28px 0"><a href="${verificationUrl}" style="background:#1677ff;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none">ยืนยันอีเมล</a></p>
        <p style="font-size:12px;color:#667085">หากคุณไม่ได้สมัครสมาชิก สามารถละเว้นอีเมลนี้ได้</p>
      </div>
    `,
  });
};
