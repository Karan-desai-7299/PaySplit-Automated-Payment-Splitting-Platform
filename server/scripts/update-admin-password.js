import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

await mongoose.connect('mongodb://127.0.0.1:27017/upi_qr_system');

// Use lightweight schema just for password update
const schema = new mongoose.Schema({ username: String, password: String, role: String }, { strict: false });
const User = mongoose.model('User', schema);

const admin = await User.findOne({ role: 'admin' });
if (admin) {
  const hashed = await bcrypt.hash('admin@123', 10);
  await User.updateOne({ _id: admin._id }, { $set: { password: hashed } });
  console.log('✅ Password updated for:', admin.username);
} else {
  console.log('No admin found');
}

await mongoose.disconnect();
