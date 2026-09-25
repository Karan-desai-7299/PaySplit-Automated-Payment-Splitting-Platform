import { User } from '../models/User.js';
import { PaymentSession } from '../models/PaymentSession.js';
import { CustomerTransaction } from '../models/CustomerTransaction.js';
import { AuditLog } from '../models/AuditLog.js';
import bcrypt from 'bcryptjs';

export async function getAdminDashboardStats(req, res) {
  try {
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const activeVendors = await User.countDocuments({ role: 'vendor', isActive: true });
    const inactiveVendors = totalVendors - activeVendors;

    const totalSessions = await PaymentSession.countDocuments();
    const completedSessions = await PaymentSession.countDocuments({ status: 'COMPLETED' });
    const pendingSessions = await PaymentSession.countDocuments({ status: { $in: ['PENDING', 'PARTIAL'] } });

    // Aggregate total platform volume
    const revenueAgg = await PaymentSession.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: '$amountPaid' },
          totalBilled: { $sum: '$totalAmount' },
          totalQrs: { $sum: '$totalSlices' },
        },
      },
    ]);

    const metrics = revenueAgg[0] || { totalCollected: 0, totalBilled: 0, totalQrs: 0 };

    // Recent activity
    const recentLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(10);

    return res.json({
      vendors: {
        total: totalVendors,
        active: activeVendors,
        inactive: inactiveVendors,
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        pending: pendingSessions,
      },
      financials: {
        totalCollected: metrics.totalCollected,
        totalBilled: metrics.totalBilled,
        totalQrsGenerated: metrics.totalQrs,
      },
      recentLogs,
    });
  } catch (err) {
    console.error('getAdminDashboardStats error:', err);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
}

export async function listVendors(req, res) {
  try {
    const { search, status } = req.query;
    let query = { role: 'vendor' };

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    if (search) {
      const reg = new RegExp(search, 'i');
      query.$or = [{ username: reg }, { vendorId: reg }, { businessName: reg }, { upiId: reg }, { email: reg }];
    }

    const vendors = await User.find(query).select('-password').sort({ createdAt: -1 });

    // Also get quick stats per vendor
    const vendorStats = await PaymentSession.aggregate([
      {
        $group: {
          _id: '$vendorId',
          totalSessions: { $sum: 1 },
          totalCollected: { $sum: '$amountPaid' },
          pendingSessions: {
            $sum: { $cond: [{ $in: ['$status', ['PENDING', 'PARTIAL']] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = {};
    vendorStats.forEach((s) => {
      statsMap[s._id] = s;
    });

    const enrichedVendors = vendors.map((v) => {
      const s = statsMap[v.vendorId] || { totalSessions: 0, totalCollected: 0, pendingSessions: 0 };
      return {
        ...v.toObject(),
        totalSessions: s.totalSessions,
        totalCollected: s.totalCollected,
        pendingSessions: s.pendingSessions,
      };
    });

    return res.json(enrichedVendors);
  } catch (err) {
    console.error('listVendors error:', err);
    return res.status(500).json({ error: 'Failed to list vendors' });
  }
}

export async function createVendor(req, res) {
  try {
    const {
      username,
      password,
      businessName,
      payeeName,
      upiId,
      maxQrAmount,
      phone,
      email,
      customVendorId,
    } = req.body;

    if (!username || !password || !upiId) {
      return res.status(400).json({ error: 'Username, password, and UPI ID are required.' });
    }

    // Check if username already exists
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Generate or use unique vendorId
    let vendorId = customVendorId ? customVendorId.trim().toUpperCase() : null;
    if (!vendorId) {
      const count = await User.countDocuments({ role: 'vendor' });
      vendorId = `VND-${String(count + 1).padStart(4, '0')}`;
    }

    const existingVndId = await User.findOne({ vendorId });
    if (existingVndId) {
      vendorId = `VND-${Date.now().toString().slice(-5)}`;
    }

    const newVendor = new User({
      username: username.toLowerCase().trim(),
      password,
      role: 'vendor',
      vendorId,
      businessName: businessName || `${username}'s Business`,
      payeeName: payeeName || businessName || username,
      upiId: upiId.trim(),
      maxQrAmount: Number(maxQrAmount) || 1999,
      phone: phone || '',
      email: email || '',
      isActive: true,
    });

    await newVendor.save();

    await AuditLog.create({
      action: 'VENDOR_CREATED',
      performedBy: req.user.username,
      role: 'admin',
      vendorId: newVendor.vendorId,
      details: {
        vendorId: newVendor.vendorId,
        username: newVendor.username,
        businessName: newVendor.businessName,
      },
    });

    return res.status(201).json({
      message: 'Vendor account created successfully',
      vendor: {
        id: newVendor._id,
        vendorId: newVendor.vendorId,
        username: newVendor.username,
        businessName: newVendor.businessName,
        payeeName: newVendor.payeeName,
        upiId: newVendor.upiId,
        maxQrAmount: newVendor.maxQrAmount,
        phone: newVendor.phone,
        email: newVendor.email,
        isActive: newVendor.isActive,
      },
    });
  } catch (err) {
    console.error('createVendor error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create vendor account' });
  }
}

export async function updateVendor(req, res) {
  try {
    const { id } = req.params;
    const { businessName, payeeName, upiId, maxQrAmount, phone, email } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (businessName !== undefined) vendor.businessName = businessName;
    if (payeeName !== undefined) vendor.payeeName = payeeName;
    if (upiId !== undefined) vendor.upiId = upiId;
    if (maxQrAmount !== undefined) vendor.maxQrAmount = Number(maxQrAmount);
    if (phone !== undefined) vendor.phone = phone;
    if (email !== undefined) vendor.email = email;

    await vendor.save();

    await AuditLog.create({
      action: 'VENDOR_UPDATED',
      performedBy: req.user.username,
      role: 'admin',
      vendorId: vendor.vendorId,
      details: { vendorId: vendor.vendorId, changes: req.body },
    });

    return res.json({
      message: 'Vendor updated successfully',
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        username: vendor.username,
        businessName: vendor.businessName,
        payeeName: vendor.payeeName,
        upiId: vendor.upiId,
        maxQrAmount: vendor.maxQrAmount,
        phone: vendor.phone,
        email: vendor.email,
        isActive: vendor.isActive,
      },
    });
  } catch (err) {
    console.error('updateVendor error:', err);
    return res.status(500).json({ error: 'Failed to update vendor' });
  }
}

export async function toggleVendorStatus(req, res) {
  try {
    const { id } = req.params;
    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.isActive = !vendor.isActive;
    await vendor.save();

    await AuditLog.create({
      action: vendor.isActive ? 'VENDOR_ACTIVATED' : 'VENDOR_DEACTIVATED',
      performedBy: req.user.username,
      role: 'admin',
      vendorId: vendor.vendorId,
      details: { vendorId: vendor.vendorId, newStatus: vendor.isActive },
    });

    return res.json({
      message: `Vendor successfully ${vendor.isActive ? 'activated' : 'deactivated'}`,
      isActive: vendor.isActive,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle vendor status' });
  }
}

export async function resetVendorPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.password = newPassword;
    await vendor.save();

    await AuditLog.create({
      action: 'VENDOR_PASSWORD_RESET',
      performedBy: req.user.username,
      role: 'admin',
      vendorId: vendor.vendorId,
      details: { vendorId: vendor.vendorId },
    });

    return res.json({ message: 'Vendor password reset successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password' });
  }
}

export async function deleteVendor(req, res) {
  try {
    const { id } = req.params;
    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendorId = vendor.vendorId;
    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'VENDOR_DELETED',
      performedBy: req.user.username,
      role: 'admin',
      vendorId,
      details: { vendorId, username: vendor.username },
    });

    return res.json({ message: 'Vendor account removed successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete vendor' });
  }
}

export async function getAllSessions(req, res) {
  try {
    const { status, vendorId, limit = 50 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (vendorId) query.vendorId = vendorId;

    const rawSessions = await PaymentSession.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    const sessionIdsToLookup = rawSessions
      .filter((s) => !s.customerName && !s.customerPhone)
      .map((s) => s.sessionId);

    let customerMap = {};
    if (sessionIdsToLookup.length > 0) {
      const custs = await CustomerTransaction.find({
        sessionId: { $in: sessionIdsToLookup },
      }).lean();
      custs.forEach((c) => {
        customerMap[c.sessionId] = c;
      });
    }

    const sessions = rawSessions.map((s) => {
      const item = s.toObject ? s.toObject() : { ...s };
      const cust = customerMap[item.sessionId];
      return {
        ...item,
        customerName: item.customerName || cust?.customerName || '',
        customerPhone: item.customerPhone || cust?.customerPhone || '',
        customerEmail: item.customerEmail || cust?.customerEmail || '',
      };
    });

    return res.json(sessions);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load payment sessions' });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const { limit = 50 } = req.query;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(Number(limit));
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load audit logs' });
  }
}
