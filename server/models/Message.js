import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true,
      index: true,
    },
    vendorUsername: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['admin', 'vendor'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model('Message', messageSchema);
