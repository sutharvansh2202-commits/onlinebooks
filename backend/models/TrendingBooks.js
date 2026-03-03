const mongoose = require("mongoose");

const trendingBooksSchema = new mongoose.Schema({
  bookIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Book" }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TrendingBooks", trendingBooksSchema);
