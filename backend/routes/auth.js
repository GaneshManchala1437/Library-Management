import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'vanguard_super_secret_jwt_key_12345', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, pin, password, role, branch, year } = req.body;

  try {
    const userExists = await User.findOne({ pin: pin.toUpperCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this PIN' });
    }

    const user = await User.create({
      name,
      pin: pin.toUpperCase(),
      password,
      role: role || 'user',
      branch: role === 'admin' ? 'Administration' : branch,
      year: role === 'admin' ? 'Staff' : year
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        pin: user.pin,
        role: user.role,
        branch: user.branch,
        year: user.year,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { pin, password } = req.body;

  try {
    const user = await User.findOne({ pin: pin.toUpperCase() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        pin: user.pin,
        role: user.role,
        branch: user.branch,
        year: user.year,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid PIN or Password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Seed database with initial data
// @route   POST /api/auth/seed
// @access  Public (Helper utility)
router.post('/seed', async (req, res) => {
  try {
    // 1. Clear database
    await User.deleteMany({});
    await Book.deleteMany({});
    await Transaction.deleteMany({});

    // 2. Default Users (passwords will be hashed in pre-save middleware)
    const usersData = [
      { name: "Alex Rivers", pin: "STU001", password: "123", role: "user", branch: "Computer Science (CSE)", year: "3rd Year" },
      { name: "Sarah Chen", pin: "STU002", password: "123", role: "user", branch: "Computer Science (CSE)", year: "3rd Year" },
      { name: "Michael Ross", pin: "STU003", password: "123", role: "user", branch: "Electronics & Comm (ECE)", year: "2nd Year" },
      { name: "Emily Watson", pin: "STU004", password: "123", role: "user", branch: "Mechanical Eng (MECH)", year: "1st Year" },
      { name: "David Kim", pin: "STU005", password: "123", role: "user", branch: "Electrical & Electronics (EEE)", year: "4th Year" },
      { name: "Librarian Admin", pin: "admin", password: "admin", role: "admin", branch: "Administration", year: "Staff" }
    ];

    const users = [];
    for (const userData of usersData) {
      const user = await User.create(userData);
      users.push(user);
    }

    // 3. Default Books
    const booksData = [
      { title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "978-0262033848", category: "Computer Science", totalCopies: 5, availableCopies: 4 },
      { title: "Clean Code", author: "Robert C. Martin", isbn: "978-0132350884", category: "Software Engineering", totalCopies: 3, availableCopies: 2 },
      { title: "The Pragmatic Programmer", author: "Andrew Hunt", isbn: "978-0135957059", category: "Programming", totalCopies: 4, availableCopies: 4 },
      { title: "Design Patterns", author: "Erich Gamma", isbn: "978-0201633610", category: "Computer Science", totalCopies: 2, availableCopies: 2 },
      { title: "Artificial Intelligence: A Modern Approach", author: "Stuart Russell", isbn: "978-0136042594", category: "AI & ML", totalCopies: 3, availableCopies: 3 },
      { title: "JavaScript: The Good Parts", author: "Douglas Crockford", isbn: "978-0596517748", category: "Programming", totalCopies: 6, availableCopies: 5 }
    ];

    const books = await Book.insertMany(booksData);

    // 4. Default Transactions
    const stu001 = users.find(u => u.pin === "STU001");
    const stu002 = users.find(u => u.pin === "STU002");
    
    const cleanCode = books.find(b => b.title === "Clean Code");
    const algorithms = books.find(b => b.title === "Introduction to Algorithms");
    const jsGoodParts = books.find(b => b.title === "JavaScript: The Good Parts");

    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);

    const txsData = [
      {
        student: stu001._id,
        book: cleanCode._id,
        borrowDate: twoWeeksAgo,
        dueDate: new Date(new Date().setDate(today.getDate() + 14)),
        status: 'borrowed'
      },
      {
        student: stu001._id,
        book: jsGoodParts._id,
        borrowDate: new Date(new Date().setDate(today.getDate() - 20)),
        dueDate: twoWeeksAgo,
        returnDate: twoWeeksAgo,
        status: 'returned'
      },
      {
        student: stu002._id,
        book: algorithms._id,
        borrowDate: new Date(new Date().setDate(today.getDate() - 5)),
        dueDate: new Date(new Date().setDate(today.getDate() + 9)),
        status: 'borrowed'
      }
    ];

    await Transaction.insertMany(txsData);

    res.json({ message: "Database seeded successfully!", usersCount: users.length, booksCount: books.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
