import express from 'express';
import Book from '../models/Book.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all books
// @route   GET /api/books
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const books = await Book.find({});
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new book
// @route   POST /api/books
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req, res) => {
  const { title, author, isbn, category, totalCopies } = req.body;

  try {
    const bookExists = await Book.findOne({ isbn });
    if (bookExists) {
      return res.status(400).json({ message: 'Book with this ISBN already exists' });
    }

    const book = await Book.create({
      title,
      author,
      isbn,
      category,
      totalCopies: Number(totalCopies),
      availableCopies: Number(totalCopies)
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
