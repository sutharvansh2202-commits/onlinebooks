const express = require("express");
const nodemailer = require("nodemailer");
const Contact = require("../models/Contact");

const router = express.Router();

const SUPER_ADMIN_EMAIL = "rudra2004@gmail.com";

let admins = [
  { email: SUPER_ADMIN_EMAIL, name: "Super Admin" }
];

// ================= ADMIN MANAGEMENT =================

// Add new admin
router.post("/add-admin", (req, res) => {
  const { email, name, addedBy } = req.body;

  if (!email || !name || !addedBy) {
    return res.status(400).json({ message: "All fields required" });
  }

  if (addedBy !== SUPER_ADMIN_EMAIL) {
    return res.status(401).json({ message: "Only super admin allowed" });
  }

  const exists = admins.find(a => a.email === email);
  if (exists) {
    return res.status(409).json({ message: "Admin already exists" });
  }

  admins.push({ email, name });
  res.status(201).json({ message: "Admin added successfully" });
});

// Check admin
router.post("/check", (req, res) => {
  const { email } = req.body;
  const isAdmin = admins.some(a => a.email === email);

  if (!isAdmin) {
    return res.status(401).json({ message: "Not an admin" });
  }

  res.json({ message: "Admin verified" });
});

// ================= CONTACT MESSAGE SYSTEM =================

// GET all customer messages
router.get("/messages", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Reply to customer
router.post("/reply", async (req, res) => {
  const { contactId, replyMessage } = req.body;

  if (!contactId || !replyMessage) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const contact = await Contact.findById(contactId);

    if (!contact) {
      return res.status(404).json({ message: "Message not found" });
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: 'Online Book Store <no-reply@onlinebookstore.com>',
      to: contact.email,
      subject: "Reply from Online Book Store Support",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <p>Hello ${contact.name},</p>
          <p>${replyMessage}</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>Online Book Store Team</strong></p>
        </div>
      `,
    });

    // Add reply to replies array
    contact.replies = contact.replies || [];
    contact.replies.push({ message: replyMessage, fromAdmin: true });
    await contact.save();

    res.json({ message: "Reply sent successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send reply" });
  }
});

module.exports = router;