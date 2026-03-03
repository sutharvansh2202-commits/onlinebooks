const express = require("express");
const auth = require("../middleware/authMiddleware");
const Order = require("../models/Order");
const router = express.Router();

// Create a new order
router.post("/", auth, async (req, res) => {
  try {
    const { books, buyerName, buyerAddress, totalAmount } = req.body;
    const userId = req.user && req.user._id ? req.user._id : req.user;
    if (!userId || !books || !buyerName || !buyerAddress || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const order = new Order({ userId, books, buyerName, buyerAddress, totalAmount });
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Optionally: Get all orders for a user
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

module.exports = router;