const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: Number },
  rating: { type: Number, default: 5 },
  category: { type: String },
  description: { type: String },
  image: { type: String }
});

module.exports = mongoose.model("Book", bookSchema);
