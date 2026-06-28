import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// STUDENT VIEW
// ==========================================

// @desc    Get logged-in student dashboard data (details, active loans, history)
// @route   GET /api/transactions/student/dashboard
// @access  Private (Student)
router.get('/student/dashboard', protect, async (req, res) => {
  try {
    const studentId = req.user._id;

    // Retrieve transactions for this student
    const activeLoans = await Transaction.find({ student: studentId, status: 'borrowed' })
      .populate('book')
      .exec();

    const history = await Transaction.find({ student: studentId, status: 'returned' })
      .populate('book')
      .exec();

    res.json({
      student: req.user,
      activeLoans,
      history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// ADMIN VIEW
// ==========================================

// @desc    Get students in a specific year and branch
// @route   GET /api/transactions/admin/students/:year/:branch
// @access  Private/Admin
router.get('/admin/students/:year/:branch', protect, adminOnly, async (req, res) => {
  const { year, branch } = req.params;

  try {
    const students = await User.find({ role: 'user', year, branch }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get detailed student profile and active loans/history
// @route   GET /api/transactions/admin/student/:studentId
// @access  Private/Admin
router.get('/admin/student/:studentId', protect, adminOnly, async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const activeLoans = await Transaction.find({ student: student._id, status: 'borrowed' })
      .populate('book')
      .exec();

    const history = await Transaction.find({ student: student._id, status: 'returned' })
      .populate('book')
      .exec();

    res.json({
      student,
      activeLoans,
      history
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Issue a book to a student
// @route   POST /api/transactions/admin/issue
// @access  Private/Admin
router.post('/admin/issue', protect, adminOnly, async (req, res) => {
  const { studentId, bookId } = req.body;

  try {
    // 1. Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 2. Verify book exists and is available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({ message: 'No copies of this book are currently available' });
    }

    // 3. Verify user doesn't already have an active loan of this book
    const alreadyBorrowed = await Transaction.findOne({
      student: studentId,
      book: bookId,
      status: 'borrowed'
    });
    if (alreadyBorrowed) {
      return res.status(400).json({ message: 'Student has already borrowed this book and not returned it' });
    }

    // 4. Update copies
    book.availableCopies -= 1;
    await book.save();

    // 5. Create Transaction
    const tx = await Transaction.create({
      student: studentId,
      book: bookId,
      status: 'borrowed'
    });

    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Return a book
// @route   POST /api/transactions/admin/return
// @access  Private/Admin
router.post('/admin/return', protect, adminOnly, async (req, res) => {
  const { transactionId } = req.body;

  try {
    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    if (tx.status === 'returned') {
      return res.status(400).json({ message: 'Book already marked as returned' });
    }

    // 1. Update book copy counts
    const book = await Book.findById(tx.book);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    // 2. Close transaction
    tx.status = 'returned';
    tx.returnDate = new Date();
    await tx.save();

    res.json({ message: 'Book returned successfully', transaction: tx });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
