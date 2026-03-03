const express = require('express');
const nodemailer = require('nodemailer');
const Contact = require("../models/Contact");

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // 1️⃣ Save message to MongoDB
    const newMessage = await Contact.create({
      name,
      email,
      message,
      replied: false
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS,
      },
    });

    // 2️⃣ Send Email To Admin
    await transporter.sendMail({
      from: 'Online Book Store <no-reply@onlinebookstore.com>',
      to: process.env.ADMIN_EMAIL,
      subject: "New Contact Message - Online Book Store",
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    // 3️⃣ Auto Reply To Customer
    await transporter.sendMail({
      from: 'Online Book Store <no-reply@onlinebookstore.com>',
      to: email,
      subject: "We Received Your Message - Online Book Store",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${name}, 📚</h2>
          <p>Thank you for contacting <strong>Online Book Store</strong>.</p>
          <p>Our support team will connect with you within <strong>24 hours</strong>.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Message sent successfully!" });

  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ message: "Failed to send email." });
  }
});

// GET all contact messages (admin)
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages.' });
  }
});

module.exports = router;