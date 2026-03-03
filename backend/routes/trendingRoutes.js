const express = require("express");
const TrendingBooks = require("../models/TrendingBooks");
const router = express.Router();

// Get trending books
router.get("/", async (req, res) => {
  try {
    const trending = await TrendingBooks.findOne();
    res.json(trending ? trending.bookIds : []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update trending books
router.post("/", async (req, res) => {
  try {
    const { bookIds } = req.body;
    if (!Array.isArray(bookIds)) {
      console.error('bookIds is not an array:', bookIds);
      return res.status(400).json({ message: "bookIds must be an array" });
    }
    const mongoose = require('mongoose');
    let objectIds = [];
    try {
      objectIds = bookIds.map(id => {
        if (!id || typeof id !== 'string') throw new Error('Invalid bookId: ' + id);
        return new mongoose.Types.ObjectId(id);
      });
    } catch (err) {
      console.error('ObjectId conversion error:', err);
      return res.status(400).json({ message: 'Invalid bookId(s) provided.' });
    }
    let trending = await TrendingBooks.findOne();
    if (!trending) {
      trending = new TrendingBooks({ bookIds: objectIds });
    } else {
      trending.bookIds = objectIds;
      trending.updatedAt = Date.now();
    }
    await trending.save();
    res.json({ message: "Trending books updated", bookIds });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
