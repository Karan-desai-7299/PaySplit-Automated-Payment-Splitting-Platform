import mongoose from 'mongoose';

const customerTransactionSchema = new mongoose.Schema(
  {
    // Link to vendor and session
    vendorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    // Customer info collected at bill creation
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    customerEmail: { type: String, trim: true, lowercase: true, default: '' },
    customerNote: { type: String, trim: true, default: '' },  // e.g. Table #5, Order #102

    // Financial
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const CustomerTransaction = mongoose.model('CustomerTransaction', customerTransactionSchema);
