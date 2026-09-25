import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { signToken } from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated. Contact Administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      action: 'USER_LOGIN',
      performedBy: user.username,
      role: user.role,
      vendorId: user.vendorId,
      details: { username: user.username, role: user.role },
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        vendorId: user.vendorId,
        businessName: user.businessName,
        payeeName: user.payeeName,
        upiId: user.upiId,
        maxQrAmount: user.maxQrAmount,
        phone: user.phone,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during authentication.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = req.user;
    return res.json({
      id: user._id,
      username: user.username,
      role: user.role,
      vendorId: user.vendorId,
      businessName: user.businessName,
      payeeName: user.payeeName,
      upiId: user.upiId,
      maxQrAmount: user.maxQrAmount,
      phone: user.phone,
      email: user.email,
      isActive: user.isActive,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
}
