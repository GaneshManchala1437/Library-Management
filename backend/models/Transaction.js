import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true
    },
    borrowDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    dueDate: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 14); // 2 weeks default duration
        return d;
      },
      required: true
    },
    returnDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned'],
      default: 'borrowed',
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
