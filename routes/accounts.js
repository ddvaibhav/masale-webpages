var express = require("express");

var router = express.Router()
var exe = require("../conn.js");
const nodemailer = require("nodemailer");

router.get("/login", function (req, res) {
  res.render("accounts/login.ejs");
});

router.post("/login_process", async function (req, res) {
  const match = `SELECT * FROM admin WHERE email = ? AND password = ?`;
  const data = await exe(match, [req.body.email, req.body.password]);

  if (data.length > 0) {
    req.session.admin = data[0];
    res.redirect("/admin/");
  } else {
    res.send("Please Enter Valid Details");
  }
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/accounts/login");
});

router.get("/forget_password", function (req, res) {
  res.render("accounts/forget_password.ejs");
});

router.post("/send_otp", async function (req, res) {
  const email = req.body.email;

  // 1. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // 2. Store OTP in session
  req.session.otp = otp;
  req.session.otp_email = email;
  req.session.otp_time = Date.now();

  // 3. Configure nodemailer
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "gorakshnathdalavi91@gmail.com",
      pass: "yydh qpqv vovi fjsm", // Gmail App Password
    },
  });

  // 4. Send email
  try {
    await transporter.sendMail({
      from: '"Admin Panel" <gorakshnathdalavi91@gmail.com>',
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}`,
      html: `
  <div style="max-width:500px;margin:20px auto;padding:20px;border:1px solid #e5e5e5;border-radius:10px;font-family:Arial,sans-serif;background-color:#ffffff;">
    <div style="text-align:center;">
      <h2 style="color:#007bff;margin-bottom:0;">Admin Panel</h2>
      <p style="color:#666;margin-top:5px;">OTP Verification Code</p>
    </div>
    <hr style="margin:20px 0;">
    <p>Hello,</p>
    <p>We received a request to verify your email. Please use the following OTP to complete the process:</p>
    <div style="text-align:center; margin: 30px 0;">
      <span style="display:inline-block;font-size:24px;font-weight:bold;color:#333;padding:10px 20px;border:2px dashed #007bff;border-radius:8px;letter-spacing:5px;">${otp}</span>
    </div>
    <p>This OTP is valid for 10 minutes. If you didn’t request this, you can safely ignore this email.</p>
    <br>
    <p style="color:#888;font-size:13px;">– Admin Panel Support</p>
  </div>
`

    });

    console.log("OTP sent to:", email, "| OTP:", otp);
   res.redirect("/accounts/verify_otp?status=sent");
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).send("Failed to send OTP");
  }
});

router.get("/verify_otp", function (req, res) {
  const otpSentTime = req.session.otp_time || Date.now();
  const expiresIn = 10 * 60 * 1000; // 10 minutes

  res.render("accounts/verify_otp.ejs", {
    otp_expiry_timestamp: otpSentTime + expiresIn,
    status: req.query.status,
  });
});

router.post("/verify_otp", function (req, res) {
  const userOtp = req.body.otp;
  const sessionOtp = req.session.otp;
  const otpTime = req.session.otp_time;

  // Expiry check: 10 minutes = 600000 ms
  const isExpired = Date.now() - otpTime > 10 * 60 * 1000;

  if (isExpired) {
    return res.send("<script>alert('OTP expired! Please try again.'); window.location='/accounts/forget_password';</script>");
  }

  if (parseInt(userOtp) === sessionOtp) {
    // OTP matched ✅
    return res.send("<script>alert('OTP Verified! You can now reset your password.'); window.location='/accounts/reset_password';</script>");
  } else {
    // OTP incorrect ❌
    return res.send("<script>alert('Invalid OTP! Please try again.'); window.location='/accounts/verify_otp';</script>");
  }
});

router.get("/reset_password", function (req, res) {
  if (!req.session.otp_email) return res.redirect("/accounts/forget_password");

  res.render("accounts/reset_password.ejs", {
    status: req.query.status || null,
  });
});

  router.post("/reset_password", async function (req, res) {
  const { password, confirm } = req.body;

  if (password !== confirm) {
    return res.redirect("/accounts/reset_password?status=error");
  }

  const email = req.session.otp_email;

  const sql = `UPDATE admin SET password = ? WHERE email = ?`;
  await exe(sql, [password, email]);

  // Clear session
  req.session.otp = null;
  req.session.otp_email = null;
  req.session.otp_time = null;

  res.send("<script>alert('Password updated successfully!'); window.location='/accounts/login';</script>");
});


module.exports = router;