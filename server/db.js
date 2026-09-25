import mongoose from 'mongoose';

let cachedConn = null;
let cachedPromise = null;

export async function connectDB() {
  if (cachedConn && mongoose.connection.readyState === 1) {
    return cachedConn;
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/upi_qr_system';

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    }).then((conn) => {
      cachedConn = conn;
      console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}`);
      return conn;
    }).catch((err) => {
      cachedPromise = null;
      console.error(`[Database] MongoDB connection error: ${err.message}`);
      throw err;
    });
  }

  return cachedPromise;
}
