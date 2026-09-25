import app from '../index.js';
import { connectDB } from '../db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Serverless DB connect error:', err);
  }
  return app(req, res);
}
