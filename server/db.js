import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/upi_qr_system';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
}
