import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: String,
      required: true,
      trim: true
    },
    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    totalCopies: {
      type: Number,
      required: true,
      min: 0
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const Book = mongoose.model('Book', bookSchema);
export default Book;
