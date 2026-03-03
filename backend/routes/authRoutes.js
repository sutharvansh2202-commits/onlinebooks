const express = require("express");
const router = express.Router();

// ================= CHANGE PASSWORD =================
router.post("/change-password", async (req, res) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  if (!email || !currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, message: "New passwords do not match" });
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  if (user.password !== currentPassword) {
    return res.status(400).json({ success: false, message: "Current password is incorrect" });
  }
  user.password = newPassword;
  await user.save();
  return res.json({ success: true, message: "Password changed successfully" });
});

const User = require("../models/User");
const LoginLog = require("../models/LoginLog");
const nodemailer = require("nodemailer");

// In-memory OTP store (for demo; use Redis or DB in production)
const otpStore = {};

// Nodemailer setup (configure with your SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASS
  }
});
// ================= SEND OTP FOR PASSWORD RESET =================
router.post("/send-otp", async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: false, message: "User not found" });
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry
  // Send email
  try {
    await transporter.sendMail({
      from: 'Online Book Store <no-reply@onlinebookstore.com>',
      to: email,
      subject: '✨ Verify Your Login – Online Book Store',
      html: `<div style='font-family:sans-serif;'>
        <h2 style='color:#2563eb;'>Online Book Store</h2>
        <p>Dear Reader,</p>
        <p>Welcome back! To complete your login, please enter the verification code below:</p>
        <p style='font-size:1.2em;'><span style='font-size:1.5em;'>🔑</span> LOGIN OTP: <b>${otp}</b></p>
        <p style='color:#d32f2f;'>This code will expire in 10 minutes.</p>
        <p>If this was you, simply enter the code to continue enjoying your favorite books.</p>
        <p>If you did not request this login:</p>
        <ul>
          <li>Do not share this code</li>
          <li>Consider updating your password</li>
          <li>Contact our support team if needed</li>
        </ul>
        <p>Stay secure. Stay smart. Stay reading. 📖</p>
        <hr style='margin:16px 0;'>
        <p style='font-size:0.9em;'>Warm regards,<br>Online Book Store Support<br><a href='mailto:support@onlinebookstore.com'>support@onlinebookstore.com</a><br>© 2026 Online Book Store</p>
      </div>`
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("Nodemailer error:", err);
    return res.json({ success: false, message: "Failed to send email" });
  }
});

// ================= VERIFY OTP AND LOGIN =================
const jwt = require("jsonwebtoken");
router.post("/verify-otp", async (req, res) => {
  const email = (req.body.email || "").toLowerCase().trim();
  const otp = (req.body.otp || "").trim();
  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.json({ success: false, message: "Invalid or expired OTP" });
  }
  const user = await User.findOne({ email });
  if (!user) return res.json({ success: false, message: "User not found" });
  // Generate JWT token (same as login)
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  delete otpStore[email];
  return res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role
    },
    token
  });
});

// ================= GET ALL ADMINS =================
router.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ================= REGISTER =================
router.post("/register", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const password = (req.body.password || "").trim();
    const name = (req.body.name || "").trim();
    const mobile = (req.body.mobile || "").trim();

    if (!email || !password || !name) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      email,
      password,
      name,
      mobile,
      role: "user"
    });

    await user.save();

    return res.json({
      message: "Registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});


// ================= LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const password = (req.body.password || "").trim();
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      await LoginLog.create({ email, success: false, ip });
      return res.status(400).json({ message: "User not found" });
    }

    if (user.password !== password) {
      await LoginLog.create({ email, success: false, ip });
      return res.status(400).json({ message: "Invalid password" });
    }

    await LoginLog.create({ email, success: true, ip });

    return res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});


// ================= FETCH USER (SESSION RESTORE) =================
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});


// ================= ADD ADMIN =================
router.post("/add-admin", async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const password = (req.body.password || "").trim();
    const name = (req.body.name || "").trim();
    const mobile = (req.body.mobile || "").trim();

    if (!email || !password || !name) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const admin = new User({
      email,
      password,
      name,
      mobile,
      role: "admin"
    });

    await admin.save();
    return res.json({ message: "Admin added successfully" });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;