
const express = require("express");

const Book = require("../models/Book");

const router = express.Router();




// Get all books
router.get("/", async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// Add a new book (auto-calculate discount)
router.post("/", async (req, res) => {
  try {
    const { title, author, price, originalPrice, rating, category, description, image } = req.body;
    let discount = req.body.discount;
    if (originalPrice && price) {
      discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    const newBook = new Book({
      title,
      author,
      price,
      originalPrice,
      discount,
      rating: rating || 5,
      category,
      description,
      image
    });
    await newBook.save();
    res.json({ message: "Book added successfully", book: newBook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// Delete a book by MongoDB _id
router.delete("/:id", async (req, res) => {
  try {
    const result = await Book.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update/edit a book by MongoDB _id
router.put("/:id", async (req, res) => {
  try {
    const { title, author, price, originalPrice, rating, category, description, image, discount } = req.body;
    let updatedDiscount = discount;
    if (originalPrice && price) {
      updatedDiscount = Math.round(((originalPrice - price) / originalPrice) * 100);
    }
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      {
        title,
        author,
        price,
        originalPrice,
        discount: updatedDiscount,
        rating,
        category,
        description,
        image
      },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json({ message: "Book updated successfully", book: updatedBook });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;