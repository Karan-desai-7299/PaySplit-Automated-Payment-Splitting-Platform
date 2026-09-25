import mongoose from 'mongoose';

const paymentSliceSchema = new mongoose.Schema(
  {
    sliceId: {
      type: String, // e.g. 'QR-01'
      required: true,
    },
    sliceIndex: {
      type: Number, // 1-based index: 1, 2, 3...
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    upiString: {
      type: String,
      required: true,
    },
    qrCodeDataUrl: {
      type: String,
      required: true,
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
    gatewayName: {
      type: String,
      default: 'DIRECT_UPI',
    },
    gatewayQrId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    bankRrn: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
    },
    paidVia: {
      type: String,
      default: '',
    },
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: {
      type: Date,
    },
  },
  { _id: true }
);

const paymentSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String, // e.g. PAY-20260924-0001
      required: true,
      unique: true,
      index: true,
    },
    vendorId: {
      type: String,
      required: true,
      index: true,
    },
    vendorName: {
      type: String,
      default: '',
    },
    payeeName: {
      type: String,
      default: '',
    },
    upiId: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
    },
    maxQrLimit: {
      type: Number,
      required: true,
    },
    totalSlices: {
      type: Number,
      required: true,
    },
    completedSlices: {
      type: Number,
      default: 0,
    },
    paymentNote: {
      type: String,
      default: '',
    },
    customerName: {
      type: String,
      default: '',
      trim: true,
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },
    customerEmail: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'COMPLETED', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    slices: [paymentSliceSchema],
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentSession = mongoose.model('PaymentSession', paymentSessionSchema);
